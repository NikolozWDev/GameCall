from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.utils import timezone
from .models import Room, Participant, PasswordResetCode, PasswordResetToken, ChatMessage
from .serializers import (
    UserRegisterSerializer,
    UserPublicSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    RoomCreateSerializer,
    RoomJoinSerializer,
    RoomPublicSerializer,
    validate_guest_name,
    ForgotPasswordSerializer,
    VerifyResetCodeSerializer,
    ResetPasswordSerializer,
    ChatMessageSerializer,
)
from .utils.livekit import generate_livekit_token
from django.conf import settings
import uuid
from django.core.cache import cache
from rest_framework import generics, status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
import random
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseForbidden
import hashlib, hmac, json
from rest_framework.decorators import api_view, permission_classes

User = get_user_model()



@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "healthy"})


class GuestStorage:
    @staticmethod
    def getSessionId(request=None):
        if request and hasattr(request, "session"):
            if "guest_id" not in request.session:
                request.session["guest_id"] = str(uuid.uuid4())
                request.session.save()
            return request.session["guest_id"]
        else:
            session_key = request.data.get("session_id") if request else None
            if not session_key:
                session_key = str(uuid.uuid4())
            cache.set(f"guest_session_{session_key}", "active", 86400)
            return session_key


guestStorage = GuestStorage()


@method_decorator(ratelimit(key="ip", rate="5/m", block=True), name="post")
class UserRegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@method_decorator(ratelimit(key="user", rate="10/m", block=True), name="post")
class RoomCreateView(generics.CreateAPIView):
    serializer_class = RoomCreateSerializer
    permission_classes = [IsAuthenticated]


class RoomListView(generics.ListAPIView):
    serializer_class = RoomPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(creator=self.request.user, is_active=True)


class RoomDeleteView(generics.DestroyAPIView):
    queryset = Room.objects.all()
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if instance.creator != self.request.user:
            return Response(
                {"detail": "Only the room creator can delete this room."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.participants.all().delete()
        instance.delete()


class RoomLeaveView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        room = get_object_or_404(Room, pk=pk, is_active=True)
        identity = request.data.get("identity")
        if not identity:
            return Response({"detail": "Identity is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            participant = room.participants.get(identity=identity)
        except Participant.DoesNotExist:
            return Response({"detail": "Participant not found."}, status=status.HTTP_404_NOT_FOUND)

        participant.delete()
        self._cleanup_room_if_empty(room)
        return Response({"detail": "Participant left."}, status=200)

    @staticmethod
    def _cleanup_room_if_empty(room):
        if not room.participants.exists():
            room.delete()


class RoomMuteParticipantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Room, pk=pk)
        if request.user != room.creator:
            return Response(
                {"detail": "Only the room creator can mute participants."},
                status=status.HTTP_403_FORBIDDEN,
            )

        identity = request.data.get("identity")
        if not identity:
            return Response({"detail": "Participant identity is required."}, status=status.HTTP_400_BAD_REQUEST)

        participant = get_object_or_404(Participant, room=room, identity=identity)
        participant.is_muted = True
        participant.save()
        return Response({
            "detail": f"Participant {participant.display_name} has been muted.",
            "identity": identity,
            "action": "mute"
        }, status=200)


class RoomMuteAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Room, pk=pk)
        if request.user != room.creator:
            return Response(
                {"detail": "Only the room creator can mute all participants."},
                status=status.HTTP_403_FORBIDDEN,
            )

        room.participants.all().update(is_muted=True)
        return Response({
            "detail": "All participants have been muted.",
            "action": "mute_all"
        }, status=200)


class RoomDisconnectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Room, pk=pk)
        if request.user != room.creator:
            return Response(
                {"detail": "Only the room creator can disconnect participants."},
                status=status.HTTP_403_FORBIDDEN,
            )

        identity = request.data.get("identity")
        if not identity:
            return Response({"detail": "Participant identity is required."}, status=status.HTTP_400_BAD_REQUEST)

        participant = get_object_or_404(Participant, room=room, identity=identity)
        participant.delete()
        RoomLeaveView._cleanup_room_if_empty(room)
        return Response({
            "detail": f"Participant {participant.display_name} has been disconnected.",
            "identity": identity,
            "action": "disconnect"
        }, status=200)


class RoomEndView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Room, pk=pk)
        if request.user != room.creator:
            return Response(
                {"detail": "Only the room creator can end the room."},
                status=status.HTTP_403_FORBIDDEN,
            )

        room.delete()
        return Response({"detail": "Room has been ended."}, status=200)


@method_decorator(ratelimit(key="ip", rate="15/m", block=True), name="post")
class RoomJoinView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RoomJoinSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        room = serializer.get_room()

        if request.user.is_authenticated:
            identity = f"user-{request.user.id}"
            display_name = request.user.username
            is_admin = request.user == room.creator
        else:
            guest_id = guestStorage.getSessionId(request)
            identity = f"guest-{guest_id}"
            display_name = serializer.validated_data.get("guest_name", "Guest")
            is_admin = False

        participant, created = Participant.objects.get_or_create(
            room=room,
            identity=identity,
            defaults={"display_name": display_name, "is_muted": False}
        )

        # ✅ FIX: Always reset mute on join
        participant.is_muted = False
        participant.save()

        can_publish = not participant.is_muted and (is_admin or room.allow_all_speak)

        try:
            token = generate_livekit_token(
                room_name=str(room.id),
                identity=identity,
                name=display_name,
                is_admin=is_admin,
                can_publish=can_publish,
            )
        except ValueError as e:
            print(f"ERROR: {e}")
            return Response({"detail": str(e)}, status=500)
        except Exception as e:
            print(f"ERROR generating token: {e}")
            return Response({"detail": "Failed to generate token"}, status=500)

        data = RoomPublicSerializer(room).data
        data["livekit"] = {
            "url": settings.LIVEKIT_URL,
            "token": token,
            "is_admin": is_admin,
        }
        print(f"Token identity: {identity}")
        print(f"Room ID: {str(room.id)}")
        print(f"Token first 50 chars: {token[:50]}...")
        data["server_time"] = timezone.now().isoformat()
        return Response(data, status=200)


class RoomDetailView(generics.RetrieveAPIView):
    serializer_class = RoomPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Room.objects.filter(is_active=True).prefetch_related('participants')


class UserUpdateView(generics.UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key="user", rate="3/m", block=True))
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed successfully."}, status=200)


def send_reset_code_email(email, code):
    subject = "GameCall – Password Reset Code"
    text_content = f"Your password reset code is: {code}\nThis code is valid for 1 minute."
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background-color: #04070E; color: #fff; border-radius: 10px; text-align: center;">
        <h2 style="color: #0F7C9D;">GameCall</h2>
        <p>You requested a password reset.</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0F7C9D;">{code}</p>
        <p style="color: #888;">This code is valid for 1 minute.</p>
    </div>
    """
    msg = EmailMultiAlternatives(subject, text_content, None, [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()


@method_decorator(ratelimit(key="ip", rate="3/m", block=True), name="post")
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        # Invalidate old unused codes so it is it to delete or something else...
        PasswordResetCode.objects.filter(email=email, is_used=False).update(is_used=True)

        code = f"{random.randint(100000, 999999):06d}"
        PasswordResetCode.objects.create(email=email, code=code)

        send_reset_code_email(email, code)

        return Response({"detail": "A 6‑digit code has been sent to your email."}, status=200)


@method_decorator(ratelimit(key="ip", rate="5/m", block=True), name="post")
class VerifyResetCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyResetCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_code = serializer.validated_data['reset_code']
        reset_code.is_used = True
        reset_code.save()

        user = User.objects.get(email=reset_code.email)
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        token_obj = PasswordResetToken.objects.create(user=user)

        return Response({"reset_token": str(token_obj.token)}, status=200)


@method_decorator(ratelimit(key="ip", rate="5/m", block=True), name="post")
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_token = serializer.validated_data['reset_token']
        new_password = serializer.validated_data['new_password']

        user = reset_token.user
        user.set_password(new_password)
        user.save()

        reset_token.is_used = True
        reset_token.save()

        return Response({"detail": "Password has been reset successfully."}, status=200)


class MessageListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id, is_active=True)
        messages = room.messages.all().order_by("created_at")[:50]
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @method_decorator(ratelimit(key="ip", rate="20/m", block=True))
    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id, is_active=True)
        identity = request.data.get("identity")
        display_name = request.data.get("display_name")
        text = request.data.get("text", "").strip()

        if not identity or not display_name or not text:
            return Response(
                {"detail": "identity, display_name, and text are required."},
                status=400,
            )
        if len(text) > 1000:
            return Response({"detail": "Message too long."}, status=400)

        if not room.participants.filter(identity=identity).exists():
            return Response(
                {"detail": "Not a participant of this room."},
                status=403,
            )

        message = ChatMessage.objects.create(
            room=room,
            identity=identity,
            display_name=display_name,
            text=text,
        )
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=201)


class ContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get("name", "").strip()
        email = request.data.get("email", "").strip()
        subject = request.data.get("subject", "").strip()
        message = request.data.get("message", "").strip()

        if not all([name, email, subject, message]):
            return Response(
                {"detail": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        full_message = f"""
New contact form submission from GameCall:

Name: {name}
Email: {email}
Subject: {subject}

Message:
{message}
        """.strip()

        try:
            send_mail(
                subject=f"GameCall Contact: {subject}",
                message=full_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=["gigiashvilinikoloz@gmail.com"],
                fail_silently=False,
            )
            return Response({"detail": "Message sent successfully."}, status=200)
        except Exception as e:
            return Response(
                {"detail": "Failed to send message. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@csrf_exempt
def livekit_webhook(request):
    secret = settings.LIVEKIT_WEBHOOK_SECRET
    body = request.body
    signature = request.headers.get("LiveKit-Webhook-Signature", "")

    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return HttpResponseForbidden("Invalid signature")

    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        return HttpResponse(status=400)

    if event.get("event") == "participant_disconnected":
        participant_identity = event["participant"]["identity"]
        room_name = event["room"]["name"]

        try:
            room = Room.objects.get(id=room_name)
        except Room.DoesNotExist:
            return HttpResponse(status=200)

        Participant.objects.filter(room=room, identity=participant_identity).delete()

        if not room.participants.exists():
            room.delete()

    return HttpResponse(status=200)