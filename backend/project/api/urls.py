from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, RegisterView, LoginView, UserProfileView

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('profile/<str:username>/', UserProfileView.as_view(), name='user-profile'),
]

urlpatterns += router.urls
