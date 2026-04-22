import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

const PROFILE_URL = "https://functions.poehali.dev/c7a04906-7d76-4bd7-b77c-c56210f8251c";

interface Address {
  id: number;
  label: string | null;
  address: string;
  is_default: boolean;
}

interface Profile {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  birth_date: string | null;
  created_at: string;
  addresses: Address[];
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  status: string;
  status_label: string;
  total_price: number;
  delivery_address: string | null;
  delivery_date: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  note: string | null;
  created_at: string;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  new:        "text-gold border-gold",
  confirmed:  "text-blue-400 border-blue-400",
  delivering: "text-amber-400 border-amber-400",
  done:       "text-emerald-400 border-emerald-400",
  cancelled:  "text-muted-foreground border-muted-foreground",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

type Tab = "profile" | "orders";

export default function Account() {
  const { customer, token, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Редактирование профиля
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBirth, setEditBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!customer) { navigate("/"); return; }
    fetchProfile();
  }, [customer]);

  useEffect(() => {
    if (tab === "orders" && orders.length === 0) fetchOrders();
  }, [tab]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    const res = await fetch(PROFILE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_profile", token }),
    });
    const data = await res.json();
    setProfile(data);
    setEditName(data.name || "");
    setEditEmail(data.email || "");
    setEditBirth(data.birth_date || "");
    setProfileLoading(false);
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const res = await fetch(PROFILE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_orders", token }),
    });
    const data = await res.json();
    setOrders(data.orders || []);
    setOrdersLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError("");
    const res = await fetch(PROFILE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_profile",
        token,
        name:       editName,
        email:      editEmail,
        birth_date: editBirth || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setSaveError(data.error || "Ошибка сохранения"); setSaving(false); return; }
    setProfile(prev => prev ? { ...prev, ...data } : prev);
    setEditing(false);
    setSaving(false);
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Шапка страницы */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-display text-2xl text-gold tracking-widest"
          >
            ФЛОРА
          </button>
          <div className="flex items-center gap-4">
            <span className="font-body text-sm text-muted-foreground hidden sm:block">
              {customer.name || customer.phone}
            </span>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors hover:border-foreground"
            >
              <Icon name="LogOut" size={13} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Заголовок */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-2 font-body">Личный кабинет</p>
          <h1 className="font-display text-5xl md:text-6xl font-light">
            {profile?.name ? profile.name : "Мой профиль"}
          </h1>
        </div>

        {/* Табы */}
        <div className="flex border-b border-border mb-10 gap-8">
          {([
            { key: "profile", label: "Профиль", icon: "User" },
            { key: "orders",  label: "История заказов", icon: "ShoppingBag" },
          ] as { key: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 pb-3 font-body text-sm tracking-wide transition-all border-b-2 -mb-px ${
                tab === t.key
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ПРОФИЛЬ ─────────────────────────────────── */}
        {tab === "profile" && (
          <div>
            {profileLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Icon name="Loader" size={18} className="animate-spin" />
                <span className="font-body text-sm">Загружаем данные...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Данные */}
                <div className="bg-card border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl">Данные аккаунта</h2>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 text-xs font-body text-gold border border-gold px-3 py-1.5 hover:bg-gold hover:text-background transition-all"
                      >
                        <Icon name="Pencil" size={12} />
                        Изменить
                      </button>
                    )}
                  </div>

                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">Имя</label>
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          placeholder="example@mail.ru"
                          className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="font-body text-xs text-muted-foreground tracking-wide uppercase block mb-2">Дата рождения</label>
                        <input
                          type="date"
                          value={editBirth}
                          onChange={e => setEditBirth(e.target.value)}
                          className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>

                      {saveError && (
                        <p className="font-body text-sm text-rose-petal">{saveError}</p>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={saveProfile}
                          disabled={saving}
                          className="flex-1 bg-gold text-background py-2.5 font-body text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {saving ? "Сохраняем..." : "Сохранить"}
                        </button>
                        <button
                          onClick={() => { setEditing(false); setSaveError(""); }}
                          className="px-4 border border-border text-muted-foreground font-body text-sm hover:border-foreground transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { icon: "Phone",       label: "Телефон",        value: profile?.phone },
                        { icon: "User",        label: "Имя",            value: profile?.name || "—" },
                        { icon: "Mail",        label: "Email",          value: profile?.email || "—" },
                        { icon: "Cake",        label: "День рождения",  value: profile?.birth_date ? formatDate(profile.birth_date) : "—" },
                        { icon: "CalendarDays",label: "В Флора с",      value: profile?.created_at ? formatDate(profile.created_at) : "—" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-border flex items-center justify-center flex-shrink-0">
                            <Icon name={item.icon} size={14} className="text-gold" />
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-foreground">{item.label}</p>
                            <p className="font-body text-sm text-foreground">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Адреса */}
                <div className="bg-card border border-border p-6">
                  <h2 className="font-display text-2xl mb-6">Адреса доставки</h2>
                  {profile?.addresses && profile.addresses.length > 0 ? (
                    <div className="space-y-3">
                      {profile.addresses.map(addr => (
                        <div key={addr.id} className={`flex items-start gap-3 p-3 border ${addr.is_default ? "border-gold bg-[hsl(38,55%,72%,0.05)]" : "border-border"}`}>
                          <Icon name="MapPin" size={15} className={addr.is_default ? "text-gold mt-0.5" : "text-muted-foreground mt-0.5"} />
                          <div>
                            {addr.label && <p className="font-body text-xs text-muted-foreground mb-0.5">{addr.label}</p>}
                            <p className="font-body text-sm">{addr.address}</p>
                            {addr.is_default && <p className="font-body text-xs text-gold mt-1">Основной адрес</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 opacity-40 text-center">
                      <Icon name="MapPin" size={32} className="text-muted-foreground mb-3" />
                      <p className="font-body text-sm text-muted-foreground">Адреса появятся<br />после первого заказа</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ИСТОРИЯ ЗАКАЗОВ ─────────────────────────── */}
        {tab === "orders" && (
          <div>
            {ordersLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Icon name="Loader" size={18} className="animate-spin" />
                <span className="font-body text-sm">Загружаем заказы...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-40 text-center">
                <Icon name="ShoppingBag" size={48} className="text-muted-foreground mb-4" />
                <p className="font-display text-3xl font-light mb-2">Заказов пока нет</p>
                <p className="font-body text-sm text-muted-foreground">Ваши заказы появятся здесь</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-card border border-border">
                    {/* Шапка заказа */}
                    <button
                      className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-[hsl(38,55%,72%,0.03)] transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="font-body text-xs text-muted-foreground mb-0.5">Заказ №{order.id}</p>
                          <p className="font-body text-sm text-foreground">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`font-body text-xs px-2.5 py-1 border ${STATUS_COLORS[order.status] || "text-muted-foreground border-muted-foreground"}`}>
                          {order.status_label}
                        </span>
                        {order.delivery_date && (
                          <span className="font-body text-xs text-muted-foreground">
                            Доставка: {formatDate(order.delivery_date)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-display text-xl text-gold">{order.total_price.toLocaleString("ru-RU")} ₽</span>
                        <Icon
                          name={expandedOrder === order.id ? "ChevronUp" : "ChevronDown"}
                          size={16}
                          className="text-muted-foreground"
                        />
                      </div>
                    </button>

                    {/* Детали заказа */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-border p-5 space-y-4">
                        {/* Состав */}
                        {order.items.length > 0 && (
                          <div>
                            <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-3">Состав заказа</p>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between font-body text-sm">
                                  <span className="text-foreground">{item.name} × {item.quantity}</span>
                                  <span className="text-gold">{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Доставка */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                          {order.delivery_address && (
                            <div className="flex items-start gap-2">
                              <Icon name="MapPin" size={14} className="text-gold mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-body text-xs text-muted-foreground">Адрес</p>
                                <p className="font-body text-sm">{order.delivery_address}</p>
                              </div>
                            </div>
                          )}
                          {order.recipient_name && (
                            <div className="flex items-start gap-2">
                              <Icon name="User" size={14} className="text-gold mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-body text-xs text-muted-foreground">Получатель</p>
                                <p className="font-body text-sm">{order.recipient_name}</p>
                                {order.recipient_phone && <p className="font-body text-sm text-muted-foreground">{order.recipient_phone}</p>}
                              </div>
                            </div>
                          )}
                          {order.note && (
                            <div className="flex items-start gap-2 sm:col-span-2">
                              <Icon name="MessageSquare" size={14} className="text-gold mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-body text-xs text-muted-foreground">Пожелание</p>
                                <p className="font-body text-sm">{order.note}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
