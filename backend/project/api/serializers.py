from rest_framework import serializers
from .models import User, Child, Club, ChildClub

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
