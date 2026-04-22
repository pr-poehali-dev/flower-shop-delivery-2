import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

const ORDERS_URL  = "https://functions.poehali.dev/7f301e0a-1f73-4c7e-bf5b-89092a748905";
const PAYMENTS_URL = "https://functions.poehali.dev/d4b55e5a-9f15-49bc-b688-27477a344b88";

function fmt(n: number) { return n.toLocaleString("ru-RU"); }

type Step = "cart" | "checkout" | "payment" | "success";

interface PaymentSettings { yukassa: boolean; sberbank: boolean; }

export default function Cart() {
  const { items, totalPrice, changeQty, removeItem, clearCart } = useCart();
  const { customer, token } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]         = useState<Step>("cart");
  const [address, setAddress]   = useState(customer ? "" : "");
  const [recipName, setRecipName]   = useState(customer?.name || "");
  const [recipPhone, setRecipPhone] = useState(customer?.phone || "");
  const [delivDate, setDelivDate]   = useState("");
  const [note, setNote]         = useState("");

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError]     = useState("");
  const [orderId, setOrderId]           = useState<number | null>(null);

  const [paySettings, setPaySettings]   = useState<PaymentSettings>({ yukassa: false, sberbank: false });
  const [provider, setProvider]         = useState<"yukassa" | "sberbank" | "">("");
  const [payLoading, setPayLoading]     = useState(false);
  const [payError, setPayError]         = useState("");

  useEffect(() => {
    fetch(PAYMENTS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_settings" }) })
      .then(r => r.json())
      .then(d => { setPaySettings(d); if (d.yukassa) setProvider("yukassa"); else if (d.sberbank) setProvider("sberbank"); });
  }, []);

  // Шаг 1 → 2: оформление
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(""); setOrderLoading(true);
    const res = await fetch(ORDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_order", token: token || "",
        items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        delivery_address: address, delivery_date: delivDate || null,
        recipient_name: recipName, recipient_phone: recipPhone, note,
      }),
    });
    const data = await res.json();
    setOrderLoading(false);
    if (!res.ok) { setOrderError(data.error || "Ошибка оформления"); return; }
    setOrderId(data.order_id);

    // Если платёжные системы не настроены — сразу успех
    if (!paySettings.yukassa && !paySettings.sberbank) {
      clearCart(); setStep("success");
    } else {
      setStep("payment");
    }
  };

  // Шаг 2 → оплата
  const handlePay = async () => {
    if (!provider || !orderId) return;
    setPayError(""); setPayLoading(true);
    const returnUrl = `${window.location.origin}/cart?order=${orderId}&paid=1`;
    const res = await fetch(PAYMENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_payment", provider, order_id: orderId, amount: totalPrice, return_url: returnUrl }),
    });
    const data = await res.json();
    setPayLoading(false);
    if (!res.ok) { setPayError(data.error || "Ошибка оплаты"); return; }
    clearCart();
    window.location.href = data.payment_url;
  };

  // Возврат после оплаты
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1" && params.get("order")) {
      setOrderId(Number(params.get("order")));
      setStep("success");
      window.history.replaceState({}, "", "/cart");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Шапка */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="font-display text-2xl text-gold tracking-widest">ФЛОРА</button>
          <div className="flex items-center gap-3">
            {["cart","checkout","payment"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-body ${
                  step === s ? "bg-gold text-background" :
                  ["cart","checkout","payment","success"].indexOf(step) > i ? "bg-gold/30 text-gold" : "bg-border text-muted-foreground"
                }`}>{i + 1}</div>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* ── ШАГ 1: КОРЗИНА ─────────────────────────── */}
        {step === "cart" && (
          <>
            <div className="mb-8">
              <p className="text-xs tracking-[0.3em] text-gold uppercase mb-2 font-body">Шаг 1</p>
              <h1 className="font-display text-5xl font-light">Корзина</h1>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-40 text-center">
                <Icon name="ShoppingCart" size={48} className="text-muted-foreground mb-4" />
                <p className="font-display text-3xl font-light mb-2">Корзина пуста</p>
                <p className="font-body text-sm text-muted-foreground">Добавьте букеты из каталога</p>
                <button onClick={() => navigate("/")} className="mt-6 border border-border text-foreground px-6 py-2.5 font-body text-sm hover:border-gold hover:text-gold transition-all opacity-100">
                  В каталог
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-card border border-border p-4">
                      <img src={item.img} alt={item.name} className="w-20 h-20 object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xl">{item.name}</p>
                        <p className="font-body text-sm text-gold mt-0.5">{fmt(item.price)} ₽/шт</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 border border-border text-foreground hover:border-gold hover:text-gold transition-all">−</button>
                        <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 border border-border text-foreground hover:border-gold hover:text-gold transition-all">+</button>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display text-lg text-gold">{fmt(item.price * item.quantity)} ₽</p>
                        <button onClick={() => removeItem(item.id)} className="font-body text-xs text-muted-foreground hover:text-rose-petal transition-colors mt-1">
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-24 bg-card border border-border p-6">
                    <h2 className="font-display text-2xl mb-4">Итого</h2>
                    <div className="space-y-2 mb-4 border-b border-border pb-4">
                      {items.map(i => (
                        <div key={i.id} className="flex justify-between font-body text-sm">
                          <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                          <span>{fmt(i.price * i.quantity)} ₽</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mb-6">
                      <span className="font-display text-xl">К оплате</span>
                      <span className="font-display text-2xl text-gold">{fmt(totalPrice)} ₽</span>
                    </div>
                    <button onClick={() => setStep("checkout")} className="w-full bg-gold text-background py-3.5 font-body font-medium hover:opacity-90 transition-opacity">
                      Оформить заказ
                    </button>
                    <button onClick={() => navigate("/")} className="w-full mt-3 border border-border text-muted-foreground py-2.5 font-body text-sm hover:border-foreground transition-colors">
                      Продолжить покупки
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ШАГ 2: ОФОРМЛЕНИЕ ──────────────────────── */}
        {step === "checkout" && (
          <>
            <div className="mb-8 flex items-center gap-4">
              <button onClick={() => setStep("cart")} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div>
                <p className="text-xs tracking-[0.3em] text-gold uppercase mb-1 font-body">Шаг 2</p>
                <h1 className="font-display text-5xl font-light">Доставка</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-5">
                {!customer && (
                  <div className="flex items-start gap-3 bg-[hsl(38,55%,72%,0.07)] border border-[hsl(38,55%,72%,0.25)] px-4 py-3">
                    <Icon name="Info" size={15} className="text-gold mt-0.5 flex-shrink-0" />
                    <p className="font-body text-xs text-muted-foreground">
                      <button type="button" onClick={() => navigate("/")} className="text-gold underline">Войдите</button>, чтобы данные заполнились автоматически и заказ сохранился в истории.
                    </p>
                  </div>
                )}

                {[
                  { label: "Адрес доставки *", value: address, set: setAddress, type: "text", placeholder: "г. Иваново, ул. Пушкина, д. 1, кв. 5", required: true },
                  { label: "Имя получателя", value: recipName, set: setRecipName, type: "text", placeholder: "Кому?", required: false },
                  { label: "Телефон получателя *", value: recipPhone, set: setRecipPhone, type: "tel", placeholder: "+7 (___) ___-__-__", required: true },
                  { label: "Дата доставки", value: delivDate, set: setDelivDate, type: "date", placeholder: "", required: false },
                ].map(f => (
                  <div key={f.label}>
                    <label className="font-body text-xs text-muted-foreground uppercase tracking-wide block mb-2">{f.label}</label>
                    <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder} required={f.required}
                      min={f.type === "date" ? new Date().toISOString().split("T")[0] : undefined}
                      className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground" />
                  </div>
                ))}

                <div>
                  <label className="font-body text-xs text-muted-foreground uppercase tracking-wide block mb-2">Пожелание</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Открытка, время доставки, особые пожелания..."
                    className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 resize-none h-20 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground" />
                </div>

                {orderError && <p className="font-body text-sm text-rose-petal border border-[hsl(345,30%,62%,0.3)] px-4 py-3 bg-[hsl(345,30%,62%,0.08)]">{orderError}</p>}

                <button type="submit" disabled={orderLoading}
                  className="w-full bg-gold text-background py-3.5 font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {orderLoading ? "Оформляем..." : "Перейти к оплате →"}
                </button>
              </form>

              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-card border border-border p-5">
                  <h3 className="font-display text-xl mb-4">Ваш заказ</h3>
                  <div className="space-y-2 mb-4">
                    {items.map(i => (
                      <div key={i.id} className="flex justify-between font-body text-sm">
                        <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                        <span>{fmt(i.price * i.quantity)} ₽</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="font-display text-lg">Итого</span>
                    <span className="font-display text-xl text-gold">{fmt(totalPrice)} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── ШАГ 3: ОПЛАТА ──────────────────────────── */}
        {step === "payment" && (
          <>
            <div className="mb-8 flex items-center gap-4">
              <div>
                <p className="text-xs tracking-[0.3em] text-gold uppercase mb-1 font-body">Шаг 3</p>
                <h1 className="font-display text-5xl font-light">Оплата</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <p className="font-body text-sm text-muted-foreground">
                  Заказ <span className="text-gold font-medium">№{orderId}</span> оформлен. Выберите способ оплаты:
                </p>

                <div className="space-y-3">
                  {paySettings.yukassa && (
                    <button onClick={() => setProvider("yukassa")}
                      className={`w-full flex items-center gap-4 p-4 border transition-all ${provider === "yukassa" ? "border-gold bg-[hsl(38,55%,72%,0.07)]" : "border-border hover:border-muted-foreground"}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${provider === "yukassa" ? "border-gold" : "border-muted-foreground"}`}>
                        {provider === "yukassa" && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                      </div>
                      <div className="text-left">
                        <p className="font-body font-medium text-foreground">ЮKassa</p>
                        <p className="font-body text-xs text-muted-foreground">Карта, СБП, Яндекс Pay и другие</p>
                      </div>
                      <Icon name="CreditCard" size={20} className="text-muted-foreground ml-auto" />
                    </button>
                  )}

                  {paySettings.sberbank && (
                    <button onClick={() => setProvider("sberbank")}
                      className={`w-full flex items-center gap-4 p-4 border transition-all ${provider === "sberbank" ? "border-gold bg-[hsl(38,55%,72%,0.07)]" : "border-border hover:border-muted-foreground"}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${provider === "sberbank" ? "border-gold" : "border-muted-foreground"}`}>
                        {provider === "sberbank" && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                      </div>
                      <div className="text-left">
                        <p className="font-body font-medium text-foreground">Сбербанк</p>
                        <p className="font-body text-xs text-muted-foreground">Оплата через Сбербанк Онлайн</p>
                      </div>
                      <Icon name="Landmark" size={20} className="text-muted-foreground ml-auto" />
                    </button>
                  )}
                </div>

                {payError && <p className="font-body text-sm text-rose-petal border border-[hsl(345,30%,62%,0.3)] px-4 py-3">{payError}</p>}

                <div className="flex gap-3">
                  <button onClick={handlePay} disabled={!provider || payLoading}
                    className="flex-1 bg-gold text-background py-3.5 font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                    {payLoading ? "Переходим к оплате..." : `Оплатить ${fmt(totalPrice)} ₽`}
                  </button>
                </div>

                <button onClick={() => { clearCart(); setStep("success"); }}
                  className="font-body text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  Оплачу при получении
                </button>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-card border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="ShieldCheck" size={16} className="text-gold" />
                    <p className="font-body text-xs text-muted-foreground">Безопасная оплата</p>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="font-display text-lg">К оплате</span>
                    <span className="font-display text-xl text-gold">{fmt(totalPrice)} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── УСПЕХ ───────────────────────────────────── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-6">🌸</div>
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-body">Готово</p>
            <h1 className="font-display text-5xl font-light mb-3">Спасибо!</h1>
            <p className="font-body text-muted-foreground mb-1">
              Заказ <span className="text-gold font-medium">№{orderId}</span> принят.
            </p>
            <p className="font-body text-sm text-muted-foreground mb-10">Мы позвоним для подтверждения в ближайшее время.</p>
            <div className="flex gap-4 flex-wrap justify-center">
              <button onClick={() => navigate("/")} className="bg-gold text-background px-8 py-3 font-body font-medium hover:opacity-90 transition-opacity">
                На главную
              </button>
              {customer && (
                <button onClick={() => navigate("/account")} className="border border-border text-foreground px-8 py-3 font-body text-sm hover:border-gold hover:text-gold transition-all">
                  Мои заказы
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
