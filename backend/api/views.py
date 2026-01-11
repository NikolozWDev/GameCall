from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from ratelimit.decorators import RateLimitDecorator
from .models import Room
User = get_user_model()
from .serializers import UserRegisterSerializer, UserPublicSerializer, RoomCreateSerializer, RoomJoinSerializer, RoomPublicSerializer

# Create your views here.

# class UserRegisterView(generics.createAPIView):
#     serializer_class = UserRegisterSerializer
#     permission_classes = [AllowAny]

#     @ratelimit(key='ip', rate='5/m', method='POST', block=True)
#     def post(self, request, *args, **kwargs):
        