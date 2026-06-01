/**
 * audioService.js
 * Модуль для отправки аудиозаписей на бэкенд.
 *
 * Эндпоинт: POST /api/lessons/upload-audio/
 * Content-Type: multipart/form-data
 *
 * Поля формы:
 *   - audio_file  : Blob (audio/webm)
 *   - lesson_id   : string | number
 *   - teacher_id  : string | number
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Отправляет аудиозапись урока на сервер.
 *
 * @param {Blob}             audioBlob  - Blob с аудиоданными из MediaRecorder
 * @param {number|string}    lessonId   - ID урока в PostgreSQL
 * @param {number|string}    teacherId  - ID преподавателя (пользователя)
 * @param {string}           token      - JWT access-токен для авторизации
 * @returns {Promise<Object>}           - Ответ сервера (202 Accepted)
 */
export async function uploadLessonAudio(audioBlob, lessonId, teacherId, token) {
  // Собираем multipart/form-data вручную — браузер сам выставит Content-Type с boundary
  const formData = new FormData();
  formData.append('audio_file', audioBlob, `lesson_${lessonId}.webm`);
  formData.append('lesson_id', String(lessonId));
  formData.append('teacher_id', String(teacherId));

  const response = await fetch(`${API_BASE}/lessons/upload-audio/`, {
    method: 'POST',
    headers: {
      // НЕ указываем Content-Type вручную — FormData сам добавит boundary
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    // Пробуем получить описание ошибки от сервера
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Ошибка сервера: ${response.status} ${response.statusText}`
    );
  }

  // 202 Accepted — сервер принял файл, обработка идёт в фоне
  return response.json();
}
