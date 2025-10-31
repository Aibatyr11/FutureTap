from rest_framework import viewsets, status
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .serializers import UserSerializer
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import User, Child, Club, ChildClub, ClubPost
from .serializers import ChildSerializer, ClubSerializer, ChildClubSerializer, UserStatsSerializer, ClubPostSerializer
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.set_password(request.data['password'])  # хешируем пароль
            user.save()
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Логин
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)



class UserProfileView(APIView):
    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, username):
        """Полное обновление профиля"""
        user = get_object_or_404(User, username=username)

        data = request.data.copy()
        # Если пароль не передан — не трогаем его
        data.pop('password', None)

        serializer = UserSerializer(user, data=data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Profile updated successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, username):
        """Частичное обновление профиля"""
        user = get_object_or_404(User, username=username)

        data = request.data.copy()
        data.pop('password', None)

        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Profile partially updated successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, username):
        """Удаление пользователя"""
        user = get_object_or_404(User, username=username)
        user.delete()
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


class ChildrenListView(APIView):
    def get(self, request, username):
        parent = get_object_or_404(User, username=username)
        children = parent.children.all()
        serializer = ChildSerializer(children, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, username):
        parent = get_object_or_404(User, username=username)
        serializer = ChildSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(parent=parent)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChildDetailView(APIView):
    def get(self, request, username, child_id):
        parent = get_object_or_404(User, username=username)
        child = get_object_or_404(Child, id=child_id, parent=parent)
        serializer = ChildSerializer(child)
        return Response(serializer.data)

    def put(self, request, username, child_id):
        parent = get_object_or_404(User, username=username)
        child = get_object_or_404(Child, id=child_id, parent=parent)
        serializer = ChildSerializer(child, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, username, child_id):
        parent = get_object_or_404(User, username=username)
        child = get_object_or_404(Child, id=child_id, parent=parent)
        serializer = ChildSerializer(child, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, username, child_id):
        parent = get_object_or_404(User, username=username)
        child = get_object_or_404(Child, id=child_id, parent=parent)
        child.delete()
        return Response({'message': 'Child deleted'}, status=status.HTTP_204_NO_CONTENT)


# 3. Список кружков ребёнка / добавление
class ChildClubsView(APIView):
    def get(self, request, username, child_id):
        parent = get_object_or_404(User, username=username)
        child = get_object_or_404(Child, id=child_id, parent=parent)
        enrollments = ChildClub.objects.filter(child=child)
        serializer = ChildClubSerializer(enrollments, many=True)
        return Response(serializer.data)

    def post(self, request, username, child_id):
        parent = get_object_or_404(User, username=username)
        child = get_object_or_404(Child, id=child_id, parent=parent)
        club_id = request.data.get('club_id')
        club = get_object_or_404(Club, id=club_id)
        ChildClub.objects.create(child=child, club=club)
        return Response({'message': f'{child.name} enrolled in {club.name}'}, status=status.HTTP_201_CREATED)


# 4. Статистика профиля
class UserStatsView(APIView):
    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        total_children = user.children.count()
        total_enrollments = ChildClub.objects.filter(child__parent=user).count()
        total_clubs = Club.objects.filter(members__child__parent=user).distinct().count()

        data = {
            'total_children': total_children,
            'total_enrollments': total_enrollments,
            'total_clubs': total_clubs,
        }

        serializer = UserStatsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)




class ClubPostViewSet(viewsets.ModelViewSet):
    queryset = ClubPost.objects.all().order_by('-created_at')
    serializer_class = ClubPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        club_id = self.request.query_params.get('club_id')
        if club_id:
            return ClubPost.objects.filter(club__id=club_id, is_published=True).order_by('-created_at')
        return ClubPost.objects.filter(is_published=True).order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        """Ребёнок записывается на участие в посте"""
        post = self.get_object()
        child_id = request.data.get('child_id')

        if not child_id:
            return Response({'error': 'child_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # проверяем, есть ли место
        if post.max_participants and post.current_participants >= post.max_participants:
            return Response({'error': 'Все места заняты'}, status=status.HTTP_400_BAD_REQUEST)

        # увеличиваем счётчик участников
        post.current_participants += 1
        post.save()

        return Response({
            'message': f'Ребёнок {child_id} записан на {post.title}',
            'available_slots': f"{post.current_participants}/{post.max_participants}"
        }, status=status.HTTP_200_OK)
