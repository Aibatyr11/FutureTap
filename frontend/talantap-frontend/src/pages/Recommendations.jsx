import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/NavBar';

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'parent';
  const isSelf = role === 'self';
  const [step, setStep] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quiz answers
  const [answers, setAnswers] = useState({
    age: '',
    interests: [],
    experience: '',
    goals: []
  });

  const questions = {
    age: {
      title: isSelf ? 'Сколько вам лет?' : 'Сколько лет ребёнку?',
      options: [
        { value: '6-8', label: '6-8 лет', icon: '👶' },
        { value: '9-12', label: '9-12 лет', icon: '🧒' },
        { value: '13-15', label: '13-15 лет', icon: '👦' },
        { value: '16+', label: '16+ лет', icon: '🧑' }
      ]
    },
    interests: {
      title: isSelf ? 'Что вас интересует? (выберите несколько)' : 'Что интересует ребёнка? (выберите несколько)',
      subtitle: 'Выберите все интересующие направления',
      options: [
        { value: 'robotics programming engineering', label: 'Робототехника', icon: '🤖' },
        { value: 'coding programming algorithms web development', label: 'Программирование', icon: '💻' },
        { value: 'art drawing painting design illustration creative', label: 'Искусство и рисование', icon: '🎨' },
        { value: 'music singing vocal performance choir', label: 'Музыка и вокал', icon: '🎵' },
        { value: 'data science machine learning AI research statistics', label: 'Data Science и AI', icon: '🧠' },
        { value: 'chess strategy logic board games', label: 'Шахматы и логика', icon: '♟️' }
      ],
      multiple: true
    },
    experience: {
      title: 'Какой уровень опыта?',
      options: [
        { value: 'beginner', label: 'Новичок, только начинаю', icon: '🌱' },
        { value: 'intermediate', label: 'Есть базовые знания', icon: '📚' },
        { value: 'advanced', label: 'Уверенный уровень', icon: '💪' },
        { value: 'any', label: 'Любой уровень', icon: '🌟' }
      ]
    },
    goals: {
      title: 'Какова цель занятий? (выберите несколько)',
      subtitle: 'Выберите все подходящие варианты',
      options: [
        { value: 'hobby fun entertainment', label: 'Хобби и развлечение', icon: '🎮' },
        { value: 'professional career skills', label: 'Профессиональное развитие', icon: '💼' },
        { value: 'socializing friends teamwork', label: 'Общение и командная работа', icon: '👥' },
        { value: 'competitions achievements', label: 'Соревнования и достижения', icon: '🏆' },
        { value: 'school education learning', label: 'Дополнение к школьной программе', icon: '📖' }
      ],
      multiple: true
    }
  };

  const handleAnswer = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handleMultipleAnswer = (question, value) => {
    setAnswers(prev => {
      const current = prev[question] || [];
      if (current.includes(value)) {
        return {
          ...prev,
          [question]: current.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [question]: [...current, value]
        };
      }
    });
  };

  const buildInterestsString = () => {
    const parts = [];

    // Add interests (selected categories)
    if (answers.interests.length > 0) {
      parts.push(answers.interests.join(' '));
    }

    // Add experience keywords
    const experienceKeywords = {
      'beginner': 'beginner starter introductory',
      'intermediate': 'intermediate basic fundamentals',
      'advanced': 'advanced professional expert',
      'any': ''
    };
    if (experienceKeywords[answers.experience]) {
      parts.push(experienceKeywords[answers.experience]);
    }

    // Add goals
    if (answers.goals.length > 0) {
      parts.push(answers.goals.join(' '));
    }

    return parts.join(' ');
  };

  const nextStep = () => {
    // Validation for each step
    if (step === 1 && !answers.age) return false;
    if (step === 2 && answers.interests.length === 0) return false;
    if (step === 3 && !answers.experience) return false;
    if (step === 4 && answers.goals.length === 0) return false;

    if (step < 4) {
      setStep(step + 1);
    } else {
      getRecommendations();
    }
    return true;
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getRecommendations = async () => {
    const interestsString = buildInterestsString();

    if (!interestsString.trim()) {
      setError('Не удалось сформировать запрос на основе ответов');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/recommend-clubs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: interestsString, top_n: 5 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка получения рекомендаций');
      }

      setRecommendations(data.recommendations || []);

      if (data.recommendations.length === 0) {
        setError('По вашим ответам ничего не найдено. Попробуйте выбрать другие варианты.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setStep(1);
    setAnswers({
      age: '',
      interests: [],
      experience: '',
      goals: []
    });
    setRecommendations([]);
    setError('');
  };

  const handleEnrollClick = async (clubId) => {
    try {
      // Fetch full club data
      const res = await fetch(`/api/clubs/${clubId}/`);
      if (!res.ok) throw new Error('Failed to load club data');

      const clubData = await res.json();

      // Navigate to enrollment page with club data
      navigate('/enrollment', { state: { club: clubData } });
    } catch (err) {
      console.error('Error loading club data:', err);
      setError('Не удалось загрузить данные кружка. Попробуйте позже.');
    }
  };

  const renderQuestion = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{questions.age.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              {questions.age.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer('age', option.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    answers.age === option.value
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-slate-800">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{questions.interests.title}</h2>
              {questions.interests.subtitle && (
                <p className="text-slate-600">{questions.interests.subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {questions.interests.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleMultipleAnswer('interests', option.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    answers.interests.includes(option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-slate-800">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{questions.experience.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              {questions.experience.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer('experience', option.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    answers.experience === option.value
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-slate-800">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{questions.goals.title}</h2>
              {questions.goals.subtitle && (
                <p className="text-slate-600">{questions.goals.subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {questions.goals.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleMultipleAnswer('goals', option.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    answers.goals.includes(option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-slate-800">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-sky-300">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          {recommendations.length === 0 && (
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Найдите идеальный кружок
              </h1>
              <p className="text-slate-600">
                Ответьте на несколько вопросов, и AI подберёт лучшие варианты
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {recommendations.length === 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Вопрос {step} из 4
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {step * 25}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${step * 25}%` }}
                />
              </div>
            </div>
          )}

          {/* Quiz Card */}
          {recommendations.length === 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {renderQuestion()}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={prevStep}
                  disabled={step === 1}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  ← Назад
                </button>
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {step === 4 ? 'Получить рекомендации' : 'Далее →'}
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin text-6xl mb-4">⚙️</div>
              <p className="text-xl text-slate-700">AI анализирует ваши ответы...</p>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && recommendations.length === 0 && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Results */}
          {recommendations.length > 0 && !loading && (
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    Идеальные кружки для вас!
                  </h2>
                  <p className="text-slate-600">
                    Найдено {recommendations.length} кружков на основе ваших ответов
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                {recommendations.map((club) => (
                  <div
                    key={club.club_id}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-bold text-slate-800">
                        {club.name}
                      </h3>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {(club.similarity * 100).toFixed(1)}% подходя
                      </div>
                    </div>

                    <p className="text-slate-600 mb-4">{club.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {club.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleEnrollClick(club.club_id)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-95"
                    >
                      Записаться на кружок →
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={resetQuiz}
                className="mt-6 w-full px-8 py-3 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Пройти опрос заново
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations