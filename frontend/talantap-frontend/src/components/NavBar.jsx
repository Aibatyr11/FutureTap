import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Navbar = () => {
  const { isAuth, logout, user } = useAuth();
  const navigate = useNavigate();
  const isCoach = user?.is_coach;

  return (
    <nav className="flex items-center justify-between px-8 py-4">
      <div className="flex gap-4">
        <Link to="/home" className="bg-slate-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-slate-700 transition cursor-pointer">
          HOMEPAGE
        </Link>
        <Link to="/about" className="bg-slate-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-slate-700 transition cursor-pointer">
          ABOUT US
        </Link>
        <Link to="/clubs" className="bg-slate-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-slate-700 transition cursor-pointer">
          CLUBS
        </Link>
        <Link to="/chat" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition cursor-pointer flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI CHAT
        </Link>
        <Link to="/contacts" className="bg-slate-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-slate-700 transition cursor-pointer">
          CONTACTS
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {isAuth ? (
          <>
            <Link to={isCoach ? "/coach-profile" : "/profile"} className="bg-sky-400 p-3 rounded-full hover:bg-sky-500 transition cursor-pointer" title={isCoach ? "Coach Dashboard" : "Profile"}>
              <User className="w-6 h-6 text-white" />
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="bg-red-500 p-3 rounded-full hover:bg-red-600 transition"
              title="Logout"
            >
              <LogOut className="w-6 h-6 text-white" />
            </button>
          </>
        ) : (
          <Link to="/login" className="bg-sky-400 p-3 rounded-full hover:bg-sky-500 transition cursor-pointer" title="Login">
            <User className="w-6 h-6 text-white" />
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
