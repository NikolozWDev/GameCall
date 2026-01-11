from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from ratelimit.decorators import ratelimit
from .models import Room
User = get_user_model()
from .serializers import UserRegisterSerializer, UserPublicSerializer, RoomCreateSerializer, RoomJoinSerializer, RoomPublicSerializer

# Create your views here.

class UserRegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    @ratelimit(key='ip', rate='5/m', method='POST', block=True)
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class RoomCreateView(generics.CreateAPIView):
    serializer_class = RoomCreateSerializer
    permission_classes = [IsAuthenticated]

    @ratelimit(key='user', rate='10/m', method='POST', block=True)
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RoomListView(generics.ListAPIView):
    serializer_class = RoomPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(creator=self.request.user)


class RoomJoinView(APIView):
    permission_classes = [AllowAny]

    @ratelimit(key='ip', rate='15/m', method='POST', block=True)
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