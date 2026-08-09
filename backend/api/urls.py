from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView
from .views import (
    UserRegisterView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    UserDetailView,
    RoomCreateView,
    RoomListView,
    RoomJoinView,
    RoomDetailView,
    RoomDeleteView,
    RoomLeaveView,
    RoomMuteParticipantView,
    RoomMuteAllView,
    RoomDisconnectView,
    RoomEndView,
    UserUpdateView,
    PasswordChangeView,
    ForgotPasswordView,
    VerifyResetCodeView,
    ResetPasswordView,
    MessageListCreateView,
    ContactView,
    livekit_webhook
)

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
    path("rooms/<uuid:pk>/", RoomDetailView.as_view(), name="room_detail"),
    path("rooms/<uuid:pk>/delete/", RoomDeleteView.as_view(), name="room_delete"),
    path("rooms/<uuid:pk>/leave/", RoomLeaveView.as_view(), name="room_leave"),
    path("rooms/<uuid:pk>/mute/", RoomMuteParticipantView.as_view(), name="room_mute"),
    path("rooms/<uuid:pk>/mute-all/", RoomMuteAllView.as_view(), name="room_mute_all"),
    path("rooms/<uuid:pk>/disconnect/", RoomDisconnectView.as_view(), name="room_disconnect"),
    path("rooms/<uuid:pk>/end/", RoomEndView.as_view(), name="room_end"),
    path("user/me/update/", UserUpdateView.as_view(), name="user_update"),
    path("user/me/change-password/", PasswordChangeView.as_view(), name="password_change"),
    path("user/forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("user/verify-reset-code/", VerifyResetCodeView.as_view(), name="verify_reset_code"),
    path("user/reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("rooms/<uuid:room_id>/messages/", MessageListCreateView.as_view(), name="room_messages"),
    path("contact/", ContactView.as_view(), name="contact"),
    path("livekit/webhook/", livekit_webhook, name="livekit_webhook"),
]