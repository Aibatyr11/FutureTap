import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar, Users, Star } from 'lucide-react';

const ClubCard = ({
  clubData,
  title,
  day,
  time,
  icon,
  color = 'blue',
  capacity = 20,
  enrolled = 0,
  ageRange = '6-12',
  rating = 4.5,
  featured = false
}) => {
  const navigate = useNavigate();
  const availableSpots = capacity - enrolled;
  const enrollmentPercentage = (enrolled / capacity) * 100;

  const colorClasses = {
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600',
    green: 'from-green-400 to-green-600',
    orange: 'from-orange-400 to-orange-600',
    pink: 'from-pink-400 to-pink-600',
    yellow: 'from-yellow-400 to-yellow-600',
    red: 'from-red-400 to-red-600',
    indigo: 'from-indigo-400 to-indigo-600',
    violet: 'from-violet-500 to-violet-700',
    teal: 'from-teal-500 to-teal-700',
    brown: 'from-amber-800 to-amber-950',
    crimson: 'from-rose-600 to-rose-800',
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
      {/* Header with Icon */}
      <div className={`bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} p-6 relative`}>
        {featured && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Popular
          </div>
        )}
        <div className="text-white text-5xl mb-3">{icon || '🎯'}</div>
        <h3 className="font-bold text-white text-2xl mb-1">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="w-4 h-4 text-yellow-300 fill-current" />
            <span className="text-white text-sm ml-1 font-semibold">{rating}</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
            Ages {ageRange}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-grow">
        {/* Schedule Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 text-slate-700">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} bg-opacity-10`}>
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Schedule</p>
              <p className="text-sm font-semibold">{day}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} bg-opacity-10`}>
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Time</p>
              <p className="text-sm font-semibold">{time}</p>
            </div>
          </div>
        </div>

        {/* Capacity Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Availability</span>
            </div>
            <span className={`text-sm font-bold ${availableSpots > 5 ? 'text-green-600' : 'text-orange-600'}`}>
              {availableSpots} spots left
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} transition-all duration-500 rounded-full`}
              style={{ width: `${enrollmentPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer with Enroll Button */}
      <div className="p-6 pt-0">
        <button
          onClick={() => navigate('/enrollment', { state: { club: clubData } })}
          className={`w-full font-bold py-3 px-6 rounded-xl transition-all duration-300 text-lg ${
            availableSpots === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : `bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} text-white hover:shadow-lg transform hover:scale-105 active:scale-95`
          }`}
          disabled={availableSpots === 0}
        >
          {availableSpots > 0 ? 'Enroll Now' : 'Full'}
        </button>
      </div>
    </div>
  );
};

export default ClubCard;