import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CoachProfile from './pages/CoachProfile';
import Clubs from './pages/Clubs';
import Contacts from './pages/Contacts';
import Recommendations from './pages/Recommendations';
import Enrollment from './pages/Enrollment';
import Register from './pages/Register';
import Chat from './pages/Chat';
import ProtectedRoute from './auth/ProtectedRoute';
import ChatBot from './components/ChatBot';

export default function App() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  return (
    <div className="app">
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach-profile"
          element={
            <ProtectedRoute>
              <CoachProfile />
            </ProtectedRoute>
          }
        />

        <Route path="/clubs" element={<Clubs />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/contacts" element={<Contacts />} />

        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/enrollment"
          element={
            <ProtectedRoute>
              <Enrollment />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>

      {/* Global AI ChatBot - hidden on the dedicated chat page */}
      {!isChatPage && <ChatBot />}
    </div>
  );
}
