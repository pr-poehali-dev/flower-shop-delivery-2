import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const ORDERS_URL = "https://functions.poehali.dev/7f301e0a-1f73-4c7e-bf5b-89092a748905";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderModalProps {
  items: OrderItem[];
  green: string;
  wrapping: string;
  note: string;
  total: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderModal({ items, green, wrapping, note, total, onClose, onSuccess }: OrderModalProps) {
  const { token, customer } = useAuth();

  const [address, setAddress] = useState("");
  const [recipientName, setRecipientName] = useState(customer?.name || "");
  const [recipientPhone, setRecipientPhone] = useState(customer?.phone || "");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(ORDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:           "create_order",
        token:            token || "",
        items,
        green,
        wrapping,
        note,
        delivery_address: address,
        delivery_date:    deliveryDate || null,
        recipient_name:   recipientName,
        recipient_phone:  recipientPhone,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Произошла ошибка");
      return;
    }

    setOrderId(data.order_id);
    setSuccess(true);
  };

  // Экран успеха
  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md bg-card border border-border p-10 text-center">
          <div className="text-5xl mb-4">🌸</div>
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-2 font-body">Заказ принят</p>
          <h2 className="font-display text-4xl font-light mb-3">Спасибо!</h2>
          <p className="font-body text-muted-foreground mb-2">
            Заказ <span className="text-gold font-medium">№{orderId}</span> успешно оформлен.
          </p>
          <p className="font-body text-sm text-muted-foreground mb-8">
            Мы позвоним вам для подтверждения в ближайшее время.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onSuccess}
              className="flex-1 bg-gold text-background py-3 font-body font-medium hover:opacity-90 transition-opacity"
            >
              Отлично!
            </button>
            {customer && (
              <button
                onClick={() => { onClose(); window.location.href = "/account"; }}
                className="flex-1 border border-border text-foreground py-3 font-body text-sm hover:border-gold hover:text-gold transition-all"
              >
                Мои заказы
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-card border border-border flex flex-col max-h-[90vh]">
        {/* Шапка */}
        <div className="p-6 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-1 font-body">Оформление</p>
            <h2 className="font-display text-3xl font-light">Ваш заказ</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Состав */}
        <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between font-body text-sm">
                <span className="text-foreground">{item.name} × {item.quantity}</span>
                <span className="text-gold">{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
              </div>
            ))}
            {green && (
              <div className="flex justify-between font-body text-sm text-muted-foreground">
                <span>Зелень</span><span>{green}</span>
              </div>
            )}
            {wrapping && (
              <div className="flex justify-between font-body text-sm text-muted-foreground">
                <span>Упаковка</span><span>{wrapping}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-border">
            <span className="font-display text-lg">Итого</span>
            <span className="font-display text-xl text-gold">{total.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            {!customer && (
              <div className="flex items-start gap-3 bg-[hsl(38,55%,72%,0.07)] border border-[hsl(38,55%,72%,0.25)] px-4 py-3">
                <Icon name="Info" size={15} className="text-gold mt-0.5 flex-shrink-0" />
                <p className="font-body text-xs text-muted-foreground">
                  Войдите в аккаунт, чтобы заказ сохранился в истории и данные заполнились автоматически.
                </p>
              </div>
            )}

            <div>
              <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">
                Адрес доставки *
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="г. Иваново, ул. Пушкина, д. 1, кв. 5"
                required
                className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">
                  Имя получателя
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Кому?"
                  className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">
                  Телефон *
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">
                Дата доставки
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {error && (
              <p className="font-body text-sm text-rose-petal border border-[hsl(345,30%,62%,0.3)] px-4 py-3 bg-[hsl(345,30%,62%,0.08)]">
                {error}
              </p>
            )}
          </div>

          {/* Кнопка */}
          <div className="px-6 pb-6 flex-shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-background py-3.5 font-body font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Оформляем заказ..." : `Оформить заказ · ${total.toLocaleString("ru-RU")} ₽`}
            </button>
            <p className="font-body text-xs text-muted-foreground text-center mt-3">
              Мы позвоним для подтверждения. Оплата при получении.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
