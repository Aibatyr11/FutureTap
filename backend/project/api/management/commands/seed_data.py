"""
Management command to seed the database with test data matching frontend structure.
Run: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Category, Coach, Club, Child, Enrollment

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with test data for FutureTap'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create Categories
        categories_data = [
            {'name': 'STEM', 'slug': 'stem', 'icon': '🔬', 'color': 'blue'},
            {'name': 'Arts', 'slug': 'arts', 'icon': '🎨', 'color': 'pink'},
            {'name': 'Sports', 'slug': 'sports', 'icon': '⚽', 'color': 'green'},
            {'name': 'Music', 'slug': 'music', 'icon': '🎵', 'color': 'orange'},
        ]

        categories = {}
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories[cat_data['name']] = cat
            if created:
                self.stdout.write(f'  Created category: {cat.name}')

        # Create Coaches (matching frontend Enrollment.jsx)
        coaches_data = [
            {
                'name': 'Sarah Johnson',
                'avatar': '👩‍🏫',
                'rating': 4.9,
                'students_count': 120,
                'experience': '5 years',
                'specialization': 'Beginner Friendly',
                'availability': 'Available Now',
                'color': 'blue',
            },
            {
                'name': 'Michael Chen',
                'avatar': '👨‍💼',
                'rating': 4.8,
                'students_count': 95,
                'experience': '8 years',
                'specialization': 'Advanced Training',
                'availability': 'Available Now',
                'color': 'purple',
            },
            {
                'name': 'Emily Rodriguez',
                'avatar': '👩‍🎓',
                'rating': 5.0,
                'students_count': 150,
                'experience': '6 years',
                'specialization': 'All Levels',
                'availability': 'Available in 30 min',
                'color': 'green',
            },
            {
                'name': 'David Kim',
                'avatar': '👨‍🏫',
                'rating': 4.7,
                'students_count': 80,
                'experience': '4 years',
                'specialization': 'Interactive Sessions',
                'availability': 'Available Now',
                'color': 'orange',
            },
        ]

        coaches = []
        for coach_data in coaches_data:
            coach, created = Coach.objects.get_or_create(
                name=coach_data['name'],
                defaults=coach_data
            )
            coaches.append(coach)
            if created:
                self.stdout.write(f'  Created coach: {coach.name}')

        # Create Clubs (matching frontend Clubs.jsx)
        clubs_data = [
            {
                'title': 'Chess Club',
                'day': 'Monday & Wednesday',
                'time': '4:00 PM - 6:00 PM',
                'icon': '♟️',
                'color': 'indigo',
                'capacity': 20,
                'age_range': '8+',
                'min_age': 8,
                'max_age': 18,
                'rating': 4.8,
                'featured': True,
                'category': categories['STEM'],
                'location': 'Room 101',
                'description': 'Learn chess strategies and compete in tournaments. Develop critical thinking and problem-solving skills.',
            },
            {
                'title': 'Robotics Club',
                'day': 'Tuesday & Thursday',
                'time': '3:30 PM - 5:30 PM',
                'icon': '🤖',
                'color': 'blue',
                'capacity': 15,
                'age_range': '10-16',
                'min_age': 10,
                'max_age': 16,
                'rating': 4.9,
                'featured': True,
                'category': categories['STEM'],
                'location': 'Lab 202',
                'description': 'Build and program robots using Arduino and Python. Participate in robotics competitions.',
            },
            {
                'title': 'Art & Crafts',
                'day': 'Wednesday',
                'time': '4:00 PM - 5:30 PM',
                'icon': '🎨',
                'color': 'pink',
                'capacity': 25,
                'age_range': '6-12',
                'min_age': 6,
                'max_age': 12,
                'rating': 4.7,
                'featured': False,
                'category': categories['Arts'],
                'location': 'Art Studio',
                'description': 'Express your creativity through painting, drawing, and crafts. All materials provided.',
            },
            {
                'title': 'Coding Club',
                'day': 'Friday',
                'time': '4:00 PM - 6:00 PM',
                'icon': '💻',
                'color': 'green',
                'capacity': 20,
                'age_range': '9-16',
                'min_age': 9,
                'max_age': 16,
                'rating': 4.8,
                'featured': True,
                'category': categories['STEM'],
                'location': 'Computer Lab',
                'description': 'Learn programming with Python, JavaScript, and web development. Create your own games and apps.',
            },
            {
                'title': 'Music & Band',
                'day': 'Monday & Friday',
                'time': '3:00 PM - 5:00 PM',
                'icon': '🎵',
                'color': 'orange',
                'capacity': 25,
                'age_range': '7-14',
                'min_age': 7,
                'max_age': 14,
                'rating': 4.7,
                'featured': False,
                'category': categories['Music'],
                'location': 'Music Room',
                'description': 'Learn to play instruments and perform in a band. Piano, guitar, drums and more.',
            },
            {
                'title': 'Science Club',
                'day': 'Wednesday',
                'time': '3:30 PM - 5:30 PM',
                'icon': '🔬',
                'color': 'yellow',
                'capacity': 18,
                'age_range': '8-13',
                'min_age': 8,
                'max_age': 13,
                'rating': 4.6,
                'featured': False,
                'category': categories['STEM'],
                'location': 'Science Lab',
                'description': 'Exciting experiments and scientific discoveries. Explore chemistry, physics, and biology.',
            },
            {
                'title': 'Basketball Club',
                'day': 'Tuesday & Thursday',
                'time': '4:00 PM - 6:00 PM',
                'icon': '🏀',
                'color': 'red',
                'capacity': 16,
                'age_range': '10-16',
                'min_age': 10,
                'max_age': 16,
                'rating': 4.5,
                'featured': False,
                'category': categories['Sports'],
                'location': 'Gymnasium',
                'description': 'Improve your basketball skills with professional coaching. Team games and tournaments.',
            },
            {
                'title': 'Dance Club',
                'day': 'Monday & Wednesday',
                'time': '5:00 PM - 6:30 PM',
                'icon': '💃',
                'color': 'purple',
                'capacity': 20,
                'age_range': '6-15',
                'min_age': 6,
                'max_age': 15,
                'rating': 4.8,
                'featured': True,
                'category': categories['Arts'],
                'location': 'Dance Studio',
                'description': 'Learn various dance styles including hip-hop, contemporary, and ballet.',
            },
        ]

        for club_data in clubs_data:
            club, created = Club.objects.get_or_create(
                title=club_data['title'],
                defaults=club_data
            )
            if created:
                # Add all coaches to each club
                club.coaches.set(coaches)
                self.stdout.write(f'  Created club: {club.title}')

        # Create test user
        test_user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'username': 'testuser',
                'first_name': 'Test',
                'last_name': 'User',
                'age': 35,
                'interests': ['STEM', 'Music'],
            }
        )
        if created:
            test_user.set_password('testpass123')
            test_user.save()
            self.stdout.write(f'  Created test user: {test_user.email}')

        # Create test child
        child, created = Child.objects.get_or_create(
            parent=test_user,
            name='Alex',
            defaults={
                'age': 10,
                'interests': ['STEM', 'Sports'],
                'avatar': '👦',
            }
        )
        if created:
            self.stdout.write(f'  Created child: {child.name}')

        self.stdout.write(self.style.SUCCESS('\nDatabase seeded successfully!'))
        self.stdout.write(f'\nTest credentials:')
        self.stdout.write(f'  Email: test@example.com')
        self.stdout.write(f'  Password: testpass123')
