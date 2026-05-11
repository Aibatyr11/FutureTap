
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """Extended user model for FutureTap"""
    email = models.EmailField(unique=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    interests = models.JSONField(default=list, blank=True)  # ['STEM', 'Music', 'Arts']

    # For recommendations
    preferred_categories = models.JSONField(default=list, blank=True)
    preferred_schedule = models.JSONField(default=list, blank=True)  # ['Monday', 'Wednesday']

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class Category(models.Model):
    """Club categories: STEM, Arts, Sports, Music"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=10, blank=True)  # emoji
    color = models.CharField(max_length=20, default='blue')

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Coach(models.Model):
    """Club coaches/instructors"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coach_profile',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100)
    avatar = models.CharField(max_length=10, default='👨‍🏫')  # emoji avatar
    photo = models.ImageField(upload_to='coaches/', blank=True, null=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=5.0)
    students_count = models.PositiveIntegerField(default=0)
    experience = models.CharField(max_length=50, default='1 year')  # "5 years"
    specialization = models.CharField(max_length=100, default='All Levels')
    availability = models.CharField(max_length=50, default='Available Now')
    color = models.CharField(max_length=20, default='blue')
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Club(models.Model):
    """Club/activity model matching frontend structure"""
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)

    # Schedule
    day = models.CharField(max_length=100)  # "Monday & Wednesday"
    time = models.CharField(max_length=50)  # "4:00 PM - 6:00 PM"

    # Visual
    icon = models.CharField(max_length=10, default='🎯')  # emoji
    color = models.CharField(max_length=20, default='blue')
    image = models.ImageField(upload_to='clubs/', blank=True, null=True)

    # Capacity
    capacity = models.PositiveIntegerField(default=20)

    # Details
    age_range = models.CharField(max_length=20, default='6+')  # "8+" or "8-16"
    min_age = models.PositiveIntegerField(default=6)
    max_age = models.PositiveIntegerField(default=18)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=5.0)
    featured = models.BooleanField(default=False)
    location = models.CharField(max_length=200, default='Online')

    # Relationships
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='clubs'
    )
    coaches = models.ManyToManyField(Coach, related_name='clubs', blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    @property
    def enrolled_count(self):
        """Number of active enrollments"""
        return self.enrollments.filter(status='active').count()

    @property
    def available_spots(self):
        """Remaining capacity"""
        return max(0, self.capacity - self.enrolled_count)

    def __str__(self):
        return self.title


class Child(models.Model):
    """Children linked to parent users"""
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='children'
    )
    name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    interests = models.JSONField(default=list, blank=True)  # ['STEM', 'Music']
    avatar = models.CharField(max_length=10, default='👦')

    def __str__(self):
        return f"{self.name} ({self.parent.username})"


class Enrollment(models.Model):
    """Club enrollment records"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    child = models.ForeignKey(
        Child,
        on_delete=models.CASCADE,
        related_name='enrollments',
        null=True,
        blank=True
    )
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    coach = models.ForeignKey(
        Coach,
        on_delete=models.SET_NULL,
        null=True,
        related_name='enrollments'
    )

    enrollment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['user', 'club', 'child']

    def __str__(self):
        if self.child:
            return f"{self.child.name} -> {self.club.title}"
        return f"{self.user.email} -> {self.club.title}"


class Lesson(models.Model):
    """Individual lessons within a club"""
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='lessons')
    coach = models.ForeignKey(Coach, on_delete=models.SET_NULL, null=True, related_name='lessons')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    meet_link = models.URLField(blank=True, null=True)

    # Флаг аудио-фиксации: становится True после успешной загрузки аудиозаписи урока
    is_recorded = models.BooleanField(default=False)
    # Путь к аудиофайлу внутри MEDIA_ROOT (напр.: lesson_audios/lesson_1.webm)
    audio_file_path = models.CharField(max_length=500, blank=True, default='')

    # Статус AI-обработки аудиозаписи урока.
    # Значения: 'pending'     — запись загружена, обработка ещё не запускалась
    #            'processing'  — пайплайн Whisper→Grok запущен, ждём результата
    #            'completed'   — отчёт успешно сохранён в MongoDB
    #            'failed'      — произошла ошибка на одном из этапов
    AI_STATUS_CHOICES = [
        ('pending',    'Ожидает обработки'),
        ('processing', 'Обрабатывается'),
        ('completed',  'Завершено'),
        ('failed',     'Ошибка'),
    ]
    ai_status = models.CharField(
        max_length=20,
        choices=AI_STATUS_CHOICES,
        default='pending',
        db_index=True,  # индекс для быстрой фильтрации по статусу
    )

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.club.title} - {self.date}"


class ContactMessage(models.Model):
    """Contact form submissions"""
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject} - {self.email}"


class ClubPost(models.Model):
    """Club announcements and posts"""
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='club_posts'
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.ImageField(upload_to='club_posts/', blank=True, null=True)

    max_participants = models.PositiveIntegerField(default=0)
    current_participants = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.club.title})"

    @property
    def available_slots(self):
        if self.max_participants == 0:
            return None
        return max(self.max_participants - self.current_participants, 0)


class RecommendationLog(models.Model):
    """Log of AI recommendations for analytics"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recommendation_logs'
    )
    child = models.ForeignKey(
        Child,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    recommended_clubs = models.JSONField(default=list)
    user_preferences = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recommendations for {self.user.email} at {self.created_at}"
