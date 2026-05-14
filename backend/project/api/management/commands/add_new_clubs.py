from django.core.management.base import BaseCommand
from api.models import Category, Club, Coach

class Command(BaseCommand):
    help = 'Add 4 new online clubs'

    def handle(self, *args, **options):
        self.stdout.write('Adding new clubs...')

        # Get or create categories (using slugs for safer lookup)
        stem = Category.objects.filter(slug='stem').first() or Category.objects.create(name='STEM', slug='stem', icon='🔬', color='blue')
        arts = Category.objects.filter(slug='arts').first() or Category.objects.create(name='arts').first() or arts_obj
        # Actually let's be simpler
        stem, _ = Category.objects.get_or_create(slug='stem', defaults={'name': 'STEM', 'icon': '🔬', 'color': 'blue'})
        arts, _ = Category.objects.get_or_create(slug='arts', defaults={'name': 'Arts', 'icon': '🎨', 'color': 'pink'})
        
        # Get a coach to assign
        coach = Coach.objects.first()
        if not coach:
            self.stdout.write(self.style.ERROR('No coaches found! Run seed_data first.'))
            return

        new_clubs = [
            {
                'title': 'Debate & Public Speaking',
                'description': 'Master the art of persuasion and effective communication.',
                'day': 'Monday & Wednesday',
                'time': '4:00 PM - 6:00 PM',
                'icon': '🎤',
                'color': 'violet',
                'capacity': 20,
                'age_range': '12+',
                'min_age': 12,
                'max_age': 18,
                'rating': 4.9,
                'featured': True,
                'category': arts,
                'location': 'Online'
            },
            {
                'title': 'Conversational English',
                'description': 'Improve your speaking skills with native speakers and peers.',
                'day': 'Tuesday & Thursday',
                'time': '5:00 PM - 7:00 PM',
                'icon': '🌍💬',
                'color': 'teal',
                'capacity': 20,
                'age_range': '10+',
                'min_age': 10,
                'max_age': 16,
                'rating': 4.8,
                'featured': True,
                'category': arts,
                'location': 'Online'
            },
            {
                'title': 'Book Club',
                'description': 'Deep dive into classic and contemporary literature.',
                'day': 'Friday',
                'time': '6:00 PM - 8:00 PM',
                'icon': '📚',
                'color': 'brown',
                'capacity': 20,
                'age_range': '14+',
                'min_age': 14,
                'max_age': 18,
                'rating': 5.0,
                'featured': True,
                'category': arts,
                'location': 'Online'
            },
            {
                'title': 'Math Olympiad Prep',
                'description': 'Advanced problem-solving techniques for math competitions.',
                'day': 'Saturday',
                'time': '10:00 AM - 12:00 PM',
                'icon': '🧮🧠',
                'color': 'crimson',
                'capacity': 20,
                'age_range': '10+',
                'min_age': 10,
                'max_age': 16,
                'rating': 4.9,
                'featured': True,
                'category': stem,
                'location': 'Online'
            }
        ]

        for club_data in new_clubs:
            club, created = Club.objects.get_or_create(
                title=club_data['title'],
                defaults=club_data
            )
            if created:
                club.coaches.add(coach)
                self.stdout.write(f'  Created club: {club.title}')
            else:
                # Update existing club fields
                for key, value in club_data.items():
                    setattr(club, key, value)
                club.save()
                club.coaches.add(coach)
                self.stdout.write(f'  Updated club: {club.title}')

        self.stdout.write(self.style.SUCCESS('Successfully added/updated new clubs!'))
