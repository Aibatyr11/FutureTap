# FutureTap Backend API

Backend API для сервиса записи на кружки с умными рекомендациями.

## Технологии

- **Django 5.2** - веб-фреймворк
- **Django REST Framework** - API
- **PostgreSQL** - основная база данных
- **JWT** - аутентификация (simplejwt)
- **django-cors-headers** - CORS для фронтенда
- **django-filter** - фильтрация запросов

## Установка

### 1. Клонирование и настройка

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# или
source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### 2. Настройка базы данных

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE dbdiplomka;
```

Настройки подключения в `project/project/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'dbdiplomka',
        'USER': 'postgres',
        'PASSWORD': '123',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 3. Миграции и тестовые данные

```bash
cd project
python manage.py migrate
python manage.py seed_data  # Создает тестовые данные
python manage.py createsuperuser  # Опционально
```

### 4. Запуск сервера

```bash
python manage.py runserver 0.0.0.0:8000
```

Сервер доступен по адресу: http://127.0.0.1:8000

## API Endpoints

### Аутентификация

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/register/` | Регистрация нового пользователя |
| POST | `/api/auth/login/` | Вход (получение JWT токенов) |
| POST | `/api/auth/logout/` | Выход (blacklist токена) |
| POST | `/api/auth/refresh/` | Обновление access токена |

#### Регистрация

```bash
POST /api/auth/register/
Content-Type: application/json

{
    "email": "user@example.com",
    "username": "username",
    "password": "SecurePass123",
    "password2": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe"
}
```

**Ответ:**
```json
{
    "message": "Registration successful",
    "user": {...},
    "tokens": {
        "refresh": "...",
        "access": "..."
    }
}
```

#### Вход

```bash
POST /api/auth/login/
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "SecurePass123"
}
```

### Пользователь

| Метод | URL | Описание | Авторизация |
|-------|-----|----------|-------------|
| GET | `/api/users/me/` | Текущий пользователь | Требуется |
| PUT/PATCH | `/api/users/me/` | Обновить профиль | Требуется |
| GET | `/api/users/` | Список пользователей | Нет |

### Кружки (Clubs)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/clubs/` | Список кружков (с фильтрами) |
| GET | `/api/clubs/{id}/` | Детали кружка |
| GET | `/api/clubs/featured/` | Рекомендуемые кружки |
| GET | `/api/clubs/categories/` | Список категорий |
| GET | `/api/clubs/{id}/coaches/` | Тренеры кружка |

**Фильтры для `/api/clubs/`:**
- `?category=STEM` - по категории
- `?search=chess` - поиск по названию
- `?featured=true` - только рекомендуемые
- `?available=true` - только с местами
- `?age=10` - по возрасту

**Формат ответа кружка:**
```json
{
    "id": 1,
    "title": "Chess Club",
    "day": "Monday & Wednesday",
    "time": "4:00 PM - 6:00 PM",
    "icon": "♟️",
    "color": "indigo",
    "capacity": 20,
    "enrolled": 15,
    "age_range": "8+",
    "rating": "4.8",
    "featured": true,
    "category": "STEM",
    "location": "Room 101"
}
```

### Тренеры (Coaches)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/coaches/` | Список тренеров |
| GET | `/api/coaches/{id}/` | Детали тренера |
| GET | `/api/coaches/by_club/?club_id=1` | Тренеры по кружку |

### Категории

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/categories/` | Список категорий |
| GET | `/api/categories/{slug}/` | Категория по slug |

### Записи на кружки (Enrollments)

| Метод | URL | Описание | Авторизация |
|-------|-----|----------|-------------|
| GET | `/api/enrollments/` | Мои записи | Требуется |
| POST | `/api/enrollments/` | Записаться | Требуется |
| DELETE | `/api/enrollments/{id}/` | Отменить запись | Требуется |
| GET | `/api/enrollments/active/` | Активные записи | Требуется |
| POST | `/api/enrollments/{id}/cancel/` | Отменить | Требуется |

**Создание записи:**
```bash
POST /api/enrollments/
Authorization: Bearer <token>
Content-Type: application/json

{
    "club": 1,
    "coach": 2,
    "child": 1  // опционально
}
```

### Дети (Children)

| Метод | URL | Описание | Авторизация |
|-------|-----|----------|-------------|
| GET | `/api/children/` | Мои дети | Требуется |
| POST | `/api/children/` | Добавить ребенка | Требуется |
| PUT/PATCH | `/api/children/{id}/` | Обновить | Требуется |
| DELETE | `/api/children/{id}/` | Удалить | Требуется |

### Рекомендации

| Метод | URL | Описание | Авторизация |
|-------|-----|----------|-------------|
| GET | `/api/recommendations/` | Рекомендации на основе профиля | Требуется |
| POST | `/api/recommendations/` | Рекомендации по критериям | Требуется |
| GET | `/api/recommendations/trending/` | Популярные кружки | Нет |
| GET | `/api/recommendations/similar/{club_id}/` | Похожие кружки | Нет |

**Получение рекомендаций:**
```bash
POST /api/recommendations/
Authorization: Bearer <token>
Content-Type: application/json

{
    "interests": ["STEM", "Music"],
    "age": 10,
    "preferred_days": ["Monday", "Wednesday"],
    "max_results": 5
}
```

**Ответ:**
```json
{
    "clubs": [...],
    "reason": "Recommended based on your interests in STEM, Music",
    "confidence_score": 0.85
}
```

### Контакты

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/contacts/` | Отправить сообщение |

### Статистика

| Метод | URL | Описание | Авторизация |
|-------|-----|----------|-------------|
| GET | `/api/stats/` | Моя статистика | Требуется |
| GET | `/api/stats/{username}/` | Статистика пользователя | Требуется |

### Посты (ClubPosts)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/posts/` | Список постов |
| GET | `/api/posts/?club_id=1` | Посты кружка |
| POST | `/api/posts/` | Создать пост (авториз.) |
| POST | `/api/posts/{id}/join/` | Записаться на мероприятие |

## Авторизация

Все защищенные эндпоинты требуют заголовок:

```
Authorization: Bearer <access_token>
```

Токен получается при логине или регистрации. Время жизни:
- Access token: 1 час
- Refresh token: 7 дней

Обновление токена:
```bash
POST /api/auth/refresh/
Content-Type: application/json

{"refresh": "<refresh_token>"}
```

## Модели данных

### User
```json
{
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "first_name": "John",
    "last_name": "Doe",
    "age": 35,
    "bio": "...",
    "interests": ["STEM", "Music"],
    "preferred_categories": [],
    "preferred_schedule": []
}
```

### Club
```json
{
    "id": 1,
    "title": "Chess Club",
    "description": "...",
    "day": "Monday & Wednesday",
    "time": "4:00 PM - 6:00 PM",
    "icon": "♟️",
    "color": "indigo",
    "capacity": 20,
    "enrolled": 15,
    "age_range": "8+",
    "min_age": 8,
    "max_age": 18,
    "rating": "4.8",
    "featured": true,
    "category": {...},
    "coaches": [...],
    "location": "Room 101"
}
```

### Coach
```json
{
    "id": 1,
    "name": "Sarah Johnson",
    "avatar": "👩‍🏫",
    "rating": "4.9",
    "students": 120,
    "experience": "5 years",
    "specialization": "Beginner Friendly",
    "availability": "Available Now",
    "color": "blue"
}
```

### Child
```json
{
    "id": 1,
    "name": "Alex",
    "age": 10,
    "interests": ["STEM", "Sports"],
    "avatar": "👦"
}
```

### Enrollment
```json
{
    "id": 1,
    "club": {...},
    "coach": {...},
    "child": {...},
    "enrollment_date": "2025-01-04T18:00:00Z",
    "status": "active"
}
```

## Тестовые данные

После запуска `python manage.py seed_data` создаются:

- **4 категории**: STEM, Arts, Sports, Music
- **4 тренера**: Sarah Johnson, Michael Chen, Emily Rodriguez, David Kim
- **8 кружков**: Chess, Robotics, Art, Coding, Music, Science, Basketball, Dance
- **Тестовый пользователь**: test@example.com / testpass123

## Admin панель

Доступна по адресу: http://127.0.0.1:8000/admin/

Логин: admin@futuretap.com / admin123

## CORS

Настроен для фронтенда на:
- http://localhost:5173
- http://localhost:3000
