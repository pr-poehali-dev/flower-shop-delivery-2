import { useState } from "react";
import OrderModal from "@/components/OrderModal";

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

export default function BouquetConstructor() {
  const [flowerCounts, setFlowerCounts] = useState<Record<string, number>>({});
  const [selectedGreen, setSelectedGreen] = useState("eukaliptus");
  const [selectedWrap, setSelectedWrap] = useState("kraft");
  const [bouquetNote, setBouquetNote] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);

  const bouquetTotal = Object.entries(flowerCounts).reduce((sum, [id, count]) => {
    const flower = flowers.find(f => f.id === id);
    return sum + (flower ? flower.price * count : 0);
  }, 0);

  const totalFlowers = Object.values(flowerCounts).reduce((a, b) => a + b, 0);

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

  const handleOrderSuccess = () => {
    setOrderOpen(false);
    setFlowerCounts({});
    setSelectedGreen("eukaliptus");
    setSelectedWrap("kraft");
    setBouquetNote("");
  };

  // Собираем позиции для заказа
  const orderItems = Object.entries(flowerCounts).map(([id, count]) => {
    const flower = flowers.find(f => f.id === id)!;
    return { name: flower.name, price: flower.price, quantity: count };
  });

  const greenName    = greens.find(g => g.id === selectedGreen)?.name || "";
  const wrappingName = wrappings.find(w => w.id === selectedWrap)?.name || "";

  return (
    <>
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
                      <span className="font-body text-sm">{greenName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-muted-foreground">Упаковка</span>
                      <span className="font-body text-sm">{wrappingName}</span>
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
                  onClick={() => setOrderOpen(true)}
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

      {orderOpen && (
        <OrderModal
          items={orderItems}
          green={greenName}
          wrapping={wrappingName}
          note={bouquetNote}
          total={bouquetTotal}
          onClose={() => setOrderOpen(false)}
          onSuccess={handleOrderSuccess}
        />
      )}
    </>
  );
}
