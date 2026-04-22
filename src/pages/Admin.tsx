import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL    = "https://functions.poehali.dev/f4fc8f7f-2f61-488d-b919-875f039728f0";
const PAYMENTS_URL = "https://functions.poehali.dev/d4b55e5a-9f15-49bc-b688-27477a344b88";
const TOKEN_KEY    = "flora_admin_token";

const STATUS_LABELS: Record<string, string> = {
  new: "Новый", confirmed: "Подтверждён",
  delivering: "Доставляется", done: "Выполнен", cancelled: "Отменён",
};
const STATUS_COLORS: Record<string, string> = {
  new: "text-gold border-gold bg-[hsl(38,55%,72%,0.1)]",
  confirmed: "text-blue-400 border-blue-400 bg-blue-400/10",
  delivering: "text-amber-400 border-amber-400 bg-amber-400/10",
  done: "text-emerald-400 border-emerald-400 bg-emerald-400/10",
  cancelled: "text-muted-foreground border-border",
};

function fmt(n: number) { return n.toLocaleString("ru-RU"); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }); }

type Tab = "orders" | "analytics" | "products" | "payments";

interface Order {
  id: number; status: string; total_price: number;
  delivery_address: string | null; delivery_date: string | null;
  recipient_name: string | null; recipient_phone: string | null;
  note: string | null; created_at: string;
  customer_name: string | null; customer_phone: string | null;
  items: { name: string; price: number; quantity: number }[];
}
interface Product {
  id: number; name: string; slug: string; description: string | null;
  composition: string | null; price: number; old_price: number | null;
  image_url: string | null; tag: string | null; in_stock: boolean;
  sort_order: number; category_name: string | null; category_id: number | null;
}
interface Analytics {
  summary: { total_orders: number; total_revenue: number; avg_order: number; done_orders: number; cancelled_orders: number; new_orders: number };
  by_day: { date: string; orders: number; revenue: number }[];
  top_items: { name: string; quantity: number; revenue: number }[];
  by_status: Record<string, number>;
}

// ── API helper ──────────────────────────────────────────
async function api(action: string, payload: object = {}, token = "") {
  const res = await fetch(ADMIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, admin_token: token, ...payload }),
  });
  return { data: await res.json(), ok: res.ok };
}

// ── Компонент входа ──────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { data, ok } = await api("login", { password });
    setLoading(false);
    if (!ok) { setError(data.error || "Неверный пароль"); return; }
    localStorage.setItem(TOKEN_KEY, data.admin_token);
    onLogin(data.admin_token);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl text-gold tracking-widest mb-1">ФЛОРА</p>
          <p className="font-body text-sm text-muted-foreground">Панель администратора</p>
        </div>
        <div className="bg-card border border-border p-8">
          <h1 className="font-display text-2xl mb-6">Вход</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wide block mb-2">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus
                className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors" />
            </div>
            {error && <p className="font-body text-sm text-rose-petal">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-gold text-background py-3 font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Раздел: Заказы ───────────────────────────────────────
function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api("get_orders", { status: statusFilter || undefined, limit: 100 }, token);
    setOrders(data.orders || []); setTotal(data.total || 0);
    setLoading(false);
  }, [token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId: number, status: string) => {
    setUpdating(orderId);
    await api("update_order", { order_id: orderId, status }, token);
    setUpdating(null);
    load();
  };

  return (
    <div>
      {/* Фильтр */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="font-body text-sm text-muted-foreground">Всего: {total}</p>
        <div className="flex gap-2 flex-wrap">
          {["", "new", "confirmed", "delivering", "done", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`font-body text-xs px-3 py-1.5 border transition-all ${statusFilter === s ? "bg-gold text-background border-gold" : "border-border text-muted-foreground hover:border-foreground"}`}>
              {s ? STATUS_LABELS[s] : "Все"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Icon name="Loader" size={18} className="animate-spin" />
          <span className="font-body text-sm">Загружаем заказы...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 opacity-40">
          <Icon name="ShoppingBag" size={40} className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-body text-sm">Заказов нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-card border border-border">
              <button className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="flex items-center gap-4 flex-wrap min-w-0">
                  <div className="flex-shrink-0">
                    <p className="font-body text-xs text-muted-foreground">№{order.id}</p>
                    <p className="font-body text-sm">{fmtDate(order.created_at)}</p>
                  </div>
                  <span className={`font-body text-xs px-2 py-0.5 border flex-shrink-0 ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-sm truncate">{order.recipient_name || order.customer_name || "Гость"}</p>
                    <p className="font-body text-xs text-muted-foreground">{order.recipient_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-display text-lg text-gold">{fmt(order.total_price)} ₽</span>
                  <Icon name={expanded === order.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Состав */}
                  <div>
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">Состав</p>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between font-body text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="text-gold">{fmt(item.price * item.quantity)} ₽</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Детали */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-3">
                    {order.delivery_address && (
                      <div>
                        <p className="font-body text-xs text-muted-foreground">Адрес</p>
                        <p className="font-body text-sm">{order.delivery_address}</p>
                      </div>
                    )}
                    {order.delivery_date && (
                      <div>
                        <p className="font-body text-xs text-muted-foreground">Дата доставки</p>
                        <p className="font-body text-sm">{fmtDate(order.delivery_date)}</p>
                      </div>
                    )}
                    {order.note && (
                      <div className="sm:col-span-2">
                        <p className="font-body text-xs text-muted-foreground">Примечание</p>
                        <p className="font-body text-sm">{order.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Смена статуса */}
                  <div className="border-t border-border pt-3">
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">Изменить статус</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(STATUS_LABELS).map(([s, label]) => (
                        <button key={s} disabled={order.status === s || updating === order.id}
                          onClick={() => updateStatus(order.id, s)}
                          className={`font-body text-xs px-3 py-1.5 border transition-all disabled:opacity-40 ${
                            order.status === s ? "bg-gold text-background border-gold" : "border-border text-foreground hover:border-gold hover:text-gold"}`}>
                          {updating === order.id ? <Icon name="Loader" size={12} className="animate-spin inline" /> : label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Раздел: Аналитика ────────────────────────────────────
function AnalyticsTab({ token }: { token: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api("get_analytics", { period }, token).then(({ data: d }) => {
      setData(d); setLoading(false);
    });
  }, [token, period]);

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
      <Icon name="Loader" size={18} className="animate-spin" />
      <span className="font-body text-sm">Загружаем аналитику...</span>
    </div>
  );
  if (!data) return null;

  const { summary, by_day, top_items, by_status } = data;

  return (
    <div className="space-y-8">
      {/* Период */}
      <div className="flex gap-2">
        {[["7", "7 дней"], ["30", "30 дней"], ["90", "3 месяца"]].map(([val, label]) => (
          <button key={val} onClick={() => setPeriod(val)}
            className={`font-body text-xs px-4 py-2 border transition-all ${period === val ? "bg-gold text-background border-gold" : "border-border text-muted-foreground hover:border-gold"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Всего заказов", value: summary.total_orders, icon: "ShoppingBag" },
          { label: "Выручка", value: fmt(summary.total_revenue) + " ₽", icon: "TrendingUp" },
          { label: "Средний чек", value: fmt(summary.avg_order) + " ₽", icon: "BarChart2" },
          { label: "Выполнено", value: summary.done_orders, icon: "CheckCircle" },
          { label: "Новые", value: summary.new_orders, icon: "Sparkles" },
          { label: "Отменено", value: summary.cancelled_orders, icon: "XCircle" },
        ].map(card => (
          <div key={card.label} className="bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon name={card.icon} size={16} className="text-gold" />
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
            </div>
            <p className="font-display text-3xl font-light text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Топ товаров */}
      {top_items.length > 0 && (
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-2xl mb-5">Топ позиций</h3>
          <div className="space-y-3">
            {top_items.map((item, i) => {
              const maxQty = top_items[0].quantity;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="font-body text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-body text-xs text-muted-foreground">{item.quantity} шт</span>
                      <span className="font-body text-sm text-gold">{fmt(item.revenue)} ₽</span>
                    </div>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${(item.quantity / maxQty) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* По дням */}
      {by_day.length > 0 && (
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-2xl mb-5">Заказы по дням</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Дата", "Заказов", "Выручка"].map(h => (
                    <th key={h} className="font-body text-xs text-muted-foreground uppercase tracking-wide text-left pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...by_day].reverse().map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="font-body text-sm py-2.5 pr-4">{fmtDate(row.date)}</td>
                    <td className="font-body text-sm py-2.5 pr-4">{row.orders}</td>
                    <td className="font-body text-sm py-2.5 text-gold">{fmt(row.revenue)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Статусы */}
      {Object.keys(by_status).length > 0 && (
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-2xl mb-5">По статусам</h3>
          <div className="space-y-2">
            {Object.entries(by_status).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between">
                <span className={`font-body text-xs px-2 py-0.5 border ${STATUS_COLORS[s]}`}>{STATUS_LABELS[s] || s}</span>
                <span className="font-body text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Раздел: Товары ───────────────────────────────────────
function ProductsTab({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", composition: "", price: "", old_price: "", image_url: "", tag: "", in_stock: true, sort_order: "0" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await api("get_products", {}, token);
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: "", description: "", composition: "", price: "", old_price: "", image_url: "", tag: "", in_stock: true, sort_order: "0" });
    setCreating(true); setEditing(null); setSaveError("");
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description || "", composition: p.composition || "",
      price: String(p.price), old_price: p.old_price ? String(p.old_price) : "",
      image_url: p.image_url || "", tag: p.tag || "", in_stock: p.in_stock, sort_order: String(p.sort_order),
    });
    setEditing(p); setCreating(false); setSaveError("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveError("Укажите название"); return; }
    if (!form.price || isNaN(Number(form.price))) { setSaveError("Укажите корректную цену"); return; }
    setSaving(true); setSaveError("");
    const payload = {
      name: form.name, description: form.description || null, composition: form.composition || null,
      price: Number(form.price), old_price: form.old_price ? Number(form.old_price) : null,
      image_url: form.image_url || null, tag: form.tag || null,
      in_stock: form.in_stock, sort_order: Number(form.sort_order),
    };
    const action = creating ? "create_product" : "update_product";
    const extra  = creating ? {} : { product_id: editing!.id };
    const { data, ok } = await api(action, { ...payload, ...extra }, token);
    setSaving(false);
    if (!ok) { setSaveError(data.error || "Ошибка сохранения"); return; }
    setCreating(false); setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Скрыть товар из каталога?")) return;
    await api("delete_product", { product_id: id }, token);
    load();
  };

  const isFormOpen = creating || editing !== null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-body text-sm text-muted-foreground">{products.length} товаров</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-gold text-background px-4 py-2 font-body text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={15} />
          Добавить товар
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {isFormOpen && (
        <div className="bg-card border border-gold/30 p-6 mb-6">
          <h3 className="font-display text-2xl mb-5">{creating ? "Новый товар" : `Редактировать: ${editing?.name}`}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Название *", key: "name", placeholder: "Нежность" },
              { label: "Цена (₽) *", key: "price", placeholder: "2800" },
              { label: "Старая цена (₽)", key: "old_price", placeholder: "3200" },
              { label: "Тег", key: "tag", placeholder: "Хит / Новинка" },
              { label: "Сортировка", key: "sort_order", placeholder: "0" },
              { label: "Фото (URL)", key: "image_url", placeholder: "https://..." },
            ].map(f => (
              <div key={f.key}>
                <label className="font-body text-xs text-muted-foreground uppercase tracking-wide block mb-2">{f.label}</label>
                <input value={(form as Record<string, string | boolean>)[f.key] as string}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wide block mb-2">Описание</label>
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание букета..."
                className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground resize-none h-20" />
            </div>
            <div className="md:col-span-2">
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wide block mb-2">Состав</label>
              <input value={form.composition} onChange={e => setForm(prev => ({ ...prev, composition: e.target.value }))}
                placeholder="Розы, пионы, эвкалипт..."
                className="w-full bg-background border border-border text-foreground font-body text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <label className="font-body text-sm">В наличии</label>
              <button type="button" onClick={() => setForm(prev => ({ ...prev, in_stock: !prev.in_stock }))}
                className={`w-10 h-6 rounded-full transition-all relative ${form.in_stock ? "bg-gold" : "bg-border"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-background rounded-full transition-all ${form.in_stock ? "left-4" : "left-0.5"}`} />
              </button>
            </div>
          </div>
          {saveError && <p className="font-body text-sm text-rose-petal mt-3">{saveError}</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving}
              className="bg-gold text-background px-6 py-2.5 font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
            <button onClick={() => { setCreating(false); setEditing(null); }}
              className="border border-border text-muted-foreground px-6 py-2.5 font-body hover:border-foreground transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Icon name="Loader" size={18} className="animate-spin" />
          <span className="font-body text-sm">Загружаем товары...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 opacity-40">
          <Icon name="Package" size={40} className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-body text-sm">Товаров нет. Добавьте первый!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className={`bg-card border ${p.in_stock ? "border-border" : "border-border opacity-50"} p-4`}>
              {p.image_url && (
                <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover mb-3" />
              )}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-display text-xl leading-tight">{p.name}</h4>
                {p.tag && <span className="font-body text-xs bg-gold text-background px-2 py-0.5 flex-shrink-0">{p.tag}</span>}
              </div>
              {p.composition && <p className="font-body text-xs text-muted-foreground mb-2">{p.composition}</p>}
              <div className="flex items-center gap-2 mb-3">
                <span className="font-display text-xl text-gold">{fmt(p.price)} ₽</span>
                {p.old_price && <span className="font-body text-sm text-muted-foreground line-through">{fmt(p.old_price)} ₽</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-body text-xs ${p.in_stock ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {p.in_stock ? "В наличии" : "Скрыт"}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)}
                    className="flex items-center gap-1 font-body text-xs border border-border px-2.5 py-1.5 hover:border-gold hover:text-gold transition-all">
                    <Icon name="Pencil" size={12} /> Изменить
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="font-body text-xs border border-border px-2.5 py-1.5 hover:border-rose-petal hover:text-rose-petal transition-all">
                    <Icon name="EyeOff" size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Раздел: Платёжные системы ────────────────────────────
function PaymentsTab() {
  const [settings, setSettings] = useState({ yukassa: false, sberbank: false });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(PAYMENTS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_settings" }) })
      .then(r => r.json()).then(d => { setSettings(d); setLoading(false); });
  }, []);

  const providers = [
    {
      key: "yukassa",
      name: "ЮKassa",
      icon: "CreditCard",
      active: settings.yukassa,
      description: "Самая популярная платёжная система в России. Принимает карты, СБП, Яндекс Pay, Apple Pay.",
      secrets: [
        { name: "YUKASSA_SHOP_ID", label: "ID магазина", hint: "Найдите в личном кабинете ЮKassa → Настройки → Данные магазина" },
        { name: "YUKASSA_SECRET_KEY", label: "Секретный ключ", hint: "ЮKassa → Настройки → API-ключи → Секретный ключ" },
      ],
      link: "https://yookassa.ru",
      linkLabel: "Открыть ЮKassa",
    },
    {
      key: "sberbank",
      name: "Сбербанк Эквайринг",
      icon: "Landmark",
      active: settings.sberbank,
      description: "Интернет-эквайринг от Сбербанка. Оплата картами Visa, Mastercard, МИР через форму Сбера.",
      secrets: [
        { name: "SBERBANK_USERNAME", label: "Логин", hint: "Логин в системе эквайринга Сбербанка (заканчивается на -api)" },
        { name: "SBERBANK_PASSWORD", label: "Пароль", hint: "Пароль от системы эквайринга Сбербанка" },
      ],
      link: "https://securepayments.sberbank.ru",
      linkLabel: "Открыть Сбербанк",
    },
  ];

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
      <Icon name="Loader" size={18} className="animate-spin" />
      <span className="font-body text-sm">Загружаем настройки...</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="font-body text-sm text-muted-foreground">
        Подключите платёжные системы, добавив секреты в панели управления. После добавления статус обновится автоматически.
      </p>

      {providers.map(p => (
        <div key={p.key} className={`bg-card border p-6 ${p.active ? "border-emerald-400/40" : "border-border"}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon name={p.icon} size={20} className={p.active ? "text-emerald-400" : "text-muted-foreground"} />
              <h3 className="font-display text-2xl">{p.name}</h3>
            </div>
            <span className={`font-body text-xs px-2.5 py-1 border ${p.active ? "text-emerald-400 border-emerald-400 bg-emerald-400/10" : "text-muted-foreground border-border"}`}>
              {p.active ? "✓ Подключено" : "Не настроено"}
            </span>
          </div>

          <p className="font-body text-sm text-muted-foreground mb-5">{p.description}</p>

          <div className="space-y-3 mb-5">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wide">Необходимые секреты:</p>
            {p.secrets.map(s => (
              <div key={s.name} className="bg-background border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <code className="font-body text-xs text-gold">{s.name}</code>
                  <span className="font-body text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="font-body text-xs text-muted-foreground">{s.hint}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Icon name="Info" size={14} className="text-muted-foreground flex-shrink-0" />
            <p className="font-body text-xs text-muted-foreground">
              Добавьте секреты через{" "}
              <span className="text-gold">Ядро → Секреты</span>{" "}
              в панели управления, затем обновите страницу.
            </p>
          </div>
        </div>
      ))}

      <div className="bg-card border border-border p-5">
        <div className="flex items-start gap-3">
          <Icon name="ShieldCheck" size={16} className="text-gold mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-body text-sm font-medium mb-1">Безопасность</p>
            <p className="font-body text-xs text-muted-foreground">
              Ключи хранятся в зашифрованных секретах и никогда не передаются на фронтенд.
              Все платежи обрабатываются напрямую между покупателем и платёжной системой.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Главный компонент ────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tab, setTab] = useState<Tab>("orders");

  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(""); };

  if (!token) return <LoginScreen onLogin={setToken} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Шапка */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl text-gold tracking-widest">ФЛОРА</span>
            <span className="font-body text-xs text-muted-foreground border border-border px-2 py-0.5">Админ</span>
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors hover:border-foreground">
            <Icon name="LogOut" size={13} /> Выйти
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Табы */}
        <div className="flex border-b border-border mb-8 gap-1">
          {([
            { key: "orders",   label: "Заказы",    icon: "ShoppingBag" },
            { key: "analytics",label: "Аналитика", icon: "BarChart2" },
            { key: "products", label: "Товары",    icon: "Package" },
            { key: "payments", label: "Оплата",    icon: "CreditCard" },
          ] as { key: Tab; label: string; icon: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 font-body text-sm tracking-wide transition-all border-b-2 -mb-px ${
                tab === t.key ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "orders"    && <OrdersTab    token={token} />}
        {tab === "analytics" && <AnalyticsTab token={token} />}
        {tab === "products"  && <ProductsTab  token={token} />}
        {tab === "payments"  && <PaymentsTab />}
      </main>
    </div>
  );
}