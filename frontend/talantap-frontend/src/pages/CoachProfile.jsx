import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Navbar from '../components/NavBar';
import { apiFetch } from '../auth/api';
import LessonRecorder from '../components/LessonRecorder';
import { generateLessonReport } from '../services/aiService';
import { Loader2, Users, Calendar, MapPin, Edit, PlusCircle, X, Mail, Mic, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const CoachProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Roster modal
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // New class modal
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newClassForm, setNewClassForm] = useState({
    title: '', category: '', day: '', time: '', 
    capacity: 20, min_age: 6, max_age: 18, location: 'Online', description: ''
  });
  const [creatingClass, setCreatingClass] = useState(false);
  const [createError, setCreateError] = useState('');

  // Lesson modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedClubForLesson, setSelectedClubForLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', date: '', start_time: '', end_time: '', meet_link: ''
  });
  const [schedulingLesson, setSchedulingLesson] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Audio recorder modal
  const [showRecorderModal, setShowRecorderModal] = useState(false);
  const [recorderLessons, setRecorderLessons] = useState([]);   // уроки выбранного клуба
  const [recorderClub, setRecorderClub] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Список всех записанных уроков (is_recorded=true) для секции Recordings
  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  // AI-отчёты: ключ = lesson_id, значение = { report, loading, error, expanded }
  const [reportsMap, setReportsMap] = useState({});

  // Fetch coach's clubs
  useEffect(() => {
    let ignore = false;
    async function fetchMyClubs() {
      try {
        const res = await apiFetch('/api/clubs/?coach=me');
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setClubs(Array.isArray(data) ? data : data.results || []);
          }
        }
      } catch (e) {
        console.error('Failed to fetch coach clubs', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchMyClubs();
    return () => { ignore = true; };
  }, []);

  // Fetch categories for New Class form
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiFetch('/api/clubs/categories/');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0) {
            setNewClassForm(prev => ({ ...prev, category: data[0].id }));
          }
        }
      } catch(e) {
        console.error('Failed to fetch categories', e);
      }
    }
    fetchCategories();
  }, []);

  // Fetch recorded lessons
  const fetchRecordings = async () => {
    setLoadingRecordings(true);
    try {
      const res = await apiFetch('/api/lessons/');
      if (res.ok) {
        const data = await res.json();
        const lessons = Array.isArray(data) ? data : data.results || [];
        const recorded = lessons.filter(l => l.is_recorded && l.audio_url);
        setRecordings(recorded);
        // Автоматически загружаем отчёты для всех записанных уроков
        recorded.forEach(l => fetchReportForLesson(l.id));
      }
    } catch(e) {
      console.error('Failed to fetch recordings', e);
    } finally {
      setLoadingRecordings(false);
    }
  };

  /**
   * Загружает сохранённый AI-отчёт из MongoDB для конкретного урока.
   * Не показывает ошибку если отчёт просто ещё не создавался (404).
   */
  const fetchReportForLesson = async (lessonId) => {
    setReportsMap(prev => ({ ...prev, [lessonId]: { ...prev[lessonId], loading: true } }));
    try {
      const res = await apiFetch(`/api/lessons/${lessonId}/report/`);
      if (res.ok) {
        const data = await res.json();
        setReportsMap(prev => ({
          ...prev,
          [lessonId]: { report: data.report, loading: false, error: null, expanded: true }
        }));
      } else {
        // 404 — отчёт ещё не создан, это нормально
        setReportsMap(prev => ({
          ...prev,
          [lessonId]: { report: null, loading: false, error: null, expanded: false }
        }));
      }
    } catch(e) {
      setReportsMap(prev => ({
        ...prev,
        [lessonId]: { report: null, loading: false, error: null, expanded: false }
      }));
    }
  };

  /**
   * Запускает генерацию AI-отчёта для урока прямо из карточки записи.
   */
  const handleGenerateFromCard = async (lessonId) => {
    setReportsMap(prev => ({ ...prev, [lessonId]: { ...prev[lessonId], loading: true, error: null } }));
    try {
      const result = await generateLessonReport(lessonId);
      setReportsMap(prev => ({
        ...prev,
        [lessonId]: { report: result.report, loading: false, error: null, expanded: true }
      }));
    } catch(e) {
      setReportsMap(prev => ({
        ...prev,
        [lessonId]: { ...prev[lessonId], loading: false, error: e.message }
      }));
    }
  };

  /**
   * Переключает видимость блока отчёта (раскрыть/свернуть).
   */
  const toggleReport = (lessonId) => {
    setReportsMap(prev => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], expanded: !prev[lessonId]?.expanded }
    }));
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const openRoster = async (club) => {
    setSelectedClub(club);
    setRoster([]);
    setShowRosterModal(true);
    setLoadingRoster(true);
    try {
      const res = await apiFetch(`/api/clubs/${club.id}/roster/`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreatingClass(true);
    try {
      const res = await apiFetch('/api/clubs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClassForm)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Append newly created club to list
        // Refresh full list to get proper relations resolved if needed, or just append
        window.location.reload(); 
      } else {
        setCreateError(data?.detail || JSON.stringify(data) || 'Failed to create class');
      }
    } catch(e) {
      console.error(e);
      setCreateError(e.message);
    } finally {
      setCreatingClass(false);
    }
  };

  const openScheduleLesson = (club) => {
    setSelectedClubForLesson(club);
    setLessonForm({
      title: '', 
      date: new Date().toISOString().split('T')[0], 
      start_time: '14:00', 
      end_time: '15:00', 
      meet_link: ''
    });
    setScheduleError('');
    setShowLessonModal(true);
  };

  const handleScheduleLesson = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setSchedulingLesson(true);
    try {
      const res = await apiFetch('/api/lessons/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lessonForm, club: selectedClubForLesson.id })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowLessonModal(false);
        alert('Lesson scheduled successfully!');
      } else {
        setScheduleError(data?.detail || JSON.stringify(data) || 'Failed to schedule lesson');
      }
    } catch(e) {
      console.error(e);
      setScheduleError(e.message);
    } finally {
      setSchedulingLesson(false);
    }
  };

  // Открыть модальное окно записи аудио для выбранного клуба
  const openRecorderModal = async (club) => {
    setRecorderClub(club);
    setSelectedLessonId(null);
    setRecorderLessons([]);
    setShowRecorderModal(true);
    setLoadingLessons(true);
    try {
      // Получаем список уроков этого клуба (только те, которые ведёт текущий коуч)
      const res = await apiFetch(`/api/lessons/?club=${club.id}`);
      if (res.ok) {
        const data = await res.json();
        const lessons = Array.isArray(data) ? data : data.results || [];
        setRecorderLessons(lessons);
        // Автоматически выбираем первый урок
        if (lessons.length > 0) setSelectedLessonId(lessons[0].id);
      }
    } catch(e) {
      console.error('Failed to fetch lessons', e);
    } finally {
      setLoadingLessons(false);
    }
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-indigo-600 opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-5xl text-white shadow-lg overflow-hidden border-4 border-white">
              {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : "👨‍🏫"}
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-2 uppercase tracking-wide">
                Teacher
              </div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                {user.first_name || user.username} {user.last_name}
              </h1>
              <p className="text-slate-500 text-lg">{user.email}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  logout();
                  navigate('/login');
                }} 
                className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
               >
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* My Clubs Section */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">My Classes & Groups</h2>
            <p className="text-slate-600 mt-1">Manage your active classes and track students</p>
          </div>
          <button 
            onClick={() => setShowNewClassModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            <PlusCircle className="w-5 h-5" />
            New Class
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-md text-center">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No active classes</h3>
            <p className="text-slate-600">You are not assigned to any classes right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clubs.map(club => (
              <div key={club.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl bg-indigo-50 p-3 rounded-2xl">{club.icon || "📚"}</div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{club.title}</h3>
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded mt-1">
                          {club.category}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{club.day} • {club.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{club.location}</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-semibold text-slate-700">Group Capacity</span>
                       <span className="text-sm font-bold text-indigo-600">{club.enrolled || 0} / {club.capacity || 0} Students</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                       <div 
                         className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full"
                         style={{ width: `${Math.min(100, ((club.enrolled || 0) / (club.capacity || 1)) * 100)}%` }}
                       />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-4">
                   <button 
                     onClick={() => openRoster(club)}
                     className="flex-1 font-bold text-indigo-600 hover:bg-indigo-100 rounded-xl flex items-center justify-center gap-2 py-2 transition"
                    >
                     <Users className="w-4 h-4" />
                     Roster
                   </button>
                   <button 
                     onClick={() => openScheduleLesson(club)}
                     className="flex-1 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-2 py-2 transition"
                    >
                     <Calendar className="w-4 h-4" />
                     Schedule
                   </button>
                   {/* Кнопка записи аудио урока */}
                   <button
                     onClick={() => openRecorderModal(club)}
                     className="flex-1 font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl flex items-center justify-center gap-2 py-2 transition"
                   >
                     <Mic className="w-4 h-4" />
                     Record
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ───── Recordings Section ───── */}
        <div className="mt-12">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Mic className="w-7 h-7 text-rose-500" />
                Lesson Recordings
              </h2>
              <p className="text-slate-600 mt-1">Saved audio recordings of your lessons</p>
            </div>
            <button
              onClick={fetchRecordings}
              className="px-4 py-2 text-sm font-semibold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition"
            >
              🔄 Refresh
            </button>
          </div>

          {loadingRecordings ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 shadow-md text-center border border-slate-100">
              <div className="text-5xl mb-3">🎙️</div>
              <h3 className="text-xl font-bold text-slate-700 mb-1">No recordings yet</h3>
              <p className="text-slate-500 text-sm">Use the «Record» button on a class card to start recording a lesson.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {recordings.map(lesson => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 hover:shadow-lg transition-shadow"
                >
                  {/* Шапка карточки */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full mb-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full inline-block" />
                        Recorded
                      </span>
                      <h4 className="text-lg font-bold text-slate-800">{lesson.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {lesson.club_title} • {lesson.date}
                      </p>
                    </div>
                    <div className="text-2xl bg-slate-50 p-2 rounded-xl">
                      🎧
                    </div>
                  </div>

                  {/* Аудиоплеер */}
                  <audio
                    controls
                    src={lesson.audio_url}
                    className="w-full rounded-xl mt-2"
                    style={{ accentColor: '#e11d48' }}
                  />

                  {/* AI-отчёт блок */}
                  {(() => {
                    const rs = reportsMap[lesson.id];
                    const isLoading = rs?.loading;
                    const hasReport = rs?.report;
                    const genError = rs?.error;
                    const isExpanded = rs?.expanded;

                    return (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        {/* Кнопка: генерировать или свернуть/развернуть */}
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-purple-600 text-sm font-semibold py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Анализ аудио... (1-2 мин)
                          </div>
                        ) : hasReport ? (
                          <button
                            onClick={() => toggleReport(lesson.id)}
                            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-semibold transition-colors mb-3"
                          >
                            <Sparkles className="w-4 h-4" />
                            ИИ-отчёт сохранён
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button
                            id={`btn-gen-report-${lesson.id}`}
                            onClick={() => handleGenerateFromCard(lesson.id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold hover:opacity-90 transition shadow-sm"
                          >
                            <Sparkles className="w-4 h-4" />
                            ✨ Сгенерировать ИИ-отчёт
                          </button>
                        )}

                        {/* Ошибка генерации */}
                        {genError && (
                          <div className="mt-2 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                            ❌ {genError}
                          </div>
                        )}

                        {/* Содержимое отчёта */}
                        {hasReport && isExpanded && (
                          <div className="space-y-3">
                            {/* Саммари */}
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                              <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-1">Саммари урока</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{hasReport.summary}</p>
                            </div>

                            {/* Теги */}
                            {hasReport.tags?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Ключевые темы</p>
                                <div className="flex flex-wrap gap-2">
                                  {hasReport.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full text-xs font-semibold">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Задания на дом */}
                            {hasReport.action_items?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Задания на дом</p>
                                <ul className="space-y-1.5">
                                  {hasReport.action_items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="mt-0.5 w-4 h-4 rounded border-2 border-purple-300 flex-shrink-0 bg-purple-50" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Мета-инфо */}
                  <div className="flex gap-3 mt-3 text-xs text-slate-400">
                    <span>🕐 {lesson.start_time} – {lesson.end_time}</span>
                    {lesson.coach_name && <span>👤 {lesson.coach_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Roster Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                Roster: {selectedClub?.title}
              </h3>
              <button onClick={() => setShowRosterModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {loadingRoster ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
              ) : roster.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-3">📭</div>
                  <p>No students enrolled yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roster.map((enrollment) => (
                    <div key={enrollment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                       <div className="text-4xl bg-indigo-50 w-12 h-12 flex items-center justify-center rounded-full">
                         {enrollment.child ? enrollment.child.avatar : (enrollment.user?.avatar || "🧑‍🎓")}
                       </div>
                       <div className="flex-1">
                         <h4 className="font-bold text-slate-800 text-lg">
                           {enrollment.child ? enrollment.child.name : (enrollment.user?.first_name || enrollment.user?.username)}
                         </h4>
                         <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                           <Mail className="w-4 h-4" />
                           {enrollment.user?.email}
                         </div>
                       </div>
                       <div>
                         <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                           Enrolled
                         </span>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Class Modal */}
      {showNewClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-indigo-600 text-white">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <PlusCircle className="w-6 h-6" />
                Create New Class
              </h3>
              <button onClick={() => setShowNewClassModal(false)} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateClass} className="overflow-y-auto p-6 flex flex-col gap-6 relative">
              {createError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                  {createError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Class Title</label>
                  <input type="text" required value={newClassForm.title} onChange={e => setNewClassForm({...newClassForm, title: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Adv. React Concepts" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select required value={newClassForm.category} onChange={e => setNewClassForm({...newClassForm, category: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Day schedule</label>
                  <input type="text" required value={newClassForm.day} onChange={e => setNewClassForm({...newClassForm, day: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300" placeholder="e.g. Mon & Wed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Time schedule</label>
                  <input type="text" required value={newClassForm.time} onChange={e => setNewClassForm({...newClassForm, time: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300" placeholder="e.g. 18:00 - 20:00" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                  <input type="text" required value={newClassForm.location} onChange={e => setNewClassForm({...newClassForm, location: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300" placeholder="e.g. Online / Room 101" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">Capacity</label>
                     <input type="number" min="1" required value={newClassForm.capacity} onChange={e => setNewClassForm({...newClassForm, capacity: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">Age Range</label>
                     <div className="flex items-center gap-2">
                       <input type="number" required value={newClassForm.min_age} onChange={e => setNewClassForm({...newClassForm, min_age: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300" placeholder="Min" />
                       <span className="text-slate-400">-</span>
                       <input type="number" required value={newClassForm.max_age} onChange={e => setNewClassForm({...newClassForm, max_age: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300" placeholder="Max" />
                     </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea rows="3" value={newClassForm.description} onChange={e => setNewClassForm({...newClassForm, description: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500" placeholder="Tell students about this class..."></textarea>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowNewClassModal(false)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={creatingClass} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                  {creatingClass && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Schedule Lesson
              </h3>
              <button onClick={() => setShowLessonModal(false)} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleLesson} className="p-6 flex flex-col gap-5">
              {scheduleError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm">
                  {scheduleError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lesson Title</label>
                <input type="text" required value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Introduction to Variables" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                <input type="date" required value={lessonForm.date} onChange={e => setLessonForm({...lessonForm, date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                  <input type="time" required value={lessonForm.start_time} onChange={e => setLessonForm({...lessonForm, start_time: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                  <input type="time" required value={lessonForm.end_time} onChange={e => setLessonForm({...lessonForm, end_time: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Google Meet Link</label>
                <input type="url" value={lessonForm.meet_link} onChange={e => setLessonForm({...lessonForm, meet_link: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500" placeholder="https://meet.google.com/abc-defg-hij" />
                <p className="text-xs text-slate-500 mt-1">Students will see this link on their home page</p>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowLessonModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={schedulingLesson} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                  {schedulingLesson && <Loader2 className="w-4 h-4 animate-spin" />}
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Audio Recorder Modal */}
      {showRecorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#12122a] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Шапка */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-rose-400" />
                Record Lesson — {recorderClub?.title}
              </h3>
              <button
                onClick={() => { setShowRecorderModal(false); fetchRecordings(); }}
                className="p-2 hover:bg-white/10 rounded-full text-white/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Выбор урока */}
              {loadingLessons ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : recorderLessons.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <div className="text-4xl mb-3">📭</div>
                  <p>Нет запланированных уроков для этого клуба.</p>
                  <p className="text-sm mt-1">Сначала создайте урок через «Schedule Lesson».</p>
                </div>
              ) : (
                <>
                  {/* Дропдаун выбора урока */}
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-white/70 mb-2">
                      Выберите урок для записи:
                    </label>
                    <select
                      value={selectedLessonId || ''}
                      onChange={(e) => setSelectedLessonId(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:border-indigo-400"
                    >
                      {recorderLessons.map((l) => (
                        <option key={l.id} value={l.id} style={{ background: '#1a1a2e' }}>
                          #{l.id} — {l.title} ({l.date})
                          {l.is_recorded ? ' ✅ Записан' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Компонент записи */}
                  {selectedLessonId && (
                    <LessonRecorder
                      lessonId={selectedLessonId}
                      teacherId={user?.id}
                      lessonTitle={recorderLessons.find(l => l.id === selectedLessonId)?.title || 'Урок'}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachProfile;
