import os
from PIL import Image
from django.core.management.base import BaseCommand
from django.core.files import File
from api.models import Coach, Club
from django.conf import settings
import io

class Command(BaseCommand):
    help = 'Seed coaches with processed images'

    def handle(self, *args, **options):
        self.stdout.write('Starting coach seeding...')

        media_coaches_path = os.path.join(settings.MEDIA_ROOT, 'coaches')
        os.makedirs(media_coaches_path, exist_ok=True)

        coaches_data = [
            {'file': r'D:\Diplomka\6948df2a3bd3666c2ca4510d7082e895.jpg', 'name': 'Дмитрий Александров', 'clubs': ['Robotics Club', 'Coding Club']},
            {'file': r'D:\Diplomka\a9e1f9b03abd50710a4a_2000x.jpg', 'name': 'Артём Козлов', 'clubs': ['Chess Club']},
            {'file': r'D:\Diplomka\fmt_81_24_shutterstock_110984234.webp', 'name': 'Елена Иванова', 'clubs': ['Debate & Public Speaking']},
            {'file': r'D:\Diplomka\uchitel.jpg', 'name': 'Александр Борисович', 'clubs': ['Book Club']},
            {'file': r'D:\Diplomka\frontend\talantap-frontend\src\assets\teacher.jpg', 'name': 'Марина Соколова', 'clubs': ['Math Olympiad Prep']},
        ]

        for data in coaches_data:
            img_path = data['file']
            if not os.path.exists(img_path):
                self.stdout.write(self.style.WARNING(f"File not found: {img_path}"))
                continue

            try:
                # Image processing
                img = Image.open(img_path)
                
                # Convert to RGB if necessary
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                # Crop to square (center)
                width, height = img.size
                min_dim = min(width, height)
                left = (width - min_dim) / 2
                top = (height - min_dim) / 2
                right = (width + min_dim) / 2
                bottom = (height + min_dim) / 2
                img = img.crop((left, top, right, bottom))
                
                # Resize
                img = img.resize((600, 600), Image.LANCZOS)
                
                # Save to buffer
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=95, optimize=True)
                buffer.seek(0)

                # Create or update Coach
                coach, created = Coach.objects.get_or_create(
                    name=data['name'],
                    defaults={
                        'specialization': 'Expert Instructor',
                        'experience': '5 years',
                        'bio': f'Professional instructor for {", ".join(data["clubs"])}'
                    }
                )

                # Save Image to ImageField
                filename = f"coach_{coach.id}.jpg"
                coach.photo.save(filename, File(buffer), save=True)

                # Assign clubs
                for club_title in data['clubs']:
                    club = Club.objects.filter(title__icontains=club_title).first()
                    if club:
                        club.coaches.add(coach)
                        self.stdout.write(f"  Linked {coach.name} to {club.title}")
                    else:
                        self.stdout.write(self.style.WARNING(f"  Club not found: {club_title}"))

                self.stdout.write(self.style.SUCCESS(f"Successfully processed {coach.name}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing {data['file']}: {e}"))

        self.stdout.write(self.style.SUCCESS('Coach seeding completed!'))
