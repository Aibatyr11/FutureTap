// src/pages/Enrollment.jsx
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { ArrowLeft, Star, Award, CheckCircle, Clock, Video, MessageCircle, Loader2, Users } from 'lucide-react';
import { apiFetch } from '../auth/api';

const Enrollment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clubData = location.state?.club;

  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  // ✅ coaches from backend
  const [coaches, setCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [coachesError, setCoachesError] = useState('');

  // ✅ children from backend
  const [children, setChildren] = useState([]);

  // ✅ existing enrollments from backend
  const [existingEnrollments, setExistingEnrollments] = useState([]);

  // ✅ enrollment state
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  useEffect(() => {
    if (!clubData) {
      navigate('/clubs');
    }
  }, [clubData, navigate]);

  // ✅ Load children for current user
  useEffect(() => {
    let ignore = false;

    async function loadChildren() {
      try {
        const res = await apiFetch('/api/children/', { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);

        if (!ignore) {
          setChildren(list);
          // Auto-select first child if only one
          if (list.length === 1) {
            setSelectedChild(list[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load children:', e);
        if (!ignore) setChildren([]);
      }
    }

    loadChildren();
    return () => { ignore = true; };
  }, []);

  // ✅ Load existing enrollments to check if already enrolled
  useEffect(() => {
    let ignore = false;

    async function loadEnrollments() {
      try {
        const res = await apiFetch('/api/enrollments/active/', { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);

        if (!ignore) setExistingEnrollments(list);
      } catch (e) {
        console.error('Failed to load enrollments:', e);
        if (!ignore) setExistingEnrollments([]);
      }
    }

    loadEnrollments();
    return () => { ignore = true; };
  }, []);

  // ✅ Load coaches for this club from backend
  useEffect(() => {
    let ignore = false;

    async function loadCoaches() {
      if (!clubData?.id) {
        setLoadingCoaches(false);
        setCoaches([]);
        return;
      }

      try {
        setLoadingCoaches(true);
        setCoachesError('');

        // Prefer: /api/clubs/<id>/coaches/
        const res = await fetch(`/api/clubs/${clubData.id}/coaches/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);

        if (!ignore) setCoaches(list);
      } catch (e) {
        if (!ignore) setCoachesError(e?.message || 'Failed to load coaches');
      } finally {
        if (!ignore) setLoadingCoaches(false);
      }
    }

    loadCoaches();
    return () => {
      ignore = true;
    };
  }, [clubData?.id]);

  const handleEnroll = async () => {
    // Reset states
    setEnrollError('');
    setEnrollSuccess(false);

    // Validation
    if (!selectedCoach) {
      setEnrollError('Please select a coach to continue with enrollment');
      return;
    }

    // Check if children exist and one is selected
    if (children.length > 0 && !selectedChild) {
      setEnrollError('Please select a child for enrollment');
      return;
    }

    // Check if already enrolled (from backend)
    if (existingEnrollments.length > 0) {
      setEnrollError('You are already enrolled in a club. Please unenroll from your current club to join a new one.');
      return;
    }

    const chosenCoach = coaches.find((c) => c.id === selectedCoach);
    if (!chosenCoach) {
      setEnrollError('Selected coach not found. Please refresh the page.');
      return;
    }

    // Enroll via backend API
    try {
      setEnrolling(true);

      const res = await apiFetch('/api/enrollments/', {
        method: 'POST',
        body: JSON.stringify({
          club: clubData.id,
          coach: selectedCoach,
          child: selectedChild || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data?.error || data?.detail || data?.club?.[0] || 'Enrollment failed';
        throw new Error(errorMsg);
      }

      // Success!
      setEnrollSuccess(true);

      // Show success message and redirect after delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);

    } catch (err) {
      setEnrollError(err.message || 'Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // Check if user already has enrollments
  const hasExistingEnrollment = existingEnrollments.length > 0;

  const colorClasses = useMemo(
    () => ({
      blue: 'from-blue-400 to-blue-600',
      purple: 'from-purple-400 to-purple-600',
      green: 'from-green-400 to-green-600',
      orange: 'from-orange-400 to-orange-600',
      pink: 'from-pink-400 to-pink-600',
      yellow: 'from-yellow-400 to-yellow-600',
      indigo: 'from-indigo-400 to-indigo-600',
      red: 'from-red-400 to-red-600',
    }),
    []
  );

  if (!clubData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={() => navigate('/clubs')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Clubs
          </button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Enroll in {clubData.title}</h1>
          <p className="text-xl text-blue-100">Choose your online coach and start your journey!</p>
        </div>
      </div>

      {/* Club Info Summary */}
      <div className="container mx-auto max-w-6xl px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="text-5xl">{clubData.icon}</div>
            <div className="flex-1 w-full">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{clubData.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-slate-600">Schedule:</span>
                  <span className="font-semibold text-slate-800 ml-2">{clubData.day}</span>
                </div>
                <div>
                  <span className="text-slate-600">Time:</span>
                  <span className="font-semibold text-slate-800 ml-2">{clubData.time}</span>
                </div>
                <div>
                  <span className="text-slate-600">Location:</span>
                  <span className="font-semibold text-slate-800 ml-2">{clubData.location}</span>
                </div>
              </div>

              {/* Group Capacity Indicator */}
              <div className="w-full max-w-md bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Group Capacity</span>
                  </div>
                  <span className={`text-sm font-bold ${(clubData.capacity || 0) - (clubData.enrolled || 0) > 5 ? 'text-green-600' : 'text-orange-600'}`}>
                    {(clubData.capacity || 0) - (clubData.enrolled || 0)} spots left
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, ((clubData.enrolled || 0) / (clubData.capacity || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if already enrolled */}
        {hasExistingEnrollment && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="text-3xl">⚠️</div>
              <div>
                <h3 className="font-bold text-orange-900 text-lg mb-1">Already Enrolled</h3>
                <p className="text-orange-800">
                  You are currently enrolled in <strong>{existingEnrollments[0].club.title}</strong>.
                  Each student can only enroll in one club at a time. Please unenroll from your current club to join a new one.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Child Selection */}
        {children.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Select Child</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  onClick={() => !hasExistingEnrollment && setSelectedChild(child.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedChild === child.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  } ${hasExistingEnrollment ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{child.avatar}</div>
                    <div>
                      <p className="font-semibold text-slate-800">{child.name}</p>
                      <p className="text-sm text-slate-600">Age: {child.age}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {enrollError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="text-3xl">❌</div>
              <div>
                <h3 className="font-bold text-red-900 text-lg mb-1">Enrollment Error</h3>
                <p className="text-red-800">{enrollError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {enrollSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">Successfully Enrolled!</h3>
                <p className="text-green-800">Redirecting to your profile...</p>
              </div>
            </div>
          </div>
        )}

        {/* Coaches Section */}
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Select Your Online Coach</h2>

        {/* ✅ Loading / Error / Empty */}
        {loadingCoaches && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-slate-600">
            Loading coaches...
          </div>
        )}

        {!loadingCoaches && coachesError && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-red-600">
            Error: {coachesError}
          </div>
        )}

        {!loadingCoaches && !coachesError && coaches.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-slate-600">
            No coaches available for this club. (Add coaches in Django Admin and link them to this club)
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              onClick={() => !hasExistingEnrollment && setSelectedCoach(coach.id)}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                selectedCoach === coach.id
                  ? 'ring-4 ring-blue-500 transform scale-105'
                  : 'hover:shadow-xl hover:-translate-y-1'
              } ${hasExistingEnrollment ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-gradient-to-r ${
                  colorClasses[coach.color] || colorClasses.blue
                } p-6 relative flex items-center gap-6`}
              >
                {selectedCoach === coach.id && (
                  <div className="absolute top-3 right-3 bg-white rounded-full p-1 z-10">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                
                {coach.photo ? (
                  <div className="w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl">
                    <img
                      src={coach.photo}
                      alt={coach.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-6xl flex-shrink-0">{coach.avatar || '👨‍🏫'}</div>
                )}

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{coach.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <Star className="w-4 h-4 text-yellow-300 fill-current" />
                      <span className="text-white text-sm ml-1 font-semibold">{coach.rating}</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                      {(coach.students ?? coach.students_count ?? 0)} students
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <Award className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">Experience</p>
                    <p className="text-sm font-semibold">{coach.experience}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Video className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">Specialization</p>
                    <p className="text-sm font-semibold">{coach.specialization}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">Availability</p>
                    <p className="text-sm font-semibold text-green-600">{coach.availability}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>Online coaching via video call</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enroll Button */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Ready to Start?</h3>
            <p className="text-slate-600 mb-6">
              {selectedCoach
                ? `You've selected ${coaches.find((c) => c.id === selectedCoach)?.name} as your coach.`
                : 'Please select a coach from the options above to continue.'}
            </p>
            <button
              onClick={handleEnroll}
              disabled={
                !selectedCoach ||
                hasExistingEnrollment ||
                enrolling ||
                (children.length > 0 && !selectedChild)
              }
              className={`w-full md:w-auto px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                !selectedCoach ||
                hasExistingEnrollment ||
                enrolling ||
                (children.length > 0 && !selectedChild)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-2xl transform hover:scale-105 active:scale-95'
              }`}
            >
              {enrolling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enrolling...
                </>
              ) : (
                'Complete Enrollment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
