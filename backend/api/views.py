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
from .models import Room
User = get_user_model()
from .serializers import UserRegisterSerializer, UserPublicSerializer, RoomCreateSerializer, RoomJoinSerializer, RoomPublicSerializer
import uuid
from django.core.cache import cache
from .utils.livekit import generate_livekit_token
from django.conf import settings

class GuestStorage:
    @staticmethod
    def getSessionId(request=None):
        if request and hasattr(request, 'session'):
            if 'guest_id' not in request.session:
                request.session['guest_id'] = str(uuid.uuid4())
                request.session.save()
            return request.session['guest_id']
        else:
            session_key = request.data.get('session_id') if request else None
            if not session_key:
                session_key = str(uuid.uuid4())
            cache.set(f'guest_session_{session_key}', 'active', 86400)
            return session_key

guestStorage = GuestStorage()

# Create your views here.

@method_decorator(
    ratelimit(key='ip', rate='5/m', block=True),
    name='post'
)
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


@method_decorator(
    ratelimit(key='user', rate='10/m', block=True),
    name='post'
)
class RoomCreateView(generics.CreateAPIView):
    serializer_class = RoomCreateSerializer
    permission_classes = [IsAuthenticated]


class RoomListView(generics.ListAPIView):
    serializer_class = RoomPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(creator=self.request.user)


@method_decorator(
    ratelimit(key='ip', rate='15/m', block=True),
    name='post'
)
class RoomJoinView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RoomJoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        room = serializer.get_room()

        if not room.is_active:
            return Response(
                {"detail": "Room is closed"},
                status=status.HTTP_403_FORBIDDEN
            )

        is_admin = False

        if request.user.is_authenticated:
            identity = f"user-{request.user.id}"
            name = request.user.username
            is_admin = (request.user == room.creator)
        else:
            guest_id = guestStorage.getSessionId(request)
            identity = f"guest-{guest_id}"
            name = request.data.get("guest_name", "Guest")

        token = generate_livekit_token(
            room_name=str(room.id),
            identity=identity,
            name=name,
            is_admin=is_admin
        )

        data = RoomPublicSerializer(room).data
        data["livekit"] = {
            "url": settings.LIVEKIT_URL,
            "token": token,
            "is_admin": is_admin
        }

        return Response(data, status=200)


class RoomDetailView(generics.RetrieveAPIView):
    serializer_class = RoomPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Room.objects.filter(is_active=True)