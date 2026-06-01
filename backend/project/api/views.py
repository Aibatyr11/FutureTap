from rest_framework import viewsets, status, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Category, Coach, Club, Child, Enrollment,
    Lesson, ContactMessage, ClubPost, RecommendationLog
)
from .serializers import (
    RegisterSerializer, UserSerializer, UserProfileSerializer,
    CategorySerializer, CoachSerializer, CoachListSerializer,
    ClubListSerializer, ClubDetailSerializer, ClubCreateSerializer,
    ChildSerializer, EnrollmentSerializer, EnrollmentCreateSerializer,
    LessonSerializer, LessonCreateSerializer, ContactMessageSerializer, ClubPostSerializer,
    RecommendationRequestSerializer, MLRecommendationRequestSerializer, UserStatsSerializer
)
from .recommendations import get_club_recommendations, RecommendationEngine

User = get_user_model()


# ============== Auth Views ==============

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """JWT Login endpoint"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate with email
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Login successful',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
        except User.DoesNotExist:
            pass

        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    """Logout - blacklist refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logout successful'})
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============== User Views ==============

class CurrentUserView(APIView):
    """Get/Update current authenticated user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Public user profiles (read-only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


# ============== Category Views ==============

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Club categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


# ============== Coach Views ==============

class CoachViewSet(viewsets.ReadOnlyModelViewSet):
    """Coaches listing"""
    queryset = Coach.objects.filter(is_active=True)
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CoachSerializer
        return CoachListSerializer

    @action(detail=False, methods=['get'])
    def by_club(self, request):
        """Get coaches available for a specific club"""
        club_id = request.query_params.get('club_id')
        if not club_id:
            return Response(
                {'error': 'club_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            club = Club.objects.get(id=club_id)
            coaches = club.coaches.filter(is_active=True)
            serializer = CoachListSerializer(coaches, many=True)
            return Response(serializer.data)
        except Club.DoesNotExist:
            return Response(
                {'error': 'Club not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ============== Club Views ==============

class ClubViewSet(viewsets.ModelViewSet):
    """
    Clubs listing with filtering and search.
    Matches frontend data structure exactly.
    """
    queryset = Club.objects.filter(is_active=True).select_related('category')
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['title', 'rating', 'created_at']
    ordering = ['-rating', '-featured']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ClubCreateSerializer
        if self.action == 'retrieve':
            return ClubDetailSerializer
        return ClubListSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'roster']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        if not hasattr(self.request.user, 'coach_profile'):
            raise PermissionDenied("Only coaches can create classes")
        club = serializer.save(is_active=True)
        club.coaches.add(self.request.user.coach_profile)

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by category
        category = self.request.query_params.get('category')
        if category and category != 'All Clubs':
            queryset = queryset.filter(category__name__iexact=category)

        # Filter by coach
        coach_id = self.request.query_params.get('coach')
        if coach_id == 'me' and self.request.user.is_authenticated and hasattr(self.request.user, 'coach_profile'):
            queryset = queryset.filter(coaches=self.request.user.coach_profile)
        elif coach_id and coach_id != 'me':
            queryset = queryset.filter(coaches__id=coach_id)

        # Filter by available spots
        available = self.request.query_params.get('available')
        if available == 'true':
            # Get clubs with available spots
            queryset = [c for c in queryset if c.available_spots > 0]
            return Club.objects.filter(id__in=[c.id for c in queryset])

        # Filter by featured
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(featured=True)

        # Filter by age
        age = self.request.query_params.get('age')
        if age:
            try:
                age = int(age)
                queryset = queryset.filter(min_age__lte=age, max_age__gte=age)
            except ValueError:
                pass

        return queryset

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured clubs"""
        featured_clubs = self.get_queryset().filter(featured=True)[:6]
        serializer = ClubListSerializer(featured_clubs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all categories with club counts"""
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def coaches(self, request, pk=None):
        """Get coaches for a specific club"""
        club = self.get_object()
        coaches = club.coaches.filter(is_active=True)
        serializer = CoachListSerializer(coaches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def roster(self, request, pk=None):
        """Get enrolled students for a coach's club"""
        club = self.get_object()
        if not hasattr(request.user, 'coach_profile') or request.user.coach_profile not in club.coaches.all():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Not authorized to view this roster")
            
        enrollments = Enrollment.objects.filter(club=club, status='active').select_related('user', 'child')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)


# ============== Child Views ==============

class ChildViewSet(viewsets.ModelViewSet):
    """Manage children for authenticated users"""
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Child.objects.filter(parent=self.request.user)

    def perform_create(self, serializer):
        serializer.save(parent=self.request.user)


# ============== Enrollment Views ==============

class EnrollmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer

    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user
        ).select_related('club', 'coach', 'child')

    @action(detail=False, methods=['get'])
    def active(self, request):
        enrollments = self.get_queryset().filter(status='active')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.status = 'cancelled'
        enrollment.save()
        return Response({'message': 'Enrollment cancelled'})


# ============== Lesson Views ==============

class LessonViewSet(viewsets.ModelViewSet):
    """View and manage lessons"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LessonCreateSerializer
        return LessonSerializer
        
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user
        club = serializer.validated_data['club']
        
        # Check if user is a coach of this club
        if not hasattr(user, 'coach_profile') or user.coach_profile not in club.coaches.all():
            raise PermissionDenied("Only coaches of this club can schedule lessons")
            
        serializer.save(coach=user.coach_profile)

    def get_queryset(self):
        user = self.request.user
        
        # Collect IDs of clubs the user is either enrolled in or coaching
        club_ids = list(Enrollment.objects.filter(
            user=user,
            status='active'
        ).values_list('club_id', flat=True))
        
        if hasattr(user, 'coach_profile'):
            coach_clubs = user.coach_profile.clubs.values_list('id', flat=True)
            club_ids.extend(coach_clubs)

        return Lesson.objects.filter(club_id__in=club_ids)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming lessons for the user"""
        from django.utils import timezone
        
        # Lessons that are today or in the future
        lessons = self.get_queryset().filter(
            date__gte=timezone.now().date()
        ).order_by('date', 'start_time')[:10]
        
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)


# ============== Contact Views ==============

class ContactMessageView(APIView):
    """Handle contact form submissions"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Message sent successfully'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============== Recommendations Views ==============

class MLRecommendClubsView(APIView):
    """
    ML-based club recommendations using TF-IDF content-based filtering.

    POST: Get recommendations based on user interests text

    Request body:
        {
            "interests": "I like robotics, programming, and AI",
            "top_n": 5
        }

    Response:
        {
            "recommendations": [
                {
                    "club_id": 2,
                    "name": "Клуб робототехники",
                    "description": "Сборка и программирование роботов...",
                    "tags": ["robotics", "programming"],
                    "similarity": 0.6543
                },
                ...
            ]
        }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """Get ML-based club recommendations from user interests"""
        serializer = MLRecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            from ml_recommender import recommend_clubs

            recommendations = recommend_clubs(
                interests=data['interests'],
                top_n=data['top_n']
            )

            return Response({
                'recommendations': recommendations,
                'count': len(recommendations),
                'query': data['interests']
            })

        except RuntimeError as e:
            return Response(
                {'error': f'ML model not available: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {'error': f'Error generating recommendations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecommendationView(APIView):
    """
    AI-powered club recommendations.

    GET: Get recommendations based on user profile
    POST: Get recommendations based on custom criteria
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get recommendations based on user profile"""
        recommendations = get_club_recommendations(
            user=request.user,
            max_results=6
        )

        return Response({
            'clubs': ClubListSerializer(recommendations['clubs'], many=True).data,
            'reason': recommendations['reason'],
            'confidence_score': recommendations['confidence_score']
        })

    def post(self, request):
        """Get recommendations based on custom criteria"""
        serializer = RecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        recommendations = get_club_recommendations(
            user=request.user,
            child_id=data.get('child_id'),
            interests=data.get('interests'),
            age=data.get('age'),
            preferred_days=data.get('preferred_days'),
            max_results=data.get('max_results', 5)
        )

        return Response({
            'clubs': ClubListSerializer(recommendations['clubs'], many=True).data,
            'reason': recommendations['reason'],
            'confidence_score': recommendations['confidence_score']
        })


class TrendingClubsView(APIView):
    """Get trending clubs"""
    permission_classes = [AllowAny]

    def get(self, request):
        trending = RecommendationEngine.get_trending_clubs(limit=5)
        serializer = ClubListSerializer(trending, many=True)
        return Response(serializer.data)


class SimilarClubsView(APIView):
    """Get clubs similar to a given club"""
    permission_classes = [AllowAny]

    def get(self, request, club_id):
        try:
            club = Club.objects.get(id=club_id)
            similar = RecommendationEngine.get_similar_clubs(club, limit=3)
            serializer = ClubListSerializer(similar, many=True)
            return Response(serializer.data)
        except Club.DoesNotExist:
            return Response(
                {'error': 'Club not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ============== ClubPost Views ==============

class ClubPostViewSet(viewsets.ModelViewSet):
    """Club posts/announcements"""
    queryset = ClubPost.objects.filter(is_published=True).order_by('-created_at')
    serializer_class = ClubPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        club_id = self.request.query_params.get('club_id')
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        """Join a club post activity"""
        post = self.get_object()

        if post.max_participants and post.current_participants >= post.max_participants:
            return Response(
                {'error': 'No spots available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        post.current_participants += 1
        post.save()

        return Response({
            'message': 'Successfully joined',
            'available_slots': f"{post.current_participants}/{post.max_participants}"
        })


# ============== Stats Views ==============

class UserStatsView(APIView):
    """Get user statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request, username=None):
        if username:
            user = get_object_or_404(User, username=username)
        else:
            user = request.user

        stats = {
            'total_children': user.children.count(),
            'total_enrollments': user.enrollments.filter(status='active').count(),
            'total_clubs': user.enrollments.filter(status='active').values('club').distinct().count(),
        }

        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)


# ============== Legacy Endpoints (backward compatibility) ==============

class UserProfileView(APIView):
    """Legacy profile endpoint"""
    permission_classes = [AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)


class ChildrenListView(APIView):
    """Legacy children list endpoint"""
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        parent = get_object_or_404(User, username=username)
        children = parent.children.all()
        serializer = ChildSerializer(children, many=True)
        return Response(serializer.data)

    def post(self, request, username):
        parent = get_object_or_404(User, username=username)
        serializer = ChildSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(parent=parent)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============== Audio Upload View ==============

class AudioUploadView(APIView):
    """
    Эндпоинт для загрузки аудиозаписи урока от преподавателя.

    POST /api/lessons/upload-audio/
    Content-Type: multipart/form-data

    Поля формы:
        - audio_file  : аудиофайл (webm/ogg/wav)
        - lesson_id   : ID урока (int)
        - teacher_id  : ID пользователя-преподавателя (int)

    Возвращает 202 Accepted сразу, не блокируя поток —
    тяжёлая обработка (Whisper) будет выполняться фоновой Celery-задачей.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # --- 1. Валидация обязательных полей ---
        audio_file = request.FILES.get('audio_file')
        lesson_id  = request.data.get('lesson_id')
        teacher_id = request.data.get('teacher_id')

        if not audio_file:
            return Response(
                {'error': 'Поле audio_file обязательно'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not lesson_id:
            return Response(
                {'error': 'Поле lesson_id обязательно'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- 2. Получаем урок из БД (PostgreSQL) ---
        lesson = get_object_or_404(Lesson, id=lesson_id)

        # Проверяем, что запрашивающий пользователь — коуч этого урока
        if not hasattr(request.user, 'coach_profile') or lesson.coach != request.user.coach_profile:
            return Response(
                {'error': 'Только преподаватель этого урока может загружать запись'},
                status=status.HTTP_403_FORBIDDEN
            )

        # --- 3. Сохраняем файл через default_storage ---
        # Путь: media/lesson_audios/lesson_<id>_<расширение>
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os

        # Формируем безопасное имя файла с расширением оригинала
        ext = os.path.splitext(audio_file.name)[1] or '.webm'
        save_name = f'lesson_audios/lesson_{lesson_id}{ext}'

        # Если запись уже была — удаляем старую версию перед сохранением
        if default_storage.exists(save_name):
            default_storage.delete(save_name)

        # Записываем новый файл в хранилище
        saved_path = default_storage.save(save_name, ContentFile(audio_file.read()))

        # --- 4. Обновляем флаг is_recorded и путь к файлу в PostgreSQL ---
        lesson.is_recorded = True
        lesson.audio_file_path = saved_path  # сохраняем путь для доступа через API
        lesson.save(update_fields=['is_recorded', 'audio_file_path'])

        # --- 5. Заглушка для Celery + Whisper AI ---
        # TODO: запустить фоновую задачу после настройки Celery + Redis
        #
        # from .tasks import transcribe_audio_task
        # transcribe_audio_task.delay(
        #     audio_path=saved_path,   # путь к файлу в хранилище
        #     lesson_id=lesson.id,     # ID урока для привязки отчёта
        #     teacher_id=teacher_id,   # ID преподавателя для логов
        # )
        #
        # Задача transcribe_audio_task должна:
        #   а) Передать аудиофайл в OpenAI Whisper / локальный Whisper
        #   б) Сохранить транскрипцию в MongoDB (коллекция lesson_transcripts)
        #   в) Обновить поле lesson.transcript_status в PostgreSQL

        return Response(
            {
                'status': 'accepted',
                'message': 'Аудиозапись принята. Транскрипция будет выполнена в фоне.',
                'lesson_id': lesson.id,
                'is_recorded': True,
                'file_path': saved_path,
            },
            status=status.HTTP_202_ACCEPTED
        )


# ============== AI Report Generation View ==============

class AIChatView(APIView):
    """
    Эндпоинт для AI Чата с использованием RAG-пайплайна.
    Извлекает контекст из последних уроков пользователя и отправляет запрос в Grok API.
    
    POST /api/chat/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        messages = request.data.get('messages', [])
        
        # Конвертируем формат frontend ({text, sender}) в формат Grok API ({role, content})
        formatted_messages = []
        for msg in messages:
            role = "user" if msg.get("sender") == "user" else "assistant"
            # Если это уже формат role/content, используем его
            if "role" in msg and "content" in msg:
                formatted_messages.append(msg)
            elif "text" in msg:
                formatted_messages.append({"role": role, "content": msg["text"]})

        query_text = formatted_messages[-1].get("content", "") if formatted_messages else ""
        
        from .ai_services import get_student_lessons_context, chat_with_grok
        
        # Получаем контекст прошлых уроков для текущего пользователя
        # Это обеспечивает безопасность: пользователь получит контекст только из своих уроков (своих кружков)
        context_string = get_student_lessons_context(request.user.id, query_text)
        
        try:
            bot_reply = chat_with_grok(formatted_messages, context_string)
            return Response({"reply": bot_reply})
        except RuntimeError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GenerateLessonReportView(APIView):
    """
    Эндпоинт запуска синхронного AI-пайплайна для обработки аудиозаписи урока.

    POST /api/lessons/<lesson_id>/generate-report/

    Требует аутентификации. Запрашивающий пользователь должен быть коучем урока.

    Пайплайн (все шаги синхронные):
        1. Получить объект Lesson из PostgreSQL по lesson_id.
        2. Проверить наличие загруженной аудиозаписи (is_recorded=True).
        3. Сформировать абсолютный путь к аудиофайлу через MEDIA_ROOT.
        4. Установить ai_status='processing' и сохранить в PostgreSQL.
        5. Вызвать Whisper (STT) -> получить транскрипт текста.
        6. Вызвать Grok API (LLM) -> получить JSON-отчёт {summary, tags, action_items}.
        7. Сохранить транскрипт + отчёт в MongoDB (коллекция lesson_reports).
        8. Обновить ai_status='completed' в PostgreSQL.
        9. Вернуть клиенту JSON с результатами обработки.
       10. При любой ошибке -> установить ai_status='failed' и вернуть 500.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        # Импортируем здесь, чтобы избежать циклических импортов
        # и не грузить тяжёлые зависимости (whisper, pymongo) при старте сервера.
        import os
        import logging
        from django.conf import settings as django_settings
        from .ai_services import transcribe_audio, analyze_with_grok, save_lesson_report

        ai_logger = logging.getLogger(__name__)

        # --- Шаг 1: Получаем урок из PostgreSQL ---
        lesson = get_object_or_404(Lesson, id=lesson_id)

        # Проверяем, что запрашивающий пользователь является коучем этого урока
        if not hasattr(request.user, 'coach_profile') or lesson.coach != request.user.coach_profile:
            return Response(
                {'error': 'Только преподаватель этого урока может запустить AI-анализ'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем, что аудиозапись была загружена (is_recorded=True и путь не пустой)
        if not lesson.is_recorded or not lesson.audio_file_path:
            return Response(
                {
                    'error': (
                        'Аудиозапись урока не найдена. '
                        'Сначала загрузите запись через /api/lessons/upload-audio/'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Предотвращаем повторный запуск, если обработка уже идёт
        if lesson.ai_status == 'processing':
            return Response(
                {'error': 'AI-обработка уже запущена для этого урока. Подождите завершения.'},
                status=status.HTTP_409_CONFLICT
            )

        # --- Шаг 2: Формируем абсолютный путь к аудиофайлу ---
        # audio_file_path хранит относительный путь от MEDIA_ROOT
        # (например: 'lesson_audios/lesson_5.webm')
        audio_absolute_path = os.path.join(
            str(django_settings.MEDIA_ROOT),
            lesson.audio_file_path
        )

        # --- Шаг 3: Устанавливаем статус 'processing' в PostgreSQL ---
        lesson.ai_status = 'processing'
        lesson.save(update_fields=['ai_status'])

        try:
            # --- Шаг 4: Speech-to-Text (Whisper) ---
            # Синхронная операция — может занять от секунд до минут
            # в зависимости от длины записи и мощности CPU/GPU.
            transcript_text = transcribe_audio(audio_absolute_path)

            # --- Шаг 5: LLM-анализ (Grok API) ---
            # Отправляем транскрипт в Grok и получаем структурированный JSON-отчёт.
            ai_report = analyze_with_grok(transcript_text)

            # --- Шаг 6: Сохраняем результаты в MongoDB ---
            # Коллекция 'lesson_reports' хранит транскрипт и отчёт в одном документе.
            # Поле lesson_id связывает документ MongoDB с записью PostgreSQL.
            mongo_report_id = save_lesson_report(
                lesson_id=lesson.id,
                transcript_text=transcript_text,
                ai_report=ai_report,
            )

            # --- Шаг 7: Обновляем статус в PostgreSQL на 'completed' ---
            lesson.ai_status = 'completed'
            lesson.save(update_fields=['ai_status'])

            # --- Шаг 8: Возвращаем успешный ответ клиенту ---
            return Response(
                {
                    'status': 'completed',
                    'lesson_id': lesson.id,
                    'mongo_report_id': mongo_report_id,   # ObjectId документа в MongoDB
                    'transcript': transcript_text,         # полный текст транскрипции
                    'report': ai_report,                   # {summary, tags, action_items}
                },
                status=status.HTTP_200_OK
            )

        except RuntimeError as exc:
            # Логируем ошибку для последующей диагностики
            ai_logger.error(
                'AI-пайплайн: ошибка при обработке урока %d — %s',
                lesson.id, exc
            )

            # Помечаем урок как завершившийся с ошибкой в PostgreSQL
            lesson.ai_status = 'failed'
            lesson.save(update_fields=['ai_status'])

            return Response(
                {
                    'error': 'Ошибка AI-обработки: ' + str(exc),
                    'lesson_id': lesson.id,
                    'ai_status': 'failed',
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============== Get Saved Lesson Report View ==============

class GetLessonReportView(APIView):
    """
    Эндпоинт получения сохранённого AI-отчёта урока из MongoDB.

    GET /api/lessons/<lesson_id>/report/

    Возвращает последний отчёт для данного урока (если есть),
    или 404 с exists=False если отчёт ещё не генерировался.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        import logging
        from django.conf import settings as django_settings
        from pymongo import MongoClient

        ai_logger = logging.getLogger(__name__)

        # Проверяем наличие урока в PostgreSQL
        lesson = get_object_or_404(Lesson, id=lesson_id)

        # Доступ: только коуч урока или администратор
        if not request.user.is_staff:
            if not hasattr(request.user, 'coach_profile') or lesson.coach != request.user.coach_profile:
                return Response(
                    {'error': 'Доступ запрещён'},
                    status=status.HTTP_403_FORBIDDEN
                )

        try:
            client = MongoClient(django_settings.MONGO_URI)
            db = client[django_settings.MONGO_DB_NAME]
            collection = db['lesson_reports']

            # Берём самый свежий отчёт для урока
            doc = collection.find_one(
                {'lesson_id': lesson_id},
                sort=[('created_at', -1)]
            )

            if not doc:
                return Response(
                    {'exists': False, 'message': 'Отчёт ещё не сгенерирован'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Сериализуем ObjectId в строку для JSON
            doc['_id'] = str(doc['_id'])
            if doc.get('created_at'):
                doc['created_at'] = doc['created_at'].isoformat()

            return Response({
                'exists': True,
                'lesson_id': lesson_id,
                'ai_status': lesson.ai_status,
                'report': {
                    'summary': doc.get('summary', ''),
                    'tags': doc.get('tags', []),
                    'action_items': doc.get('action_items', []),
                    'transcript': doc.get('transcript', ''),
                    'created_at': doc.get('created_at'),
                }
            }, status=status.HTTP_200_OK)

        except Exception as exc:
            ai_logger.error('GetLessonReportView: ошибка %s', exc)
            return Response(
                {'error': f'Ошибка получения отчёта: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
