"""
ai_services.py — Сервисный слой для обработки аудиозаписей уроков.

Содержит три независимых функции:
    1. transcribe_audio()  — Speech-to-Text через локальный openai-whisper
    2. analyze_with_grok() — LLM-анализ текста через xAI Grok API
    3. save_lesson_report() — Сохранение результатов в MongoDB (коллекция lesson_reports)

Пайплайн вызывается синхронно из GenerateLessonReportView (views.py).
"""

import os
import json
import logging
import requests
from datetime import datetime, timezone

import whisper
from pymongo import MongoClient
from django.conf import settings

# Настраиваем логгер для отслеживания ошибок в сервисном слое
logger = logging.getLogger(__name__)


# ==============================================================================
# Инициализация клиента MongoDB
# Клиент создаётся один раз на уровне модуля, чтобы переиспользовать соединение.
# ==============================================================================

_mongo_client = None  # ленивая инициализация (создаётся при первом вызове)


def _get_mongo_db():
    """
    Возвращает объект базы данных MongoDB, переиспользуя уже открытое соединение.
    Такой подход называется «connection pooling» — pymongo сам управляет пулом.
    """
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(settings.MONGO_URI)
        logger.info("MongoDB: установлено новое соединение с %s", settings.MONGO_URI)
    return _mongo_client[settings.MONGO_DB_NAME]


# ==============================================================================
# 1. Speech-to-Text через локальный Whisper
# ==============================================================================

def transcribe_audio(audio_path: str) -> str:
    import shutil
    audio_path = os.path.normpath(audio_path)
    _FFMPEG_WINGET_DIR = os.path.expandvars(
        r"%LOCALAPPDATA%\Microsoft\WinGet\Packages"
    )
    if os.path.isdir(_FFMPEG_WINGET_DIR):

        for root_dir, dirs, files in os.walk(_FFMPEG_WINGET_DIR):
            if any(f.lower() == 'ffmpeg.exe' for f in files):
                if root_dir not in os.environ.get('PATH', ''):
                    os.environ['PATH'] = root_dir + os.pathsep + os.environ.get('PATH', '')
                    logger.info("ffmpeg найден и добавлен в PATH: %s", root_dir)
                break

    if not shutil.which('ffmpeg'):
        logger.warning("ffmpeg не найден в PATH — транскрибация .webm может не работать!")

    if not os.path.exists(audio_path):
        raise RuntimeError(
            f"Аудиофайл не найден по пути: {audio_path}. "
            "Убедитесь, что MEDIA_ROOT настроен корректно."
        )

    logger.info("Whisper: начало транскрибации файла '%s'", audio_path)

    try:
        model = whisper.load_model("base")
        result = model.transcribe(audio_path, fp16=False)

        transcript_text = result.get("text", "").strip()
        logger.info(
            "Whisper: транскрибация завершена. Символов: %d", len(transcript_text)
        )
        return transcript_text

    except Exception as exc:
        logger.error("Whisper: ошибка транскрибации — %s", exc)
        raise RuntimeError(f"Ошибка транскрибации Whisper: {exc}") from exc



# ==============================================================================
# 2. LLM-анализ через Grok API (xAI)
# ==============================================================================

# Строгий системный промпт — обязывает модель вернуть ТОЛЬКО валидный JSON
# без любых markdown-оберток (```json ... ```), вводных фраз или пояснений.
_GROK_SYSTEM_PROMPT = """
Ты — ассистент для анализа транскрипций образовательных уроков.

СТРОГИЕ ПРАВИЛА ОТВЕТА:
1. Ответ должен быть ИСКЛЮЧИТЕЛЬНО валидным JSON-объектом.
2. НЕ добавляй markdown-обёртки (```json, ``` и т.д.).
3. НЕ добавляй вводные фразы, пояснения или комментарии до/после JSON.
4. Ответ начинается с символа { и заканчивается символом }.

СТРУКТУРА ОТВЕТА (строго соблюдай ключи и типы):
{
  "summary": "Краткое содержание урока в 2-4 предложениях.",
  "tags": ["тег1", "тег2", "тег3"],
  "action_items": ["Задание 1 для самостоятельной работы", "Задание 2"]
}

ПРАВИЛА ЗАПОЛНЕНИЯ:
- summary: 2–4 предложения, отражающих ключевые темы урока.
- tags: 3–7 ключевых слов/тем урока (строчные буквы, без пробелов).
- action_items: конкретные задания для студентов на дом (если в тексте нет — верни пустой массив []).
"""


def analyze_with_grok(transcript_text: str) -> dict:
    """
    Отправляет транскрипт урока в Grok API (xAI) и получает структурированный JSON-отчёт.

    Аргументы:
        transcript_text (str): Текст транскрипции урока от Whisper.

    Возвращает:
        dict: Словарь вида:
            {
                "summary": "...",
                "tags": ["...", ...],
                "action_items": ["...", ...]
            }

    Исключения:
        RuntimeError: Если API недоступен, вернул ошибку, или ответ не является валидным JSON.
    """
    if not settings.GROK_API_KEY:
        raise RuntimeError(
            "GROK_API_KEY не задан. Установите переменную окружения GROK_API_KEY."
        )

    if not transcript_text:
        # Возвращаем «пустой» отчёт, если транскрипт пустой (тихая запись)
        logger.warning("Grok API: получен пустой транскрипт, возвращаем пустой отчёт.")
        return {
            "summary": "Транскрипт урока пустой или нечитаемый.",
            "tags": [],
            "action_items": [],
        }

    # Формируем тело запроса в формате OpenAI-совместимого API
    payload = {
        "model": settings.GROK_MODEL,
        "messages": [
            {
                "role": "system",
                "content": _GROK_SYSTEM_PROMPT.strip(),
            },
            {
                "role": "user",
                "content": (
                    "Проанализируй следующую транскрипцию урока и верни JSON-отчёт:\n\n"
                    f"{transcript_text}"
                ),
            },
        ],
        # Температура 0.3 — снижает вариативность ответов, делая JSON предсказуемым
        "temperature": 0.3,
        "max_tokens": 1024,
    }

    headers = {
        "Authorization": f"Bearer {settings.GROK_API_KEY}",
        "Content-Type": "application/json",
    }

    logger.info("Grok API: отправка запроса, длина текста %d символов", len(transcript_text))

    try:
        response = requests.post(
            settings.GROK_API_URL,
            json=payload,
            headers=headers,
            timeout=60,  # тайм-аут 60 секунд — LLM может думать долго
        )
        response.raise_for_status()  # выбросит HTTPError при 4xx / 5xx
    except requests.Timeout:
        raise RuntimeError("Grok API: превышено время ожидания ответа (60 с).")
    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Grok API: HTTP-ошибка {response.status_code} — {response.text}"
        ) from exc
    except requests.RequestException as exc:
        raise RuntimeError(f"Grok API: сетевая ошибка — {exc}") from exc

    # Извлекаем текстовое содержимое ответа модели
    response_data = response.json()
    raw_content = (
        response_data
        .get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )

    logger.info("Grok API: получен ответ: %s", raw_content[:200])

    # Парсим JSON — если модель всё равно добавила обёртку, убираем её
    try:
        report = json.loads(raw_content)
    except json.JSONDecodeError:
        # Последняя попытка: ищем JSON-блок внутри ответа (на случай, если модель
        # добавила небольшой текст до/после JSON несмотря на системный промпт)
        start_idx = raw_content.find("{")
        end_idx = raw_content.rfind("}") + 1
        if start_idx != -1 and end_idx > start_idx:
            try:
                report = json.loads(raw_content[start_idx:end_idx])
            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    f"Grok API: не удалось распарсить JSON из ответа. "
                    f"Ответ модели: {raw_content[:500]}"
                ) from exc
        else:
            raise RuntimeError(
                f"Grok API: ответ не содержит валидного JSON. Ответ: {raw_content[:500]}"
            )

    # Валидируем наличие обязательных ключей с fallback-значениями
    validated_report = {
        "summary": str(report.get("summary", "")),
        "tags": list(report.get("tags", [])),
        "action_items": list(report.get("action_items", [])),
    }

    logger.info(
        "Grok API: отчёт успешно распарсен. Тегов: %d, заданий: %d",
        len(validated_report["tags"]),
        len(validated_report["action_items"]),
    )
    return validated_report


# ==============================================================================
# 3. Сохранение отчёта в MongoDB
# ==============================================================================

def save_lesson_report(
    lesson_id: int,
    transcript_text: str,
    ai_report: dict,
) -> str:
    """
    Сохраняет транскрипт и отчёт в MongoDB в коллекцию 'lesson_reports'.

    Каждый документ привязан к уроку через поле 'lesson_id' — это позволяет
    легко найти отчёт по ID урока из PostgreSQL.

    Аргументы:
        lesson_id (int):        ID урока из PostgreSQL (для связи документов).
        transcript_text (str):  Сырой текст транскрипции от Whisper.
        ai_report (dict):       Структурированный JSON-отчёт.

    Возвращает:
        str: Строковое представление ObjectId вставленного документа.

    Исключения:
        RuntimeError: Если не удалось подключиться к MongoDB или вставить документ.
    """
    try:
        db = _get_mongo_db()
        collection = db["lesson_reports"]  # коллекция для отчётов уроков

        # Документ объединяет транскрипт, отчёт и метаданные в одном месте
        document = {
            "lesson_id": lesson_id,          # ID урока из PostgreSQL (FK-ссылка)
            "transcript": transcript_text,    # сырой текст от Whisper
            "summary": ai_report.get("summary", ""),
            "tags": ai_report.get("tags", []),
            "action_items": ai_report.get("action_items", []),
            "created_at": datetime.now(tz=timezone.utc),  # время создания отчёта (UTC)
        }

        result = collection.insert_one(document)
        mongo_id = str(result.inserted_id)

        logger.info(
            "MongoDB: отчёт для урока %d сохранён, _id=%s", lesson_id, mongo_id
        )
        return mongo_id

    except Exception as exc:
        logger.error("MongoDB: ошибка сохранения отчёта для урока %d — %s", lesson_id, exc)
        raise RuntimeError(f"Ошибка сохранения в MongoDB: {exc}") from exc


# ==============================================================================
# 4. Извлечение контекста для AI-чата (RAG MVP)
# ==============================================================================

def get_student_lessons_context(user_id: int, query_text: str = "") -> str:
    """
    Извлекает контекст из последних пройденных уроков ученика.
    Находит последние 3-5 обработанных уроков, к которым привязан ученик,
    и извлекает их summary и tags из MongoDB.
    """
    try:
        from .models import Lesson, Enrollment
        
        # 1. Находим все кружки, на которые записан ученик (или которые он ведет как коуч)
        club_ids = list(Enrollment.objects.filter(
            user_id=user_id, 
            status='active'
        ).values_list('club_id', flat=True))
        
        # Если пользователь — преподаватель, добавляем его кружки
        user = Enrollment.objects.model._meta.get_field('user').remote_field.model.objects.get(id=user_id)
        if hasattr(user, 'coach_profile'):
            coach_clubs = user.coach_profile.clubs.values_list('id', flat=True)
            club_ids.extend(coach_clubs)
        
        if not club_ids:
            return "Ученик/Учитель не привязан ни к одному кружку."

        # 2. Находим последние 5 уроков из этих кружков с готовым отчетом
        recent_lessons = Lesson.objects.filter(
            club_id__in=club_ids,
            ai_status='completed'
        ).order_by('-date', '-start_time')[:5]

        if not recent_lessons:
            return "Нет обработанных отчетов по прошлым урокам."

        # 3. Извлекаем данные из MongoDB
        db = _get_mongo_db()
        collection = db["lesson_reports"]
        
        context_parts = []
        for lesson in recent_lessons:
            # Ищем отчет по lesson_id
            report = collection.find_one({"lesson_id": lesson.id})
            if report:
                summary = report.get("summary", "Нет описания")
                tags = ", ".join(report.get("tags", []))
                context_parts.append(
                    f"Название урока: {lesson.title}\n"
                    f"Дата: {lesson.date}\n"
                    f"Краткое содержание: {summary}\n"
                    f"Темы (теги): {tags}"
                )
                
        if not context_parts:
            return "Отчеты не найдены в базе данных."

        return "\n\n".join(context_parts)

    except Exception as exc:
        logger.error("Ошибка при извлечении контекста для user %s: %s", user_id, exc)
        return "Ошибка при получении контекста."


# ==============================================================================
# 5. Чат с Grok (AI Assistant с RAG)
# ==============================================================================

def chat_with_grok(messages: list, context_string: str) -> str:
    """
    Отправляет историю сообщений в Grok API с системным промптом,
    содержащим контекст из прошлых уроков ученика.
    """
    if not settings.GROK_API_KEY:
        raise RuntimeError("GROK_API_KEY не задан.")

    system_prompt = (
        "Ты — умный наставник платформы TalentTap. Твоя цель — помогать ученику. "
        f"Вот данные о последних пройденных уроках ученика:\n{context_string}\n\n"
        "Отвечай на вопросы пользователя, опираясь на эти данные. "
        "Если вопрос не связан с уроками, просто поддерживай дружелюбную беседу."
    )

    # Убеждаемся, что сообщения отформатированы правильно
    formatted_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        # Ожидаем, что msg - это словарь {"role": "user"/"assistant", "content": "..."}
        if isinstance(msg, dict) and "role" in msg and "content" in msg:
            formatted_messages.append(msg)

    payload = {
        "model": settings.GROK_MODEL,
        "messages": formatted_messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    headers = {
        "Authorization": f"Bearer {settings.GROK_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            settings.GROK_API_URL,
            json=payload,
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        response_data = response.json()
        return response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
    except Exception as exc:
        logger.error("Ошибка при запросе к Grok API для чата: %s", exc)
        raise RuntimeError(f"Grok API error: {exc}") from exc


