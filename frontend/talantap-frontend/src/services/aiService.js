const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `
Ты — TalantBot, официальный AI-помощник платформы TalantTap. 
Твоя цель — помогать пользователям (родителям и детям) находить идеальные кружки, отвечать на вопросы о платформе и мотивировать к обучению.

Информация о проекте TalantTap:
1. Категории кружков:
   - STEM (Робототехника, Программирование, Data Science, AI).
   - Искусство (Рисование, Дизайн, Иллюстрация).
   - Музыка (Вокал, Пианино, Хор).
   - Спорт (Баскетбол, Шахматы, Футбол).
2. Процесс для пользователя:
   - Пользователи могут просматривать список кружков в разделе "CLUBS".
   - Для получения персональных подборов есть страница "AI Recommendations" с опросом.
   - Записаться на кружок можно через кнопку "Enroll" в карточке кружка.
   - Для записи необходимо быть зарегистрированным ("Register").
3. Твой стиль общения:
   - Дружелюбный, профессиональный, поддерживающий.
   - Используй эмодзи для создания позитивной атмосферы.
   - Отвечай на том языке, на котором говорит пользователь (в основном русский).
   - Если пользователь спрашивает о кружках, которых нет в списке (например, "космонавтика"), мягко предложи похожие из STEM или посоветуй следить за обновлениями.

Твои ограничения:
- Не выдумывай несуществующие функции платформы.
- Если ты не знаешь ответа, предложи обратиться в раздел "CONTACTS" для связи с администрацией.
`;

export const getGroqResponse = async (messages, clubContext = '') => {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API Key is missing. Please check your .env file.");
  }

  const contextPrompt = clubContext 
    ? `\n\nТекущие доступные кружки на платформе (используй эту информацию для рекомендаций):\n${clubContext}`
    : '';

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextPrompt },
          ...messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch from Groq");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error in AI Service:", error);
    throw error;
  }
};

/**
 * Отправляет сообщения чата на бэкенд, где к ним добавляется контекст 
 * из прошлых уроков ученика (RAG MVP), и затем отправляется в Grok API.
 *
 * @param {Array} messages - Массив сообщений чата
 * @returns {Promise<string>} - Ответ бота
 */
export const getBackendChatResponse = async (messages) => {
  const { apiFetch } = await import('../auth/api');
  
  const response = await apiFetch('/api/chat/', {
    method: 'POST',
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Ошибка при обращении к AI Chat API: ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
};

/**
 * Запускает процесс генерации AI-отчета по аудиозаписи урока на бэкенде.
 * Вызывает эндпоинт POST /api/lessons/<lesson_id>/generate-report/
 *
 * @param {number|string} lessonId - ID урока
 * @returns {Promise<Object>} - Объект отчета {status, transcript, report: {summary, tags, action_items}}
 */
export const generateLessonReport = async (lessonId) => {
  const { apiFetch } = await import('../auth/api');
  
  const response = await apiFetch(`/api/lessons/${lessonId}/generate-report/`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Ошибка при генерации отчета: ${response.status}`);
  }

  return response.json();
};
