import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest, registerRequest, meRequest, logoutLocal } from "./api";
import { getAccessToken } from "./tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // при старте — если есть токен, пробуем /users/me/
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const access = getAccessToken();
        if (!access) {
          if (!ignore) setUser(null);
          return;
        }
        const me = await meRequest();
        if (!ignore) setUser(me);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => (ignore = true);
  }, []);

  const value = useMemo(() => {
    return {
      user,
      loading,
      isAuth: !!user,
      async login(email, password) {
        const u = await loginRequest(email, password);
        // чтобы профиль был полным (с поля me)
        try {
          const me = await meRequest();
          setUser(me);
          return me;
        } catch {
          setUser(u || null);
          return u;
        }
      },
      async register(payload) {
        const u = await registerRequest(payload);
        try {
          const me = await meRequest();
          setUser(me);
        } catch {
          setUser(u || null);
        }
      },
      logout() {
        logoutLocal();
        setUser(null);
      },
      setUser,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
