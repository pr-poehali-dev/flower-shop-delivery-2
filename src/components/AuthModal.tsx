import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  onClose: () => void;
}

type Mode = "login" | "register";

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(phone, password);
      } else {
        await register(phone, password, name);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Оверлей */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Карточка */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border p-8">
        {/* Закрыть */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="X" size={20} />
        </button>

        {/* Заголовок */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-2 font-body">
            Личный кабинет
          </p>
          <h2 className="font-display text-4xl font-light">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h2>
        </div>

        {/* Переключатель */}
        <div className="flex mb-6 border border-border">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-body tracking-wide transition-all ${
              mode === "login"
                ? "bg-gold text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-body tracking-wide transition-all ${
              mode === "register"
                ? "bg-gold text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Зарегистрироваться
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">
                Ваше имя
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Как вас зовут?"
                className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
              />
            </div>
          )}

          <div>
            <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
              required
              className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
              required
              className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-rose-petal border border-[hsl(345,30%,62%,0.3)] px-4 py-3 bg-[hsl(345,30%,62%,0.08)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-background py-3.5 font-body font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading
              ? "Подождите..."
              : mode === "login"
              ? "Войти"
              : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}
