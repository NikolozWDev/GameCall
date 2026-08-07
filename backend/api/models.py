from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import uuid
import secrets


class User(AbstractUser):
    email = models.EmailField(unique=True)
    profile_picture_url = models.URLField(max_length=500, blank=True, null=True)

    REQUIRED_FIELDS = ["username"]
    USERNAME_FIELD = "email"

    def __str__(self):
        return self.email


class PasswordResetCode(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() - self.created_at > timedelta(minutes=1)


class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() - self.created_at > timedelta(minutes=10)


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    room_code = models.CharField(max_length=10, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    max_participants = models.PositiveIntegerField(default=12)
    created_at = models.DateTimeField(auto_now_add=True)
    allow_all_speak = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.room_code:
            self.room_code = secrets.token_urlsafe(6).upper()[:8]
        super().save(*args, **kwargs)

    @property
    def duration(self):
        if self.is_active:
            delta = timezone.now() - self.created_at
        else:
            delta = timedelta(0)
        total_seconds = int(delta.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    @classmethod
    def cleanup_inactive_rooms(cls):
        threshold = timezone.now() - timedelta(minutes=5)
        cls.objects.filter(is_active=False).delete()


class Participant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="participants")
    identity = models.CharField(max_length=200)
    display_name = models.CharField(max_length=50)
    is_muted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("room", "identity")