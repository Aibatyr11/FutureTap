import { useState, useCallback } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { uploadLessonAudio } from '../services/audioService';
import { generateLessonReport } from '../services/aiService';
import { getAccessToken } from '../auth/tokenStorage';

/**
 * LessonRecorder — UI-компонент записи аудио урока для преподавателя.
 */
export default function LessonRecorder({ lessonId, teacherId, lessonTitle = 'Урок' }) {
  // Статус загрузки файла на сервер
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadMessage, setUploadMessage] = useState('');
  const [audioUrl, setAudioUrl] = useState(null); // локальный URL для предпросмотра

  // Состояния для AI-отчета
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [genError, setGenError] = useState(null);

  /**
   * Колбэк — вызывается хуком после остановки записи.
   */
  const handleRecordingFinished = useCallback(async (audioBlob) => {
    const localUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(localUrl);

    setUploadStatus('uploading');
    setUploadMessage('Загружаем запись на сервер...');

    try {
      const token = getAccessToken();
      const result = await uploadLessonAudio(audioBlob, lessonId, teacherId, token);
      setUploadStatus('success');
      setUploadMessage(result.message || 'Запись успешно загружена!');
    } catch (err) {
      console.error('[LessonRecorder] Ошибка загрузки:', err);
      setUploadStatus('error');
      setUploadMessage(err.message || 'Не удалось загрузить запись. Попробуйте снова.');
    }
  }, [lessonId, teacherId]);

  // Подключаем кастомный хук записи
  const { isRecording, startRecording, stopRecording, error: micError } = useAudioRecorder(
    handleRecordingFinished
  );

  /**
   * handleGenerateReport — запускает процесс AI-анализа аудиозаписи.
   */
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const result = await generateLessonReport(lessonId);
      // result.report = { summary, tags, action_items }
      setAiReport(result.report);
    } catch (err) {
      console.error('[LessonRecorder] AI Error:', err);
      setGenError(err.message || 'Не удалось сгенерировать отчет');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Сбрасывает состояние для новой записи.
   */
  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setUploadStatus('idle');
    setUploadMessage('');
    setAiReport(null);
    setGenError(null);
  };

  return (
    <div style={styles.card}>
      {/* Заголовок */}
      <div style={styles.header}>
        <span style={styles.icon}>🎙️</span>
        <div>
          <h3 style={styles.title}>Запись урока</h3>
          <p style={styles.subtitle}>{lessonTitle}</p>
        </div>
        {isRecording && (
          <div style={styles.liveBadge}>
            <span style={styles.liveDot} />
            REC
          </div>
        )}
      </div>

      {/* Ошибка доступа к микрофону */}
      {micError && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          ⚠️ {micError}
        </div>
      )}

      {/* Кнопки управления */}
      <div style={styles.controls}>
        {!isRecording ? (
          <button
            id="btn-start-recording"
            style={{ ...styles.btn, ...styles.btnRecord }}
            onClick={startRecording}
            disabled={uploadStatus === 'uploading' || isGenerating}
          >
            ▶ Начать запись
          </button>
        ) : (
          <button
            id="btn-stop-recording"
            style={{ ...styles.btn, ...styles.btnStop }}
            onClick={stopRecording}
          >
            ⏹ Остановить
          </button>
        )}

        {(uploadStatus === 'success' || uploadStatus === 'error') && (
          <button
            id="btn-reset-recording"
            style={{ ...styles.btn, ...styles.btnReset }}
            onClick={handleReset}
            disabled={isGenerating}
          >
            🔄 Записать заново
          </button>
        )}
      </div>

      {/* Статус загрузки */}
      {uploadStatus !== 'idle' && (
        <div style={{
          ...styles.alert,
          ...(uploadStatus === 'success' ? styles.alertSuccess : {}),
          ...(uploadStatus === 'error'   ? styles.alertError   : {}),
          ...(uploadStatus === 'uploading' ? styles.alertInfo  : {}),
        }}>
          {uploadStatus === 'uploading' && <span style={styles.spinner}>⏳</span>}
          {uploadMessage}
        </div>
      )}

      {/* Локальный предпросмотр аудио */}
      {audioUrl && (
        <div style={styles.preview}>
          <p style={styles.previewLabel}>Предпросмотр записи:</p>
          <audio controls src={audioUrl} style={styles.audioPlayer} />
          
          {/* Кнопка генерации AI-отчета появляется после успешной загрузки */}
          {uploadStatus === 'success' && !aiReport && (
            <button
              id="btn-generate-ai-report"
              style={{ 
                ...styles.btn, 
                ...styles.btnAI, 
                marginTop: '16px', 
                width: '100%',
                opacity: isGenerating ? 0.7 : 1
              }}
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span style={styles.spinner}>⏳</span> Анализ аудио (1-2 мин)...
                </>
              ) : (
                '✨ Сгенерировать ИИ-отчет'
              )}
            </button>
          )}
        </div>
      )}

      {/* Ошибка AI генерации */}
      {genError && (
        <div style={{ ...styles.alert, ...styles.alertError, marginTop: '12px' }}>
          ❌ {genError}
        </div>
      )}

      {/* Рендеринг ИИ-отчета */}
      {aiReport && (
        <div style={styles.aiReportBlock}>
          <h4 style={styles.aiTitle}>✨ Результаты анализа</h4>
          
          <div style={styles.aiSection}>
            <p style={styles.aiLabel}>Саммари урока:</p>
            <p style={styles.aiText}>{aiReport.summary}</p>
          </div>

          {aiReport.tags && aiReport.tags.length > 0 && (
            <div style={styles.aiSection}>
              <p style={styles.aiLabel}>Ключевые темы:</p>
              <div style={styles.tagContainer}>
                {aiReport.tags.map((tag, i) => (
                  <span key={i} style={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {aiReport.action_items && aiReport.action_items.length > 0 && (
            <div style={styles.aiSection}>
              <p style={styles.aiLabel}>Задания на дом:</p>
              <ul style={styles.todoList}>
                {aiReport.action_items.map((item, i) => (
                  <li key={i} style={styles.todoItem}>
                    <input type="checkbox" readOnly style={styles.checkbox} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Встроенные стили (без внешних зависимостей) ──────────────────────────

const styles = {
  card: {
    background: '#1a1a2e',
    border: '1px solid #2d2d5e',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '480px',
    fontFamily: "'Inter', sans-serif",
    color: '#e0e0f0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  icon: { fontSize: '32px' },
  title: { margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' },
  subtitle: { margin: '2px 0 0', fontSize: '13px', color: '#8888cc' },
  liveBadge: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#ff3b3b',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '1px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#fff',
    animation: 'pulse 1s infinite',
    display: 'inline-block',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  btn: {
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnRecord: {
    background: 'linear-gradient(135deg, #6c63ff, #48cae4)',
    color: '#fff',
  },
  btnStop: {
    background: 'linear-gradient(135deg, #ff6b6b, #ee0979)',
    color: '#fff',
  },
  btnReset: {
    background: '#2d2d5e',
    color: '#b0b0d0',
  },
  btnAI: {
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  aiReportBlock: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #2d2d5e',
  },
  aiTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: '#a855f7',
  },
  aiSection: {
    marginBottom: '16px',
  },
  aiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8888cc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  aiText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#e0e0f0',
    margin: 0,
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
  },
  tag: {
    background: 'rgba(168, 85, 247, 0.1)',
    color: '#a855f7',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  todoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  todoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '14px',
    color: '#e0e0f0',
    marginBottom: '8px',
  },
  checkbox: {
    marginTop: '4px',
    accentColor: '#a855f7',
    cursor: 'default',
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  alertSuccess: { background: '#1a3a2e', color: '#4ecca3', border: '1px solid #4ecca3' },
  alertError:   { background: '#3a1a1a', color: '#ff6b6b', border: '1px solid #ff4444' },
  alertInfo:    { background: '#1a2a3a', color: '#48cae4', border: '1px solid #48cae4' },
  spinner: { fontSize: '16px' },
  preview: { marginTop: '8px' },
  previewLabel: { fontSize: '12px', color: '#8888cc', marginBottom: '8px' },
  audioPlayer: { width: '100%', borderRadius: '8px' },
};
