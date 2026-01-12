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

    def post(self, request, *args, **kwargs):
        serializer = RoomJoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        room = serializer.get_room()
        room_data = RoomPublicSerializer(room).data
        return Response(room_data, status=status.HTTP_200_OK)


class RoomDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = RoomPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(creator=self.request.user)