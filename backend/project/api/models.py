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


class ClubPost(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='club_posts')
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.ImageField(upload_to='club_posts/', blank=True, null=True)

    max_participants = models.PositiveIntegerField(default=0)
    current_participants = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.club.name})"

    @property
    def available_slots(self):
        """Возвращает, сколько мест осталось"""
        if self.max_participants == 0:
            return None  # если лимита нет
        return max(self.max_participants - self.current_participants, 0)
