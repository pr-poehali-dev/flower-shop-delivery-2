import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useCart } from "@/context/CartContext";

const HERO_IMG = "https://cdn.poehali.dev/projects/bb5c7f43-41b6-4dc5-ad7b-cb4d2b242a42/files/45b70729-bb5e-44f9-8196-c1d3a7f11002.jpg";
const PETALS_IMG = "https://cdn.poehali.dev/projects/bb5c7f43-41b6-4dc5-ad7b-cb4d2b242a42/files/a3d9d3aa-2026-47e1-9501-74ed9eff5138.jpg";
const SHOP_IMG = "https://cdn.poehali.dev/projects/bb5c7f43-41b6-4dc5-ad7b-cb4d2b242a42/files/5a682a0d-a99b-49ba-897e-7034b8edec15.jpg";

const catalog = [
  { id: 1, name: "Нежность", desc: "Пионы, фрезия, эвкалипт", price: 3200, img: HERO_IMG, tag: "Хит" },
  { id: 2, name: "Ботаника", desc: "Розы, гортензия, зелень", price: 2800, img: PETALS_IMG, tag: "Новинка" },
  { id: 3, name: "Лесная сказка", desc: "Рустик с полевыми цветами", price: 2400, img: SHOP_IMG, tag: "" },
  { id: 4, name: "Золотой час", desc: "Хризантемы, солейролия", price: 1900, img: HERO_IMG, tag: "" },
  { id: 5, name: "Романтика", desc: "Красные розы классические", price: 3500, img: PETALS_IMG, tag: "Хит" },
  { id: 6, name: "Пастель", desc: "Эустома, лизиантус, мимоза", price: 2600, img: SHOP_IMG, tag: "" },
];

interface HeroSectionProps {
  scrollTo: (id: string) => void;
}

export default function HeroSection({ scrollTo }: HeroSectionProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState<number | null>(null);

  const handleAdd = (item: typeof catalog[0]) => {
    addItem({ id: item.id, name: item.name, price: item.price, img: item.img });
    setAdded(item.id);
    setTimeout(() => setAdded(null), 1200);
  };

  return (
    <>
      {/* ── HERO ──────────────────────────────────────── */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMG} alt="Букет" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        <div className="absolute top-1/4 right-0 w-px h-64 bg-gradient-to-b from-transparent via-[hsl(38,55%,72%)] to-transparent opacity-40" />
        <div className="absolute bottom-1/4 left-0 w-px h-48 bg-gradient-to-b from-transparent via-[hsl(345,30%,62%)] to-transparent opacity-30" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <p className="animate-fade-up text-xs tracking-[0.3em] text-gold uppercase mb-6 font-body">
              Авторские букеты · Иваново
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-6xl md:text-8xl font-light leading-[0.9] mb-8">
              Цветы,<br />
              <em className="shimmer-text not-italic">говорящие</em><br />
              без слов
            </h1>
            <p className="animate-fade-up-delay-2 font-body text-lg text-muted-foreground mb-10 leading-relaxed max-w-md">
              Создаём живые композиции с душой. Свежие цветы ежедневно. Доставка по всему Иванову за 2 часа.
            </p>
            <div className="animate-fade-up-delay-3 flex flex-wrap gap-4">
              <button
                onClick={() => scrollTo("catalog")}
                className="bg-gold text-background px-8 py-3.5 font-body font-medium tracking-wide hover:opacity-90 transition-opacity"
              >
                Смотреть каталог
              </button>
              <button
                onClick={() => scrollTo("constructor")}
                className="border border-gold text-gold px-8 py-3.5 font-body tracking-wide hover:bg-gold hover:text-background transition-all"
              >
                Создать букет
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <Icon name="ChevronDown" size={20} className="text-gold" />
        </div>
      </section>

      {/* ── ЦИФРЫ ─────────────────────────────────────── */}
      <section className="py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { num: "5 лет", label: "Радуем Иваново" },
            { num: "3 000+", label: "Довольных клиентов" },
            { num: "2 часа", label: "Быстрая доставка" },
            { num: "100%", label: "Свежие цветы" },
          ].map(item => (
            <div key={item.num} className="text-center">
              <p className="font-display text-4xl md:text-5xl text-gold font-light">{item.num}</p>
              <p className="font-body text-sm text-muted-foreground mt-1 tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── КАТАЛОГ ───────────────────────────────────── */}
      <section id="catalog" className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-body">Наши работы</p>
            <h2 className="font-display text-5xl md:text-6xl font-light">Каталог<br /><em>букетов</em></h2>
          </div>
          <p className="hidden md:block font-body text-sm text-muted-foreground max-w-xs text-right leading-relaxed">
            Каждый букет — авторская работа.<br />Собирается в день заказа.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((item) => (
            <div
              key={item.id}
              className="group relative bg-card border border-border overflow-hidden hover:border-[hsl(38,55%,72%,0.4)] transition-all duration-500"
            >
              <div className="relative h-72 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {item.tag && (
                  <span className="absolute top-4 left-4 bg-gold text-background text-xs px-3 py-1 font-body tracking-wide">
                    {item.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-light">{item.name}</h3>
                    <p className="font-body text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  <p className="font-body text-lg text-gold font-medium whitespace-nowrap ml-4">{item.price.toLocaleString("ru-RU")} ₽</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAdd(item)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-body tracking-wide transition-all ${
                      added === item.id
                        ? "bg-gold text-background"
                        : "border border-border text-foreground hover:border-gold hover:text-gold"
                    }`}
                  >
                    <Icon name={added === item.id ? "Check" : "ShoppingCart"} size={14} />
                    {added === item.id ? "Добавлено" : "В корзину"}
                  </button>
                  {items.find(i => i.id === item.id) && (
                    <span className="flex items-center justify-center w-10 border border-gold text-gold text-sm font-body">
                      {items.find(i => i.id === item.id)?.quantity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}