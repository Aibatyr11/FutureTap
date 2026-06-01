import React from 'react';
import { Clock, Users, CalendarDays } from 'lucide-react';

const LessonsTable = ({ lessons }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <tr>
            <th className="py-4 px-6 text-left font-bold">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </div>
            </th>
            <th className="py-4 px-6 text-left font-bold">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Club
              </div>
            </th>
            <th className="py-4 px-6 text-left font-bold">Coach</th>
            <th className="py-4 px-6 text-left font-bold">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Date
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {lessons.map((lesson, idx) => (
            <tr key={idx} className="hover:bg-blue-50 transition-colors">
              <td className="py-4 px-6 font-semibold text-slate-800">{lesson.time}</td>
              <td className="py-4 px-6 font-semibold text-slate-800">{lesson.club}</td>
              <td className="py-4 px-6 text-slate-600">{lesson.coach}</td>
              <td className="py-4 px-6 text-slate-600">{lesson.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LessonsTable