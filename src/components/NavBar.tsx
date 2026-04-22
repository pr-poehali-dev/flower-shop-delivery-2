import { useState } from "react";
import Icon from "@/components/ui/icon";

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

  const handleScroll = (id: string) => {
    scrollTo(id);
    setMobileMenuOpen(false);
  };

  return (
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
        </div>
        <button
          className="md:hidden text-gold"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
        </button>
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
        </div>
      )}
    </header>
  );
}

export { navItems };
