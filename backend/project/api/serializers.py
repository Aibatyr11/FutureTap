from rest_framework import serializers
from .models import User, Child, Club, ChildClub, ClubPost

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'age', 'bio']


class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Child
        fields = ['id', 'name', 'age', 'interests']


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'description', 'age_limit']


class ChildClubSerializer(serializers.ModelSerializer):
    club = ClubSerializer(read_only=True)

    class Meta:
        model = ChildClub
        fields = ['id', 'club', 'date_joined']


class UserStatsSerializer(serializers.Serializer):
    total_children = serializers.IntegerField()
    total_clubs = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()



class ClubPostSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    available_slots = serializers.SerializerMethodField()

    class Meta:
        model = ClubPost
        fields = [
            'id',
            'club',
            'club_name',
            'author',
            'author_username',
            'title',
            'content',
            'image',
            'max_participants',
            'current_participants',
            'available_slots',
            'created_at',
            'updated_at',
            'is_published',
        ]

    def get_available_slots(self, obj):
        if obj.max_participants == 0:
            return "Без ограничений"
        return f"{obj.current_participants}/{obj.max_participants}"

