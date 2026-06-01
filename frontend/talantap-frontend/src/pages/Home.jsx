import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { Sparkles, Zap, Users, Award, ArrowRight, Star, TrendingUp, Heart, X, Video } from 'lucide-react';
import { apiFetch } from '../auth/api';

const Home = () => {
  const navigate = useNavigate();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleRoleSelection = (role) => {
    setShowRoleModal(false);
    navigate('/recommendations', { state: { role } });
  };

  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function checkLessons() {
      try {
        const res = await apiFetch('/api/lessons/upcoming/');
        if (res.ok) {
          const data = await res.json();
          // Find the first lesson that has a meet_link
          const lessonWithLink = data.find(l => l.meet_link);
          if (!ignore && lessonWithLink) {
            setActiveLesson(lessonWithLink);
          }
        }
      } catch (e) {
        console.error('Failed to fetch upcoming lessons', e);
      }
    }
    // We can also check if user is authenticated before fetching if needed, 
    // but apiFetch handles it gracefully.
    if (localStorage.getItem('accessToken')) {
      checkLessons();
    }
    return () => { ignore = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />

      {/* Active Lesson Banner */}
      {activeLesson && activeLesson.meet_link && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xl relative z-20">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full animate-pulse">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">🚨 У вас сейчас урок: {activeLesson.title}</h3>
                <p className="text-sm text-red-100 opacity-90">
                  {activeLesson.club_title} • {activeLesson.start_time.substring(0,5)} - {activeLesson.end_time.substring(0,5)}
                </p>
              </div>
            </div>
            <a 
              href={activeLesson.meet_link} 
              target="_blank" 
              rel="noreferrer"
              className="bg-white text-rose-600 font-bold px-6 py-2.5 rounded-xl hover:bg-rose-50 transition shadow-lg whitespace-nowrap flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Подключиться
            </a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 pb-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold">AI-Powered Club Matching</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Discover Your <span className="text-yellow-300">Passion</span> Through Online Clubs
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Join exciting clubs, learn from expert coaches, and connect with students who share your interests!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/clubs')}
                className="bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-2"
              >
                Explore Clubs
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowRoleModal(true)}
                className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300 text-lg"
              >
                Get AI Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-4 py-2 mb-4">
            <Heart className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600">Student Stories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            What Our Students Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real experiences from students who discovered their passion through our platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              "The AI recommendation system was spot on! I joined the Robotics Club and now I'm building my own projects. Best decision ever!"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                AK
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Александр Козлов</h4>
                <p className="text-gray-500 text-sm">Robotics Club Member</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              "Found an amazing piano teacher through the platform. The lesson scheduling system is so convenient and I've improved so much in just 3 months!"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                МС
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Мария Соколова</h4>
                <p className="text-gray-500 text-sm">Music Club Member</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              "The basketball club here is fantastic! Great coach, awesome teammates, and the platform makes tracking my progress so easy."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                ДН
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Дмитрий Новиков</h4>
                <p className="text-gray-500 text-sm">Sports Club Member</p>
              </div>
            </div>
          </div>

          {/* Testimonial 4 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              "As a shy student, the Art Club helped me express myself creatively. I've made so many friends who share my passion for painting!"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                ЕП
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Елена Петрова</h4>
                <p className="text-gray-500 text-sm">Arts Club Member</p>
              </div>
            </div>
          </div>

          {/* Testimonial 5 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              "The coding club prepared me for my university studies. Our coach taught us Python, web development, and even AI basics. Incredible experience!"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                ИМ
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Игорь Морозов</h4>
                <p className="text-gray-500 text-sm">STEM Club Member</p>
              </div>
            </div>
          </div>

          {/* Testimonial 6 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              "I didn't know what I liked until the AI suggested the Photography Club. Now I have a hobby I'm truly passionate about. Thank you!"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                АВ
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Анна Волкова</h4>
                <p className="text-gray-500 text-sm">Arts Club Member</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Для кого ищем кружок?</h3>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-slate-600 mb-8">
              AI-помощник адаптирует вопросы и рекомендации в зависимости от вашего выбора.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelection('parent')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
              >
                <div className="text-5xl">👶</div>
                <div className="font-bold text-slate-800">Для ребёнка</div>
                <div className="text-xs text-slate-500 text-center">Я родитель, ищу кружок для детей</div>
              </button>

              <button
                onClick={() => handleRoleSelection('self')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="text-5xl">🧑</div>
                <div className="font-bold text-slate-800">Для себя</div>
                <div className="text-xs text-slate-500 text-center">Мне 6+ лет, ищу кружки сам</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;