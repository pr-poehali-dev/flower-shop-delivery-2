import { useState } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/bb5c7f43-41b6-4dc5-ad7b-cb4d2b242a42/files/45b70729-bb5e-44f9-8196-c1d3a7f11002.jpg";
const SHOP_IMG = "https://cdn.poehali.dev/projects/bb5c7f43-41b6-4dc5-ad7b-cb4d2b242a42/files/5a682a0d-a99b-49ba-897e-7034b8edec15.jpg";
const PETALS_IMG = "https://cdn.poehali.dev/projects/bb5c7f43-41b6-4dc5-ad7b-cb4d2b242a42/files/a3d9d3aa-2026-47e1-9501-74ed9eff5138.jpg";

// ── КАТАЛОГ ──────────────────────────────────────────────
const catalog = [
  { id: 1, name: "Нежность", desc: "Пионы, фрезия, эвкалипт", price: "3 200 ₽", img: HERO_IMG, tag: "Хит" },
  { id: 2, name: "Ботаника", desc: "Розы, гортензия, зелень", price: "2 800 ₽", img: PETALS_IMG, tag: "Новинка" },
  { id: 3, name: "Лесная сказка", desc: "Рустик с полевыми цветами", price: "2 400 ₽", img: SHOP_IMG, tag: "" },
  { id: 4, name: "Золотой час", desc: "Хризантемы, солейролия", price: "1 900 ₽", img: HERO_IMG, tag: "" },
  { id: 5, name: "Романтика", desc: "Красные розы классические", price: "3 500 ₽", img: PETALS_IMG, tag: "Хит" },
  { id: 6, name: "Пастель", desc: "Эустома, лизиантус, мимоза", price: "2 600 ₽", img: SHOP_IMG, tag: "" },
];

// ── КОНСТРУКТОР ───────────────────────────────────────────
const flowers = [
  { id: "rose", name: "Роза", emoji: "🌹", price: 180 },
  { id: "peony", name: "Пион", emoji: "🌸", price: 320 },
  { id: "tulip", name: "Тюльпан", emoji: "🌷", price: 90 },
  { id: "sunflower", name: "Подсолнух", emoji: "🌻", price: 150 },
  { id: "chamomile", name: "Ромашка", emoji: "💐", price: 70 },
  { id: "orchid", name: "Орхидея", emoji: "🌺", price: 420 },
];

const greens = [
  { id: "eukaliptus", name: "Эвкалипт", emoji: "🌿" },
  { id: "fern", name: "Папоротник", emoji: "🍃" },
  { id: "ruscus", name: "Рускус", emoji: "🌱" },
];

const wrappings = [
  { id: "kraft", name: "Крафт", emoji: "📦" },
  { id: "silk", name: "Шёлк", emoji: "🎀" },
  { id: "lace", name: "Кружево", emoji: "🤍" },
  { id: "none", name: "Без упаковки", emoji: "✨" },
];

// ── ОТЗЫВЫ ────────────────────────────────────────────────
const reviews = [
  { name: "Анна М.", date: "15 апреля", text: "Заказала букет на годовщину — просто сказка! Цветы свежайшие, упаковка нежная. Привезли точно в срок.", stars: 5 },
  { name: "Дмитрий К.", date: "8 апреля", text: "Первый раз пользовался конструктором букетов — очень удобно. Жена была в восторге от пионов с эвкалиптом.", stars: 5 },
  { name: "Светлана Р.", date: "2 апреля", text: "Регулярно заказываем в офис. Всегда профессионально, всегда красиво. Рекомендую Флору!", stars: 5 },
  { name: "Михаил Ф.", date: "28 марта", text: "Очень удобный сайт, быстрая доставка. Розы простояли две недели!", stars: 4 },
];

// ── НАВИГАЦИЯ ─────────────────────────────────────────────
const navItems = [
  { id: "home", label: "Главная" },
  { id: "catalog", label: "Каталог" },
  { id: "constructor", label: "Конструктор" },
  { id: "delivery", label: "Доставка" },
  { id: "reviews", label: "Отзывы" },
  { id: "contacts", label: "Контакты" },
];

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [flowerCounts, setFlowerCounts] = useState<Record<string, number>>({});
  const [selectedGreen, setSelectedGreen] = useState("eukaliptus");
  const [selectedWrap, setSelectedWrap] = useState("kraft");
  const [bouquetNote, setBouquetNote] = useState("");

  const bouquetTotal = Object.entries(flowerCounts).reduce((sum, [id, count]) => {
    const flower = flowers.find(f => f.id === id);
    return sum + (flower ? flower.price * count : 0);
  }, 0);

  const totalFlowers = Object.values(flowerCounts).reduce((a, b) => a + b, 0);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const changeFlower = (id: string, delta: number) => {
    setFlowerCounts(prev => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── НАВБАР ────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("home")} className="font-display text-2xl text-gold tracking-widest">
            ФЛОРА
          </button>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
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
                onClick={() => scrollTo(item.id)}
                className="text-left text-base font-body text-foreground hover:text-gold transition-colors py-1"
              >
                {item.label}
              </button>
            ))}
            <a href="tel:+74932000000" className="text-gold font-body mt-2">+7 (4932) 00-00-00</a>
          </div>
        )}
      </header>

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
                  <p className="font-body text-lg text-gold font-medium whitespace-nowrap ml-4">{item.price}</p>
                </div>
                <button className="mt-4 w-full border border-border text-foreground py-2.5 text-sm font-body tracking-wide hover:border-gold hover:text-gold transition-all">
                  Заказать
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── КОНСТРУКТОР БУКЕТА ────────────────────────── */}
      <section id="constructor" className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-xs tracking-[0.3em] text-rose-petal uppercase mb-3 font-body">Ваш букет</p>
            <h2 className="font-display text-5xl md:text-6xl font-light">Конструктор<br /><em>букетов</em></h2>
            <p className="font-body text-muted-foreground mt-4 max-w-lg">
              Выберите цветы, зелень и упаковку — мы соберём именно то, что вы придумали.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* Цветы */}
              <div>
                <h3 className="font-display text-2xl mb-4 text-gold">1. Выберите цветы</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {flowers.map(flower => {
                    const count = flowerCounts[flower.id] || 0;
                    return (
                      <div
                        key={flower.id}
                        className={`relative bg-background border rounded-sm p-4 transition-all ${
                          count > 0 ? "border-gold" : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div className="text-3xl mb-2">{flower.emoji}</div>
                        <p className="font-body text-sm font-medium">{flower.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{flower.price} ₽/шт</p>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => changeFlower(flower.id, -1)}
                            disabled={count === 0}
                            className="w-7 h-7 border border-border text-foreground hover:border-gold hover:text-gold disabled:opacity-30 transition-all text-sm"
                          >
                            −
                          </button>
                          <span className="font-body text-sm w-5 text-center">{count}</span>
                          <button
                            onClick={() => changeFlower(flower.id, 1)}
                            className="w-7 h-7 border border-border text-foreground hover:border-gold hover:text-gold transition-all text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Зелень */}
              <div>
                <h3 className="font-display text-2xl mb-4 text-gold">2. Добавьте зелень</h3>
                <div className="flex flex-wrap gap-3">
                  {greens.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGreen(g.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 border font-body text-sm transition-all ${
                        selectedGreen === g.id
                          ? "border-gold text-gold bg-background"
                          : "border-border text-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <span>{g.emoji}</span> {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Упаковка */}
              <div>
                <h3 className="font-display text-2xl mb-4 text-gold">3. Упаковка</h3>
                <div className="flex flex-wrap gap-3">
                  {wrappings.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWrap(w.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 border font-body text-sm transition-all ${
                        selectedWrap === w.id
                          ? "border-rose-petal text-rose-petal bg-background"
                          : "border-border text-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <span>{w.emoji}</span> {w.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Пожелание */}
              <div>
                <h3 className="font-display text-2xl mb-4 text-gold">4. Ваше пожелание</h3>
                <textarea
                  value={bouquetNote}
                  onChange={e => setBouquetNote(e.target.value)}
                  placeholder="Расскажите об особых пожеланиях: цветовая гамма, любимые цветы, кому дарите..."
                  className="w-full bg-background border border-border text-foreground font-body text-sm p-4 resize-none h-24 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Итог */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-background border border-border p-6">
                <h3 className="font-display text-2xl mb-6">Ваш букет</h3>

                {totalFlowers === 0 ? (
                  <div className="text-center py-8 opacity-40">
                    <p className="text-4xl mb-3">💐</p>
                    <p className="font-body text-sm text-muted-foreground">Добавьте цветы,<br />чтобы увидеть состав</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {Object.entries(flowerCounts).map(([id, count]) => {
                      const flower = flowers.find(f => f.id === id)!;
                      return (
                        <div key={id} className="flex items-center justify-between text-sm font-body">
                          <span className="text-foreground">{flower.emoji} {flower.name} × {count}</span>
                          <span className="text-gold">{flower.price * count} ₽</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-body text-sm text-muted-foreground">Зелень</span>
                      <span className="font-body text-sm">{greens.find(g => g.id === selectedGreen)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-muted-foreground">Упаковка</span>
                      <span className="font-body text-sm">{wrappings.find(w => w.id === selectedWrap)?.name}</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-muted-foreground">Итого цветов: {totalFlowers}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-display text-xl">Стоимость</span>
                    <span className="font-display text-2xl text-gold">
                      {bouquetTotal > 0 ? `${bouquetTotal} ₽` : "—"}
                    </span>
                  </div>
                </div>

                <button
                  disabled={totalFlowers === 0}
                  className="w-full bg-gold text-background py-3.5 font-body font-medium tracking-wide disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Заказать букет
                </button>
                <p className="font-body text-xs text-muted-foreground text-center mt-3">
                  Мы свяжемся с вами для подтверждения
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── О ДОСТАВКЕ ────────────────────────────────── */}
      <section id="delivery" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-body">Доставка</p>
            <h2 className="font-display text-5xl md:text-6xl font-light mb-8">
              Быстро.<br />
              <em>Бережно.</em><br />
              В срок.
            </h2>
            <p className="font-body text-muted-foreground leading-relaxed mb-8 max-w-md">
              Доставляем цветы по всему Иванову в день заказа. Курьеры бережно обращаются с каждым букетом — цветы доедут в идеальном состоянии.
            </p>

            <div className="space-y-4">
              {[
                { icon: "Clock", title: "В течение 2 часов", desc: "Стандартная доставка по Иванову" },
                { icon: "MapPin", title: "Весь город", desc: "Доставляем во все районы Иванова" },
                { icon: "Package", title: "Анонимно", desc: "Отправим без указания отправителя" },
                { icon: "CalendarCheck", title: "Точно в дату", desc: "Заказ заранее — доставим день в день" },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-gold transition-colors">
                    <Icon name={item.icon} size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-foreground">{item.title}</p>
                    <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={SHOP_IMG} alt="Доставка цветов" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-gold text-background p-6">
              <p className="font-display text-4xl font-light">300 ₽</p>
              <p className="font-body text-xs tracking-wide mt-1">Доставка по городу</p>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 border border-[hsl(345,30%,62%,0.3)]" />
          </div>
        </div>
      </section>

      {/* ── ОТЗЫВЫ ────────────────────────────────────── */}
      <section id="reviews" className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-xs tracking-[0.3em] text-rose-petal uppercase mb-3 font-body">Отзывы</p>
            <h2 className="font-display text-5xl md:text-6xl font-light">
              Говорят<br /><em>клиенты</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-background border border-border p-7 hover:border-[hsl(38,55%,72%,0.4)] transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-body font-medium text-foreground">{review.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{review.date}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.stars }).map((_, i) => (
                      <span key={i} className="text-gold text-sm">★</span>
                    ))}
                  </div>
                </div>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {review.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center text-center">
            <p className="font-display text-7xl text-gold">4.9</p>
            <div className="flex gap-1 my-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-gold text-xl">★</span>
              ))}
            </div>
            <p className="font-body text-sm text-muted-foreground">На основе 127 отзывов</p>
          </div>
        </div>
      </section>

      {/* ── КОНТАКТЫ ──────────────────────────────────── */}
      <section id="contacts" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-body">Свяжитесь с нами</p>
            <h2 className="font-display text-5xl md:text-6xl font-light mb-8">
              Мы<br /><em>на связи</em>
            </h2>

            <div className="space-y-6">
              {[
                { icon: "Phone", label: "Телефон", value: "+7 (4932) 00-00-00", href: "tel:+74932000000" },
                { icon: "MessageCircle", label: "WhatsApp", value: "+7 (999) 000-00-00", href: "#" },
                { icon: "MapPin", label: "Адрес", value: "г. Иваново, ул. Цветочная, 1", href: "#" },
                { icon: "Clock", label: "Режим работы", value: "Ежедневно 8:00 – 22:00", href: null },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground tracking-wide uppercase mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-body text-foreground hover:text-gold transition-colors">{item.value}</a>
                    ) : (
                      <p className="font-body text-foreground">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border p-8">
            <h3 className="font-display text-3xl mb-6">Оставьте заявку</h3>
            <div className="space-y-4">
              <div>
                <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">Ваше имя</label>
                <input
                  type="text"
                  placeholder="Как вас зовут?"
                  className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">Телефон</label>
                <input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">Сообщение</label>
                <textarea
                  placeholder="Расскажите, какой букет вас интересует..."
                  className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 resize-none h-28 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <button className="w-full bg-gold text-background py-3.5 font-body font-medium tracking-wide hover:opacity-90 transition-opacity">
                Отправить заявку
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── ФУТЕР ─────────────────────────────────────── */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl text-gold tracking-widest mb-1">ФЛОРА</p>
            <p className="font-body text-xs text-muted-foreground">Авторские букеты · Иваново</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="font-body text-xs text-muted-foreground hover:text-gold transition-colors tracking-wide uppercase"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <p className="font-body text-xs text-muted-foreground">© 2024 Флора</p>
        </div>
      </footer>
    </div>
  );
}