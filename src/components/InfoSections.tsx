import Icon from "@/components/ui/icon";
import { navItems } from "@/components/NavBar";

const SHOP_IMG = "https://cdn.poehali.dev/projects/bb5c7f43-41b6-4dc5-ad7b-cb4d2b242a42/files/5a682a0d-a99b-49ba-897e-7034b8edec15.jpg";

const reviews = [
  { name: "Анна М.", date: "15 апреля", text: "Заказала букет на годовщину — просто сказка! Цветы свежайшие, упаковка нежная. Привезли точно в срок.", stars: 5 },
  { name: "Дмитрий К.", date: "8 апреля", text: "Первый раз пользовался конструктором букетов — очень удобно. Жена была в восторге от пионов с эвкалиптом.", stars: 5 },
  { name: "Светлана Р.", date: "2 апреля", text: "Регулярно заказываем в офис. Всегда профессионально, всегда красиво. Рекомендую Флору!", stars: 5 },
  { name: "Михаил Ф.", date: "28 марта", text: "Очень удобный сайт, быстрая доставка. Розы простояли две недели!", stars: 4 },
];

interface InfoSectionsProps {
  scrollTo: (id: string) => void;
}

export default function InfoSections({ scrollTo }: InfoSectionsProps) {
  return (
    <>
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
    </>
  );
}
