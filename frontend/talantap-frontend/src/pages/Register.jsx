import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.username || !form.password || !form.password2) {
      setError("email, username, password, password2 are required");
      return;
    }
    if (form.password !== form.password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await register(form);
      navigate("/profile");
    } catch (err) {
      setError(err?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden flex flex-col">
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <Navbar />

      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl">
          <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Sign Up
          </h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="E-mail"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First name"
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <input
                type="text"
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Repeat password"
                value={form.password2}
                onChange={(e) => setField("password2", e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-300 ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-xl"
                }`}
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-gray-600 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-500 transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
