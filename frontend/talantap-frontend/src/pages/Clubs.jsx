// src/pages/Clubs.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import Carousel from '../components/Carousel';
import ClubCard from '../components/ClubCard';
import { Sparkles, TrendingUp, Users, Award, Search, Filter } from 'lucide-react';

const Clubs = () => {
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Clubs');

  // Data state
  const [clubsData, setClubsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Filter categories
  const filterCategories = ['All Clubs', 'STEM', 'Arts', 'Sports', 'Music', 'Available Spots'];

  // ===== Load clubs from backend =====
  useEffect(() => {
    let ignore = false;

    async function loadClubs() {
      try {
        setLoading(true);
        setError('');

        // DRF pagination is enabled -> response usually { count, next, previous, results: [] }
        const res = await fetch('/api/clubs/');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const clubs = Array.isArray(data) ? data : (data.results ?? []);

        if (!ignore) setClubsData(clubs);
      } catch (e) {
        if (!ignore) setError(e?.message || 'Failed to load clubs');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadClubs();
    return () => {
      ignore = true;
    };
  }, []);

  // Handlers
  const handleSearch = () => {
    // Search is applied via filteredClubs
    console.log('Searching for:', searchQuery);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleAIRecommendations = () => {
    navigate('/recommendations');
  };

  // ===== Filter + search =====
  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return (clubsData || []).filter((club) => {
      // Search
      const title = (club.title || '').toLowerCase();
      const location = (club.location || '').toLowerCase();
      const matchesSearch = !q || title.includes(q) || location.includes(q);

      // Category filter
      let matchesCategory = true;

      if (activeFilter === 'Available Spots') {
        const capacity = Number(club.capacity ?? 0);
        const enrolled = Number(club.enrolled ?? 0);
        matchesCategory = enrolled < capacity;
      } else if (activeFilter !== 'All Clubs') {
        // backend sends club.category as category name string (via serializer)
        matchesCategory = (club.category || '') === activeFilter;
      }

      return matchesSearch && matchesCategory;
    });
  }, [clubsData, searchQuery, activeFilter]);

  // Convert to carousel items
  const carouselItems = useMemo(() => {
    return filteredClubs.map((club) => (
      <ClubCard
        key={club.id}
        clubData={club}
        title={club.title}
        day={club.day}
        time={club.time}
        icon={club.icon}
        color={club.color}
        capacity={club.capacity}
        enrolled={club.enrolled}
        ageRange={club.ageRange} // camelCase from serializer
        rating={club.rating}
        featured={club.featured}
      />
    ));
  }, [filteredClubs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold">AI-Powered Club Recommendations</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Discover Amazing Clubs based on your Interests
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Join exciting activities, make new friends, and develop valuable skills!
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder="Search clubs by name, activity, or interest..."
                className="flex-1 px-2 py-3 text-gray-700 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          Loading clubs...
        </div>
      )}

      {!loading && error && (
        <div className="container mx-auto px-4 py-8 text-center text-red-600">
          Error: {error}
        </div>
      )}

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">500+</div>
            <div className="text-sm text-slate-600">Active Members</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{clubsData.length}</div>
            <div className="text-sm text-slate-600">Active Clubs</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">95%</div>
            <div className="text-sm text-slate-600">Satisfaction Rate</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">AI</div>
            <div className="text-sm text-slate-600">Smart Matching</div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="container mx-auto px-4 mt-12">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-bold text-slate-800">Filter Clubs</h3>
            {!loading && filteredClubs.length !== clubsData.length && (
              <span className="text-sm text-slate-600">
                ({filteredClubs.length} result{filteredClubs.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {filterCategories.map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Clubs Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              {activeFilter === 'All Clubs' ? 'Popular Clubs' : `${activeFilter} Clubs`}
            </h2>
          </div>

          {!loading && filteredClubs.length > 0 ? (
            <div className="px-12">
              <Carousel items={carouselItems} itemsPerView={3} gap={24} />
            </div>
          ) : !loading ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">No Clubs Found</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery
                  ? `No clubs match "${searchQuery}". Try a different search term.`
                  : `No clubs available in the ${activeFilter} category.`}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('All Clubs');
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* AI Recommendation CTA */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Not Sure Which Club to Choose?</h2>
            <p className="text-lg md:text-xl mb-6 text-blue-100">
              Get personalized AI recommendations based on your child's interests, age, and schedule!
            </p>
            <button
              onClick={handleAIRecommendations}
              className="bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg"
            >
              Get AI Recommendations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clubs;
