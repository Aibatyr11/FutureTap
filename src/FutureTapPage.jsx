import React, { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';

export const API_URL = "http://localhost:8000/api/";

export default function FutureTapPage() {
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setShowModal(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // 🔐 LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // ✅ исправлено
      });

      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();

      alert( `✅ Logged in successfully!\n${data.message || ''}`);
      setShowModal(false);
      setUsername("");
      setPassword("");
    } catch (err) {
      alert('❌ Login failed. Please check your credentials.');
    }
  };

  // 📝 REGISTER
  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_URL}register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // ✅ исправлено
      });

      if (!response.ok) throw new Error('Register failed');
      alert('✅ Account created successfully!');
      setShowModal(false);
      setUsername("");
      setPassword("");
    } catch (err) {
      alert('❌ Registration failed.');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fff9e6', fontFamily: 'CMU Serif, serif' }}>
      {/* HEADER */}
      <header className="flex justify-between items-center px-10 py-3 bg-[#fff6cc] shadow-sm">
        <div className="flex items-center">
          <span className="text-3xl font-bold text-[#2e2e2e] select-none">$</span>
          <h1 className="ml-1 text-2xl font-bold text-[#f4b554]">FutureTap</h1>
        </div>

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

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-purple-300 flex items-center justify-center">
            <User className="text-[#2e2e2e] w-5 h-5" />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm font-medium text-[#2e2e2e] rounded-md transition-all duration-200 hover:bg-[#fff0b3] hover:shadow"
          >
            Sign up / Sign in
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex flex-col items-center justify-center h-[80vh] text-center text-[#2e2e2e]">
        <h2 className="text-4xl font-bold mb-4">Welcome to FutureTap</h2>
        <p className="max-w-xl text-lg text-[#444]">
          Discover clubs, sections and recommendations that suit your child's interests. 
          FutureTap helps you find their next passion easily.
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
{/* FOOTER */}
      <footer className="py-6 text-center text-sm text-[#555] bg-[#fff6cc] mt-auto">
        © {new Date().getFullYear()} FutureTap. All rights reserved.
      </footer>

      <link href="https://fonts.cdnfonts.com/css/cmu-serif" rel="stylesheet" />

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-96 relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-purple-700 transition"
              onClick={() => setShowModal(false)}
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-[#f4b554] mb-4 text-center">
              Sign up / Sign In
            </h2>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                required
              />
              <button
                type="submit"
                className="bg-[#f4b554] text-white py-2 rounded-xl transition hover:bg-[#e0a94b]"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={handleRegister}
                className="bg-gray-200 text-[#f4b554] py-2 rounded-xl transition hover:bg-gray-300"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}