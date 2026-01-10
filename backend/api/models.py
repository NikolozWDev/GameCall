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