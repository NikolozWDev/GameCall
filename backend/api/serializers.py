from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import Room
User = get_user_model()


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("email", "username", "password", "password2")
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
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


class UserPublicSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = ("id", "email", "username")
        read_only_fields = fields


class RoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ("id", "name", "room_code", "created_at")
        read_only_fields = ("id", "room_code", "created_at")

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

    def validate_room_code(self, value):
        try:
            room = Room.objects.get(room_code=value, is_active=True)
        except Room.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive room code")
        return value
    
    def get_room(self):
        room_code = self.validated_data["room_code"]
        return Room.objects.get(room_code=room_code)


class RoomPublicSerializer(serializers.ModelSerializer):
    creator = UserPublicSerializer(read_only=True)

    class Meta:
        model = Room
        fields = ("id", "name", "room_code", "creator", "is_active", "created_at")