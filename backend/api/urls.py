from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView
from .views import UserRegisterView, CustomTokenObtainPairView, CustomTokenRefreshView, UserDetailView, RoomCreateView, RoomListView, RoomJoinView, RoomDetailView
app_name = "api"

urlpatterns = [
    path("user/register/", UserRegisterView.as_view(), name="register"),
    path("user/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("user/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("user/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("user/me/", UserDetailView.as_view(), name="user_detail"),
    path("rooms/", RoomListView.as_view(), name="room_list"),
    path("rooms/create/", RoomCreateView.as_view(), name="room_create"),
    path("rooms/join/", RoomJoinView.as_view(), name="room_join"),
    path("rooms/<uuid:pk>/", RoomDetailView.as_view(), name="room_detail")
]