from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
import uuid
import secrets

# Create your models here.
class User(AbstractUser):
    email = models.EmailField(unique=True)

    REQUIRED_FIELDS = ["username"]
    USERNAME_FIELD = "email"

    def __str__(self):
        return self.email


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rooms")
    name = models.CharField(max_length=100)
    room_code = models.CharField(max_length=10, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.room_code:
            self.room_code = self.generate_room_code()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_room_code():
        return secrets.token_urlsafe(6).upper()[:8]
    
    def __str__(self):
        return f"{self.name} ({self.room_code})"