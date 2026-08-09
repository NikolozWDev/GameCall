import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import Room, Participant, PasswordResetCode, PasswordResetToken, ChatMessage

User = get_user_model()


def validate_guest_name(value):
    value = value.strip()
    if len(value) < 2 or len(value) > 25:
        raise serializers.ValidationError("Display name must be between 2 and 25 characters.")
    if re.search(r"<[^>]*>", value):
        raise serializers.ValidationError("Display name contains invalid characters.")
    if re.search(r"javascript:", value, re.IGNORECASE):
        raise serializers.ValidationError("Display name contains invalid content.")
    if value.count(" ") == len(value):
        raise serializers.ValidationError("Display name cannot be only spaces.")
    if len(value) > 0 and value.count(" ") / len(value) > 0.5:
        raise serializers.ValidationError("Display name has too many spaces.")
    return value


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("email", "username", "password", "password2")

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

    def validate_username(self, value):
        value = value.strip()
        if len(value) < 3 or len(value) > 30:
            raise serializers.ValidationError("Username must be between 3 and 30 characters.")
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError("Username may only contain letters, numbers and underscores.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        try:
            validate_password(attrs["password"])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"]
        )
        return user


class RoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ("id", "name", "room_code", "created_at")
        read_only_fields = ("id", "room_code", "created_at")

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 1 or len(value) > 100:
            raise serializers.ValidationError("Room name must be between 1 and 100 characters.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        if not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        room = Room.objects.create(
            creator=request.user,
            name=validated_data["name"]
        )
        return room


class RoomJoinSerializer(serializers.Serializer):
    room_code = serializers.CharField(max_length=10)
    guest_name = serializers.CharField(required=False, allow_blank=True)

    def validate_room_code(self, value):
        try:
            room = Room.objects.get(room_code=value, is_active=True)
        except Room.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive room code")
        return value

    def validate_guest_name(self, value):
        if not value and not self.context.get("request").user.is_authenticated:
            raise serializers.ValidationError("Guest name is required when not logged in.")
        return validate_guest_name(value) if value else value

    def get_room(self):
        room_code = self.validated_data["room_code"]
        return Room.objects.get(room_code=room_code)


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "profile_picture_url")


class ParticipantPublicSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Participant
        fields = ("identity", "display_name", "is_muted", "profile_picture_url")

    def get_profile_picture_url(self, obj):
        if obj.identity.startswith("user-"):
            try:
                user_id = int(obj.identity.split("-", 1)[1])
                user = User.objects.filter(id=user_id).first()
                if user and user.profile_picture_url:
                    return user.profile_picture_url
            except (IndexError, ValueError):
                pass
        return None


class RoomPublicSerializer(serializers.ModelSerializer):
    creator = UserPublicSerializer(read_only=True)
    duration = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ("id", "name", "room_code", "creator", "is_active", "created_at", "duration", "participant_count", "participants")

    def get_participant_count(self, obj):
        return obj.participants.count()

    def get_participants(self, obj):
        participants_qs = obj.participants.all()
        return ParticipantPublicSerializer(participants_qs, many=True).data


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "profile_picture_url")
        extra_kwargs = {
            "username": {"required": False},
            "profile_picture_url": {"required": False},
        }

    def validate_username(self, value):
        value = value.strip()
        if len(value) < 3 or len(value) > 30:
            raise serializers.ValidationError("Username must be 3-30 characters.")
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError("Letters, numbers, underscores only.")
        if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    new_password2 = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        try:
            validate_password(attrs['new_password'], user=self.context['request'].user)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": e.messages})
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email address.")
        return value


class VerifyResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, attrs):
        email = attrs['email']
        code = attrs['code']
        try:
            reset_code = PasswordResetCode.objects.get(
                email=email, code=code, is_used=False
            )
        except PasswordResetCode.DoesNotExist:
            raise serializers.ValidationError({"code": "Invalid or expired code."})
        if reset_code.is_expired():
            raise serializers.ValidationError({"code": "Code has expired. Please request a new one."})
        attrs['reset_code'] = reset_code
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8, style={"input_type": "password"})
    new_password2 = serializers.CharField(style={"input_type": "password"})

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        try:
            validate_password(attrs['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": e.messages})
        try:
            reset_token = PasswordResetToken.objects.get(
                token=attrs['token'], is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired token."})
        if reset_token.is_expired():
            raise serializers.ValidationError({"token": "Token has expired. Please start over."})
        attrs['reset_token'] = reset_token
        return attrs


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("id", "identity", "display_name", "text", "created_at")
        read_only_fields = ("id", "created_at")