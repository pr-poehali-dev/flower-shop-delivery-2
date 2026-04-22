import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/987d980f-4826-40cc-bbd4-3a344576758f";
const TOKEN_KEY = "flora_token";

interface Customer {
  id: number;
  phone: string;
  name: string | null;
  email: string | null;
}

interface AuthState {
  customer: Customer | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  register: (phone: string, password: string, name: string) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ customer: null, token: null, loading: true });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setState(s => ({ ...s, loading: false })); return; }
    fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "me", token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setState({ customer: data, token, loading: false });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setState({ customer: null, token: null, loading: false });
        }
      })
      .catch(() => setState({ customer: null, token: null, loading: false }));
  }, []);

  const register = async (phone: string, password: string, name: string) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", phone, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
    localStorage.setItem(TOKEN_KEY, data.token);
    setState({ customer: data.customer, token: data.token, loading: false });
  };

  const login = async (phone: string, password: string) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка входа");
    localStorage.setItem(TOKEN_KEY, data.token);
    setState({ customer: data.customer, token: data.token, loading: false });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ customer: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
