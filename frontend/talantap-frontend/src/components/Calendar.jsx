import React from 'react';

const Calendar = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="bg-white rounded-3xl p-6 w-80">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-700">
          {monthNames[currentMonth]} {currentYear}
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="font-bold text-slate-600 text-sm">
            {day}
          </div>
        ))}

        {days.map((day, idx) => (
          <div
            key={idx}
            className={`py-2 text-sm ${
              day === currentDay
                ? 'bg-sky-400 text-white rounded-full font-bold'
                : day
                ? 'text-slate-700'
                : ''
            }`}
          >
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;