import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import AuthModal from "@/components/AuthModal";

const navItems = [
  { id: "home", label: "Главная" },
  { id: "catalog", label: "Каталог" },
  { id: "constructor", label: "Конструктор" },
  { id: "delivery", label: "Доставка" },
  { id: "reviews", label: "Отзывы" },
  { id: "contacts", label: "Контакты" },
];

interface NavBarProps {
  scrollTo: (id: string) => void;
}

export default function NavBar({ scrollTo }: NavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { customer, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();

  const handleScroll = (id: string) => {
    scrollTo(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => handleScroll("home")} className="font-display text-2xl text-gold tracking-widest">
            ФЛОРА
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleScroll(item.id)}
                className="text-sm font-body text-muted-foreground hover:text-gold transition-colors tracking-wide"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+74932000000" className="text-sm text-gold font-body tracking-wide">
              +7 (4932) 00-00-00
            </a>

            {/* Корзина */}
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center gap-1.5 border border-border text-foreground px-3 py-1.5 hover:border-gold hover:text-gold transition-all"
            >
              <Icon name="ShoppingCart" size={16} />
              <span className="font-body text-xs">Корзина</span>
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-background text-[10px] font-body font-medium w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </button>

            {customer ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/account")}
                  className="flex items-center gap-2 text-sm font-body hover:opacity-80 transition-opacity"
                >
                  <Icon name="UserCircle" size={18} className="text-gold" />
                  <span className="text-gold">{customer.name || customer.phone}</span>
                </button>
                <button
                  onClick={logout}
                  className="text-xs font-body text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors hover:border-foreground"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-2 border border-gold text-gold text-sm font-body px-4 py-1.5 hover:bg-gold hover:text-background transition-all"
              >
                <Icon name="LogIn" size={15} />
                Войти
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {/* Корзина мобильная */}
            <button onClick={() => navigate("/cart")} className="relative text-foreground hover:text-gold transition-colors">
              <Icon name="ShoppingCart" size={22} />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-background text-[10px] font-body font-medium w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </button>
            <button className="text-gold" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-background/98 backdrop-blur-xl border-t border-border px-6 py-4 flex flex-col gap-4">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleScroll(item.id)}
                className="text-left text-base font-body text-foreground hover:text-gold transition-colors py-1"
              >
                {item.label}
              </button>
            ))}
            <a href="tel:+74932000000" className="text-gold font-body mt-2">+7 (4932) 00-00-00</a>

            {customer ? (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button
                  onClick={() => { navigate("/account"); setMobileMenuOpen(false); }}
                  className="font-body text-sm text-gold hover:opacity-80 transition-opacity"
                >
                  {customer.name || customer.phone}
                </button>
                <button onClick={logout} className="font-body text-xs text-muted-foreground">Выйти</button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthOpen(true); setMobileMenuOpen(false); }}
                className="w-full bg-gold text-background py-2.5 font-body text-sm tracking-wide"
              >
                Войти / Зарегистрироваться
              </button>
            )}
          </div>
        )}
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}

export { navItems };
