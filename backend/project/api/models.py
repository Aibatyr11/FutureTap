from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
class User(AbstractUser):
    age = models.PositiveIntegerField(null=True, blank=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.username


class Child(models.Model):
    parent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='children')
    name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    interests = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.parent.username})"


class Club(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    age_limit = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class ChildClub(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='enrollments')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='members')
    date_joined = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.child.name} → {self.club.name}"
