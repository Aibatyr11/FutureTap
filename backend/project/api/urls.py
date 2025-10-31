from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (UserViewSet, RegisterView, LoginView,
                    UserProfileView, ChildrenListView, ChildDetailView,
                    ChildClubsView, UserStatsView, ClubPostViewSet)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'posts', ClubPostViewSet, basename='clubpost')
urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('profile/<str:username>/', UserProfileView.as_view(), name='user-profile'),

    path('profile/<str:username>/children/', ChildrenListView.as_view(), name='user-children'),
    path('profile/<str:username>/children/<int:child_id>/', ChildDetailView.as_view(), name='child-detail'),
    path('profile/<str:username>/children/<int:child_id>/clubs/', ChildClubsView.as_view(), name='child-clubs'),
    path('profile/<str:username>/stats/', UserStatsView.as_view(), name='user-stats'),
]

urlpatterns += router.urls
