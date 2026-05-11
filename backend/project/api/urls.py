
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Auth
    RegisterView, LoginView, LogoutView,
    # Users
    UserViewSet, CurrentUserView, UserProfileView, UserStatsView,
    # Categories
    CategoryViewSet,
    # Coaches
    CoachViewSet,
    # Clubs
    ClubViewSet,
    # Children
    ChildViewSet, ChildrenListView,
    # Enrollments
    EnrollmentViewSet,
    # Lessons
    LessonViewSet,
    # Audio
    AudioUploadView,
    # AI Report
    GenerateLessonReportView,
    GetLessonReportView,
    # Posts
    ClubPostViewSet,
    # Contacts
    ContactMessageView,
    # Recommendations
    RecommendationView, TrendingClubsView, SimilarClubsView, MLRecommendClubsView,
)

# Router for ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'coaches', CoachViewSet, basename='coach')
router.register(r'clubs', ClubViewSet, basename='club')
router.register(r'children', ChildViewSet, basename='child')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'posts', ClubPostViewSet, basename='clubpost')

urlpatterns = [
    # ============== Authentication ==============
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ============== Current User ==============
    path('users/me/', CurrentUserView.as_view(), name='current-user'),

    # ============== Recommendations ==============
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),
    path('recommendations/trending/', TrendingClubsView.as_view(), name='trending-clubs'),
    path('recommendations/similar/<int:club_id>/', SimilarClubsView.as_view(), name='similar-clubs'),
    path('recommend-clubs/', MLRecommendClubsView.as_view(), name='ml-recommend-clubs'),

    # ============== Contact ==============
    path('contacts/', ContactMessageView.as_view(), name='contact'),

    # ============== Audio Upload ==============
    path('lessons/upload-audio/', AudioUploadView.as_view(), name='audio-upload'),

    # ============== AI Report Generation ==============
    # Запускает синхронный пайплайн: Whisper -> Grok -> MongoDB
    # Требует аутентификации; доступен только коучу данного урока.
    path('lessons/<int:lesson_id>/generate-report/', GenerateLessonReportView.as_view(), name='generate-lesson-report'),
    # Получение сохранённого отчёта из MongoDB
    path('lessons/<int:lesson_id>/report/', GetLessonReportView.as_view(), name='get-lesson-report'),

    # ============== User Stats ==============
    path('stats/', UserStatsView.as_view(), name='my-stats'),
    path('stats/<str:username>/', UserStatsView.as_view(), name='user-stats'),

    # ============== Legacy Endpoints ==============
    path('register/', RegisterView.as_view(), name='register-legacy'),
    path('login/', LoginView.as_view(), name='login-legacy'),
    path('profile/<str:username>/', UserProfileView.as_view(), name='user-profile'),
    path('profile/<str:username>/children/', ChildrenListView.as_view(), name='user-children'),
    path('profile/<str:username>/stats/', UserStatsView.as_view(), name='profile-stats'),

    # ============== Router URLs ==============
    path('', include(router.urls)),
]
