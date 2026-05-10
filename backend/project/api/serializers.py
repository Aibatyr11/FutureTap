from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import (
    Category, Coach, Club, Child, Enrollment,
    Lesson, ContactMessage, ClubPost, RecommendationLog
)

User = get_user_model()


# ============== Auth Serializers ==============

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'age', 'bio', 'avatar', 'interests',
            'preferred_categories', 'preferred_schedule'
        ]
        read_only_fields = ['id', 'email']


class UserProfileSerializer(serializers.ModelSerializer):
    enrollments_count = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    is_coach = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'age', 'bio', 'avatar', 'interests',
            'preferred_categories', 'preferred_schedule',
            'enrollments_count', 'children_count', 'is_coach'
        ]
        read_only_fields = ['id', 'email', 'is_coach']

    def get_enrollments_count(self, obj):
        return obj.enrollments.filter(status='active').count()

    def get_children_count(self, obj):
        return obj.children.count()

    def get_is_coach(self, obj):
        return hasattr(obj, 'coach_profile') and obj.coach_profile is not None


# ============== Category Serializers ==============

class CategorySerializer(serializers.ModelSerializer):
    clubs_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'color', 'clubs_count']

    def get_clubs_count(self, obj):
        return obj.clubs.filter(is_active=True).count()


# ============== Coach Serializers ==============

class CoachSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coach
        fields = [
            'id', 'name', 'avatar', 'photo', 'rating',
            'students_count', 'experience', 'specialization',
            'availability', 'color', 'bio'
        ]


class CoachListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for lists"""
    students = serializers.IntegerField(source='students_count', read_only=True)

    class Meta:
        model = Coach
        fields = [
            'id', 'name', 'avatar', 'rating', 'students',
            'experience', 'specialization', 'availability', 'color'
        ]


# ============== Club Serializers ==============

class ClubListSerializer(serializers.ModelSerializer):
    """Serializer matching frontend ClubCard data structure (camelCase)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    enrolled = serializers.IntegerField(source='enrolled_count', read_only=True)
    category = serializers.CharField(source='category.name', read_only=True)
    # Frontend expects camelCase
    ageRange = serializers.CharField(source='age_range', read_only=True)

    class Meta:
        model = Club
        fields = [
            'id', 'title', 'day', 'time', 'icon', 'color',
            'capacity', 'enrolled', 'ageRange', 'rating',
            'featured', 'category', 'category_name', 'location'
        ]


class ClubDetailSerializer(serializers.ModelSerializer):
    """Full club details"""
    category = CategorySerializer(read_only=True)
    coaches = CoachListSerializer(many=True, read_only=True)
    enrolled = serializers.IntegerField(source='enrolled_count', read_only=True)
    available_spots = serializers.IntegerField(read_only=True)

    class Meta:
        model = Club
        fields = [
            'id', 'title', 'description', 'day', 'time',
            'icon', 'color', 'image', 'capacity', 'enrolled',
            'available_spots', 'age_range', 'min_age', 'max_age',
            'rating', 'featured', 'location', 'category', 'coaches',
            'created_at', 'updated_at'
        ]


class ClubCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating clubs/classes"""
    class Meta:
        model = Club
        fields = [
            'id', 'title', 'description', 'day', 'time',
            'capacity', 'min_age', 'max_age', 'location', 'category',
            'icon', 'color'
        ]


# ============== Child Serializers ==============

class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Child
        fields = ['id', 'name', 'age', 'interests', 'avatar']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['parent'] = self.context['request'].user
        return super().create(validated_data)


# ============== Enrollment Serializers ==============

class EnrollmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ['club', 'coach', 'child']

    def validate(self, attrs):
        user = self.context['request'].user
        club = attrs['club']
        child = attrs.get('child')

        # Check capacity
        if club.available_spots <= 0:
            raise serializers.ValidationError("This club is full")

        # Check if already enrolled (with or without child)
        filter_kwargs = {
            'user': user,
            'club': club,
            'status': 'active'
        }
        # Only include child filter if child is provided
        if child is not None:
            filter_kwargs['child'] = child

        existing = Enrollment.objects.filter(**filter_kwargs).exists()
        if existing:
            raise serializers.ValidationError("Already enrolled in this club")

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class EnrollmentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'username', 'avatar']


class EnrollmentSerializer(serializers.ModelSerializer):
    club = ClubListSerializer(read_only=True)
    coach = CoachListSerializer(read_only=True)
    child = ChildSerializer(read_only=True)
    user = EnrollmentUserSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'club', 'coach', 'child', 'user',
            'enrollment_date', 'status', 'notes'
        ]
        read_only_fields = ['id', 'enrollment_date']


# ============== Lesson Serializers ==============

class LessonSerializer(serializers.ModelSerializer):
    club_title = serializers.CharField(source='club.title', read_only=True)
    coach_name = serializers.CharField(source='coach.name', read_only=True)
    # Полный URL аудиофайла (или null если записи нет)
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'club', 'club_title', 'coach', 'coach_name',
            'title', 'description', 'date', 'start_time', 'end_time',
            'meet_link', 'is_recorded', 'audio_url'
        ]

    def get_audio_url(self, obj):
        """Returns full URL to the audio file, or null if not recorded."""
        if not obj.is_recorded or not obj.audio_file_path:
            return None
        request = self.context.get('request')
        # Формируем полный URL: http://localhost:8000/media/lesson_audios/lesson_1.webm
        if request:
            from django.conf import settings
            return request.build_absolute_uri(settings.MEDIA_URL + obj.audio_file_path)
        return None


class LessonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            'id', 'club', 'title', 'description', 
            'date', 'start_time', 'end_time', 'meet_link'
        ]


# ============== Contact Serializers ==============

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


# ============== ClubPost Serializers ==============

class ClubPostSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.title', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    available_slots = serializers.SerializerMethodField()

    class Meta:
        model = ClubPost
        fields = [
            'id', 'club', 'club_name', 'author', 'author_name',
            'title', 'content', 'image',
            'max_participants', 'current_participants', 'available_slots',
            'created_at', 'updated_at', 'is_published'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_available_slots(self, obj):
        if obj.max_participants == 0:
            return "Unlimited"
        return f"{obj.current_participants}/{obj.max_participants}"


# ============== Recommendation Serializers ==============

class MLRecommendationRequestSerializer(serializers.Serializer):
    """Input for ML-based recommendation engine"""
    interests = serializers.CharField(
        required=True,
        help_text="Text description of user interests (e.g., 'I like robotics and programming')"
    )
    top_n = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20,
        help_text="Number of recommendations to return (1-20)"
    )


class RecommendationRequestSerializer(serializers.Serializer):
    """Input for recommendation engine"""
    child_id = serializers.IntegerField(required=False)
    interests = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    age = serializers.IntegerField(required=False)
    preferred_days = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    max_results = serializers.IntegerField(default=5, min_value=1, max_value=20)


class RecommendationResponseSerializer(serializers.Serializer):
    """Output from recommendation engine"""
    clubs = ClubListSerializer(many=True)
    reason = serializers.CharField()
    confidence_score = serializers.FloatField()


class RecommendationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationLog
        fields = ['id', 'recommended_clubs', 'user_preferences', 'created_at']
        read_only_fields = ['id', 'created_at']


# ============== Stats Serializers ==============

class UserStatsSerializer(serializers.Serializer):
    total_children = serializers.IntegerField()
    total_clubs = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
