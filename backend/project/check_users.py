import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Coach

User = get_user_model()

def reset_any_coach_password():
    coach = Coach.objects.exclude(user=None).first()
    if not coach:
        print("No coaches found with a linked user.")
        # Create one then
        user = User.objects.create_user(
            username='teacher',
            email='teacher@example.com',
            password='teacher123',
            first_name='Sarah',
            last_name='Johnson'
        )
        coach = Coach.objects.create(user=user, name='Sarah Johnson')
        print(f"Created new teacher: teacher@example.com / teacher123")
    else:
        user = coach.user
        user.set_password('teacher123')
        user.save()
        print(f"Teacher found: {user.email}")
        print(f"Username: {user.username}")
        print(f"Password reset to: teacher123")

if __name__ == "__main__":
    reset_any_coach_password()
