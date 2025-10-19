// FutureTapPage.jsx
// Полная страница, повторяющая твой макет: бежевый фон, фиолетовая иконка, hover-эффекты, шрифт CMU Serif

import React from 'react';
import { User } from 'lucide-react'; // иконка пользователя

export default function FutureTapPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fff9e6', fontFamily: 'CMU Serif, serif' }}>
      {/* Навигация */}
      <header className="flex justify-between items-center px-10 py-3 bg-[#fff6cc] shadow-sm">
        {/* Левая часть - логотип */}
        <div className="flex items-center">
          <span className="text-3xl font-bold text-[#2e2e2e] select-none">$</span>
          <h1 className="ml-1 text-2xl font-bold text-[#f4b554]">FutureTap</h1>
        </div>

        {/* Центральное меню */}
        <nav className="flex gap-6">
          {['Clubs and Sections', 'Recommendations', 'Contacts'].map((item, index) => (
            <button
              key={index}
              className="px-5 py-2 bg-[#ffe990] rounded-full text-[#2e2e2e] font-medium transition-all duration-200 hover:bg-[#ffd966] hover:shadow-md"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Правая часть - профиль и вход */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-purple-300 flex items-center justify-center">
            <User className="text-[#2e2e2e] w-5 h-5" />
          </div>
          <button className="px-4 py-2 text-sm font-medium text-[#2e2e2e] rounded-md transition-all duration-200 hover:bg-[#fff0b3] hover:shadow">
            Sign up / Sign in
          </button>
        </div>
      </header>

      {/* Основная часть страницы */}
      <main className="flex flex-col items-center justify-center h-[80vh] text-center text-[#2e2e2e]">
        <h2 className="text-4xl font-bold mb-4">Welcome to FutureTap</h2>
        <p className="max-w-xl text-lg text-[#444]">
          Discover clubs, sections and recommendations that suit your interests. FutureTap helps you find your next passion easily.
        </p>
        <div className="mt-10 flex gap-4">
          <button className="px-6 py-3 rounded-full bg-[#ffe990] font-semibold transition-all duration-200 hover:bg-[#ffd966] hover:shadow-md">
            Explore Clubs
          </button>
          <button className="px-6 py-3 rounded-full border border-[#2e2e2e] text-[#2e2e2e] font-semibold transition-all duration-200 hover:bg-[#fff0b3] hover:shadow">
            Learn More
          </button>
        </div>
      </main>

      {/* Подвал */}
      <footer className="py-6 text-center text-sm text-[#555] bg-[#fff6cc] mt-auto">
        © {new Date().getFullYear()} FutureTap. All rights reserved.
      </footer>

      {/* Подключение шрифта CMU Serif */}
      <link
        href="https://fonts.cdnfonts.com/css/cmu-serif"
        rel="stylesheet"
      />
    </div>
  );
}
