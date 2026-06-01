import { useState, useRef, useCallback } from 'react';

/**
 * Кастомный хук для записи аудио с микрофона через MediaRecorder API.
 *
 * Возвращает:
 *   - isRecording  : boolean — идёт ли сейчас запись
 *   - startRecording() — запрашивает доступ к микрофону и стартует запись
 *   - stopRecording()  — останавливает запись, освобождает микрофон,
 *                        собирает Blob и вызывает onFinish(blob)
 *   - error        : string | null — текст ошибки доступа к микрофону
 *
 * @param {function} onFinish - колбэк, вызывается с готовым Blob после остановки
 */
export function useAudioRecorder(onFinish) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  // Refs хранят изменяемые объекты без лишних ре-рендеров
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  /**
   * Запускает запись аудио.
   * Запрашивает разрешение на микрофон у браузера.
   */
  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    try {
      // Запрашиваем доступ только к микрофону (видео не нужно)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Создаём MediaRecorder; предпочитаем webm как наиболее совместимый формат
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      // Каждый чанк данных накапливаем в массиве
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Когда запись остановлена — собираем финальный Blob и отдаём в колбэк
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        if (typeof onFinish === 'function') {
          onFinish(blob);
        }
      };

      // Стартуем запись; чанки собираем каждые 250ms для надёжности
      recorder.start(250);
      setIsRecording(true);

    } catch (err) {
      // Обычно: NotAllowedError (пользователь отказал) или NotFoundError (нет микрофона)
      console.error('[useAudioRecorder] Ошибка доступа к микрофону:', err);
      setError(err.message || 'Не удалось получить доступ к микрофону');
    }
  }, [onFinish]);

  /**
   * Останавливает запись.
   *
   * КРИТИЧЕСКИ ВАЖНО — Управление памятью:
   * После вызова recorder.stop() все активные аудио-треки потока
   * останавливаются явно через getTracks().forEach(t => t.stop()).
   * Это:
   *   а) Аппаратно выключает микрофон (убирает индикатор записи в браузере)
   *   б) Освобождает системные ресурсы (предотвращает утечки памяти)
   */
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      // Останавливаем MediaRecorder — это инициирует событие onstop
      recorder.stop();

      // Явно останавливаем все треки потока для освобождения микрофона
      recorder.stream.getTracks().forEach((track) => track.stop());
    }

    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording, error };
}
