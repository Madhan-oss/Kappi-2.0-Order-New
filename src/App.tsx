import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MenuItem { id: string; name: string; price: number; icon: string; }
interface Member   { id: string; name: string; isDefault: boolean; orders: Record<string, number>; paid: boolean; }
interface DaySession { date: string; members: Member[]; menu: MenuItem[]; }

const LOGO_B64 = "data:image/png;base64,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";

const DEFAULT_MENU: MenuItem[] = [
  { id: "tea",          name: "Tea",           price: 20,  icon: "☕" },
  { id: "coffee",       name: "Coffee",        price: 25,  icon: "☕" },
  { id: "egg-puff",    name: "Egg Puff",      price: 35,  icon: "🥚" },
  { id: "lemon-tea",   name: "Lemon Tea",     price: 20,  icon: "🍋" },
  { id: "chicken-puff",name: "Chicken Puff",  price: 40,  icon: "🥟" },
  { id: "veg-puff",    name: "Veg Puff",      price: 30,  icon: "🥬" },
  { id: "mushroom-puff",name:"Mushroom Puff", price: 30,  icon: "🍄" },
  { id: "samosa",      name: "Samosa",        price: 20,  icon: "🔺" },
  { id: "cutlet",      name: "Cutlet",        price: 20,  icon: "🍘" },
  { id: "sweet-corn",  name: "Sweet Corn",    price: 35,  icon: "🌽" },
  { id: "milk",        name: "Milk",          price: 20,  icon: "🥛" },
  { id: "cake",        name: "Cake",          price: 50,  icon: "🎂" },
  { id: "muffin",      name: "Muffin",        price: 40,  icon: "🧁" },
  { id: "horlick",     name: "Horlick",       price: 30,  icon: "🍵" },
  { id: "boost",       name: "Boost",         price: 30,  icon: "💪" },
];
const DEFAULT_MEMBERS_LIST = ["Darun","Charuuu","Kabilesh","Jai","Inzamam","Madhan","Abishek","Arun RS","Ashwanth","Hanumanth","Yogesh"];
function initMembers(): Member[] {
  return DEFAULT_MEMBERS_LIST.map((name, i) => ({ id: `m${i}`, name, isDefault: true, orders: {}, paid: false }));
}
function memberTotal(member: Member, menuList: MenuItem[] = DEFAULT_MENU): number {
  return menuList.reduce((sum, item) => sum + (member.orders[item.id] || 0) * item.price, 0);
}
function memberItemCount(member: Member): number {
  return Object.values(member.orders).reduce((s: number, v: number) => s + v, 0);
}
function initials(name: string): string {
  return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Animated Number ────────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current; const end = value;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / 350, 1);
      setDisplay(Math.round(start + (end - start) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick); else { setDisplay(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{display.toLocaleString("en-IN")}</span>;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#8B4513","#c0522a","#a0420d","#6b3410","#b8611f","#905020","#7a3a18","#cd6020"];
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const idx = name.split("").reduce((s: number, c: string) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: AVATAR_COLORS[idx],
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

// ── Pay Toggle ─────────────────────────────────────────────────────────────────
function PayToggle({ paid, onChange }: { paid: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
      borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
      background: paid ? "#dcfce7" : "#fee2e2", color: paid ? "#16a34a" : "#dc2626", transition: "all 0.2s" }}>
      <span style={{ width: 28, height: 16, borderRadius: 8, background: paid ? "#22c55e" : "#ef4444",
        position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 2, left: paid ? 14 : 2, width: 12, height: 12,
          borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </span>
      {paid ? "✓ Paid" : "✗ Unpaid"}
    </button>
  );
}

// ── Qty Btn ────────────────────────────────────────────────────────────────────
function QtyBtn({ children, onClick, disabled = false }: { children: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 28, height: 28, borderRadius: 6,
      border: "1.5px solid #e2d5c3", background: disabled ? "#f5f0e8" : "#fff",
      cursor: disabled ? "default" : "pointer", fontWeight: 700, fontSize: 16,
      color: disabled ? "#c4b8a4" : "#8B4513", display: "flex", alignItems: "center",
      justifyContent: "center", transition: "all 0.15s" }}>{children}</button>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────────
function MiniBar({ value, max, color = "#8B4513" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: 6, background: "#f0e6d6", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ── Analytics Screen ───────────────────────────────────────────────────────────
function AnalyticsScreen({ onClose }: { onClose: () => void }) {
  const [sessions, setSessions] = useState<DaySession[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"monthly"|"members"|"items">("monthly");
  const thisMonth = new Date().toISOString().slice(0, 7); // "2025-01"

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("date, members, menu")
          .gte("date", `${thisMonth}-01`)
          .order("date", { ascending: true });
        if (!error && data) setSessions(data as DaySession[]);
      } catch { /* offline */ }
      setLoading(false);
    }
    load();
  }, [thisMonth]);

  // ── Derived analytics ──────────────────────────────────────────────────────
  const totalDays     = sessions.length;
  const totalSpend    = sessions.reduce((s, d) => s + d.members.reduce((ms, m) => ms + memberTotal(m, d.menu), 0), 0);
  const totalCollected= sessions.reduce((s, d) => s + d.members.filter(m => m.paid).reduce((ms, m) => ms + memberTotal(m, d.menu), 0), 0);
  const totalPending  = totalSpend - totalCollected;

  // Per-member spend this month
  const memberSpends = useMemo(() => {
    const map: Record<string, { name: string; total: number; days: number; items: number }> = {};
    sessions.forEach(d => {
      d.members.forEach(m => {
        const t = memberTotal(m, d.menu);
        if (t === 0) return;
        if (!map[m.name]) map[m.name] = { name: m.name, total: 0, days: 0, items: 0 };
        map[m.name].total += t;
        map[m.name].days  += 1;
        map[m.name].items += memberItemCount(m);
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [sessions]);
  const maxMemberSpend = memberSpends[0]?.total || 1;

  // Per-item count this month
  const itemCounts = useMemo(() => {
    const map: Record<string, { name: string; icon: string; qty: number; spend: number }> = {};
    sessions.forEach(d => {
      d.menu.forEach(item => {
        const qty = d.members.reduce((s, m) => s + (m.orders[item.id] || 0), 0);
        if (qty === 0) return;
        if (!map[item.id]) map[item.id] = { name: item.name, icon: item.icon, qty: 0, spend: 0 };
        map[item.id].qty   += qty;
        map[item.id].spend += qty * item.price;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [sessions]);
  const maxItemQty = itemCounts[0]?.qty || 1;

  // Daily spend for chart
  const dailySpends = sessions.map(d => ({
    date: d.date.slice(5), // "01-15"
    total: d.members.reduce((s, m) => s + memberTotal(m, d.menu), 0),
  }));
  const maxDay = Math.max(...dailySpends.map(d => d.total), 1);

  const statCard = (label: string, val: string, sub: string, color: string) => (
    <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9d7a5a", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
      <div style={{ fontSize: 11, color: "#b0977a", marginTop: 2 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FFFDF7", zIndex: 100, overflowY: "auto" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_B64} alt="Kappi 2.0" style={{ width: 38, height: 38, borderRadius: "50%" }} />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#3d1a06", margin: 0 }}>📈 Analytics</h1>
              <p style={{ margin: "2px 0 0", color: "#9d7a5a", fontSize: 12 }}>
                {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e2d5c3",
            background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#8B4513" }}>← Back</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9d7a5a" }}>Loading analytics…</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <p style={{ color: "#9d7a5a", fontSize: 15, fontWeight: 600 }}>No data this month yet.</p>
            <p style={{ color: "#b0977a", fontSize: 13 }}>Start taking orders — analytics will appear here!</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
              {statCard("TOTAL SPEND", `₹${totalSpend.toLocaleString("en-IN")}`, `${totalDays} days this month`, "#8B4513")}
              {statCard("COLLECTED", `₹${totalCollected.toLocaleString("en-IN")}`, `${Math.round(totalCollected/totalSpend*100)||0}% of total`, "#16a34a")}
              {statCard("PENDING", `₹${totalPending.toLocaleString("en-IN")}`, "not yet paid", "#ef4444")}
              {statCard("DAILY AVG", `₹${Math.round(totalSpend / (totalDays||1)).toLocaleString("en-IN")}`, "per day", "#FF9800")}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {(["monthly","members","items"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                  borderColor: tab === t ? "#8B4513" : "#e2d5c3",
                  background: tab === t ? "#8B4513" : "#fff",
                  color: tab === t ? "#fff" : "#8B4513",
                  cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                }}>
                  {t === "monthly" ? "📅 Daily" : t === "members" ? "👥 Members" : "🛒 Items"}
                </button>
              ))}
            </div>

            {/* ── Daily spend chart ── */}
            {tab === "monthly" && (
              <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 16, padding: "20px 24px" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#3d1a06" }}>Daily Spend This Month</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, marginBottom: 8 }}>
                  {dailySpends.map((d, i) => {
                    const h = Math.max(4, (d.total / maxDay) * 120);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "#9d7a5a", fontWeight: 600 }}>
                          {d.total > 0 ? `₹${d.total}` : ""}
                        </div>
                        <div title={`${d.date}: ₹${d.total}`} style={{
                          width: "100%", height: h, borderRadius: "4px 4px 0 0",
                          background: "linear-gradient(180deg,#c0522a,#8B4513)",
                          transition: "height 0.4s ease", cursor: "default",
                        }} />
                        <div style={{ fontSize: 9, color: "#9d7a5a", fontWeight: 600, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>
                          {d.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1px solid #f0e6d6", paddingTop: 14, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9d7a5a" }}>
                    <span>Highest day: <strong style={{ color: "#8B4513" }}>₹{Math.max(...dailySpends.map(d => d.total)).toLocaleString("en-IN")}</strong></span>
                    <span>Lowest day: <strong style={{ color: "#8B4513" }}>₹{Math.min(...dailySpends.filter(d => d.total > 0).map(d => d.total)).toLocaleString("en-IN")}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Per-member spend ── */}
            {tab === "members" && (
              <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 16, padding: "20px 24px" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#3d1a06" }}>Spend by Member</h3>
                {memberSpends.map((m, i) => (
                  <div key={m.name} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#b0977a", minWidth: 16 }}>#{i+1}</span>
                      <Avatar name={m.name} size={28} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#3d1a06", flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: 11, color: "#9d7a5a" }}>{m.days} days · {m.items} items</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#8B4513", minWidth: 60, textAlign: "right" }}>
                        ₹{m.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 54 }}>
                      <MiniBar value={m.total} max={maxMemberSpend}
                        color={i === 0 ? "#c0522a" : i === 1 ? "#d97706" : "#8B4513"} />
                      <span style={{ fontSize: 10, color: "#9d7a5a", minWidth: 32, textAlign: "right" }}>
                        {Math.round(m.total / totalSpend * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
                {/* Avg per day per member */}
                <div style={{ borderTop: "1px solid #f0e6d6", paddingTop: 14, marginTop: 4 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#9d7a5a" }}>
                    Average per person per day: <strong style={{ color: "#8B4513" }}>
                      ₹{Math.round(totalSpend / Math.max(memberSpends.length, 1) / Math.max(totalDays, 1))}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* ── Per-item popularity ── */}
            {tab === "items" && (
              <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 16, padding: "20px 24px" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#3d1a06" }}>Most Ordered Items</h3>
                {itemCounts.map((item, i) => (
                  <div key={item.name} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#b0977a", minWidth: 16 }}>#{i+1}</span>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#3d1a06", flex: 1 }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: "#9d7a5a" }}>×{item.qty}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#8B4513", minWidth: 60, textAlign: "right" }}>
                        ₹{item.spend.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 46 }}>
                      <MiniBar value={item.qty} max={maxItemQty}
                        color={i === 0 ? "#c0522a" : i === 1 ? "#d97706" : "#8B4513"} />
                      <span style={{ fontSize: 10, color: "#9d7a5a", minWidth: 32, textAlign: "right" }}>
                        {Math.round(item.qty / maxItemQty * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Summary Screen ─────────────────────────────────────────────────────────────
function SummaryScreen({ members, menu, onClose, onNewDay }: { members: Member[]; menu: MenuItem[]; onClose: () => void; onNewDay: () => void }) {
  const itemTotals = useMemo(() =>
    menu.map(item => ({ ...item, qty: members.reduce((s, m) => s + (m.orders[item.id] || 0), 0) })).filter(i => i.qty > 0), [members, menu]);
  const grandTotal = members.reduce((s, m) => s + memberTotal(m, menu), 0);
  const paidTotal  = members.filter(m => m.paid).reduce((s, m) => s + memberTotal(m, menu), 0);
  const paid   = members.filter(m => m.paid);
  const unpaid = members.filter(m => !m.paid && memberItemCount(m) > 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FFFDF7", zIndex: 100, overflowY: "auto" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_B64} alt="Kappi 2.0" style={{ width: 40, height: 40, borderRadius: "50%" }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#3d1a06", margin: 0 }}>Final Order Summary</h1>
              <p style={{ margin: "2px 0 0", color: "#9d7a5a", fontSize: 12 }}>
                {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e2d5c3",
            background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#8B4513" }}>← Back</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Members", val: members.length, color: "#8B4513" },
            { label: "Orders Placed", val: members.filter(m => memberItemCount(m)>0).length, color: "#FF9800" },
            { label: "Paid", val: paid.length, color: "#22c55e" },
            { label: "Pending", val: unpaid.length, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 14, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#9d7a5a", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#3d1a06" }}>🛒 Item Breakdown</h2>
          {itemTotals.length === 0 ? <p style={{ color: "#9d7a5a", margin: 0 }}>No items ordered.</p>
            : itemTotals.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5ede0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontWeight: 600, color: "#3d1a06", fontSize: 14 }}>{item.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "3px 10px", fontSize: 13, fontWeight: 700, color: "#c2410c" }}>×{item.qty}</span>
                  <span style={{ fontWeight: 700, color: "#8B4513", fontSize: 14, minWidth: 60, textAlign: "right" }}>₹{(item.qty * item.price).toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 4 }}>✓ COLLECTED</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#15803d" }}>₹{paidTotal.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>{paid.map(m => m.name).join(", ") || "—"}</div>
          </div>
          <div style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>✗ PENDING</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#b91c1c" }}>₹{(grandTotal - paidTotal).toLocaleString("en-IN")}</div>
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>{unpaid.map(m => m.name).join(", ") || "—"}</div>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg,#8B4513,#c0522a)", borderRadius: 16,
          padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ color: "#fde8d0", fontWeight: 700, fontSize: 15 }}>Grand Total</span>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 28 }}>₹{grandTotal.toLocaleString("en-IN")}</span>
        </div>

        <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#3d1a06" }}>👥 Per Person</h2>
          {members.filter(m => memberItemCount(m) > 0).map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5ede0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={m.name} size={30} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#3d1a06" }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#9d7a5a" }}>
                    {Object.entries(m.orders).filter(([,q]) => (q as number) > 0)
                      .map(([id, q]) => { const item = menu.find(i => i.id === id); return item ? `${item.icon}×${q}` : ""; }).join("  ")}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: m.paid ? "#dcfce7" : "#fee2e2", color: m.paid ? "#16a34a" : "#dc2626",
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>
                  {m.paid ? "✓ Paid" : "✗ Unpaid"}
                </span>
                <span style={{ fontWeight: 700, color: "#8B4513", fontSize: 14 }}>₹{memberTotal(m, menu).toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => window.print()} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1.5px solid #e2d5c3", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15, color: "#8B4513" }}>🖨 Print Summary</button>
          <button onClick={onNewDay} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#8B4513,#c0522a)", cursor: "pointer", fontWeight: 700, fontSize: 15, color: "#fff" }}>🔄 New Day</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [members, setMembers]           = useState<Member[]>(initMembers);
  const [menu, setMenu]                 = useState<MenuItem[]>(DEFAULT_MENU);
  const [selected, setSelected]         = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [newName, setNewName]           = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [showSummary, setShowSummary]   = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [summaryOpen, setSummaryOpen]   = useState(false);
  const [addingItem, setAddingItem]     = useState(false);
  const [newItemName, setNewItemName]   = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemIcon, setNewItemIcon]   = useState("🍽️");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [syncStatus, setSyncStatus]     = useState<"synced"|"saving"|"offline">("synced");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = new Date().toISOString().split("T")[0];

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (data.members?.length > 0) setMembers(data.members);
        if (data.menu?.length > 0)    setMenu(data.menu);
      } catch { setSyncStatus("offline"); }
      finally  { setLoading(false); }
    }
    loadSession();
  }, []);

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel("kappi-session")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `date=eq.${today}` },
        (payload) => {
          const row = payload.new as { members: Member[]; menu: MenuItem[] };
          if (row?.members) setMembers(row.members);
          if (row?.menu)    setMenu(row.menu);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [today]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const saveSession = useCallback(async (m: Member[], mn: MenuItem[]) => {
    try {
      await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: m, menu: mn }) });
      setSyncStatus("synced");
    } catch { setSyncStatus("offline"); }
  }, []);

  function triggerSave(m: Member[], mn: MenuItem[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncStatus("saving");
    saveTimer.current = setTimeout(() => saveSession(m, mn), 800);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered   = useMemo(() => members.filter(m => m.name.toLowerCase().includes(search.toLowerCase())), [members, search]);
  const grandTotal = useMemo(() => members.reduce((s, m) => s + memberTotal(m, menu), 0), [members, menu]);
  const paidCount  = useMemo(() => members.filter(m => m.paid).length, [members]);
  const itemTotals = useMemo(() => menu.map(item => ({ ...item, qty: members.reduce((s, m) => s + (m.orders[item.id] || 0), 0) })).filter(i => i.qty > 0), [members, menu]);
  const selectedMember = members.find(m => m.id === selected) || null;

  // ── Actions ────────────────────────────────────────────────────────────────
  function setQty(memberId: string, itemId: string, qty: number) {
    const next = members.map(m => m.id === memberId ? { ...m, orders: { ...m.orders, [itemId]: Math.max(0, qty) } } : m);
    setMembers(next); triggerSave(next, menu);
  }
  function togglePaid(memberId: string) {
    const next = members.map(m => m.id === memberId ? { ...m, paid: !m.paid } : m);
    setMembers(next); triggerSave(next, menu);
  }
  function addMember() {
    const name = newName.trim(); if (!name) return;
    const newM: Member = { id: `m${Date.now()}`, name, isDefault: false, orders: {}, paid: false };
    const next = [...members, newM];
    setMembers(next); setNewName(""); setAddingMember(false); setSelected(newM.id); triggerSave(next, menu);
  }
  function removeMember(id: string) {
    const next = members.filter(m => m.id !== id);
    setMembers(next); if (selected === id) setSelected(null); triggerSave(next, menu);
  }
  function addItem() {
    const name = newItemName.trim(); const price = parseInt(newItemPrice);
    if (!name || !price || price <= 0) return;
    const newId = `custom-${Date.now()}`;
    const nextMenu = [...menu, { id: newId, name, price, icon: newItemIcon }];
    // Auto-set qty=1 for the currently selected member
    const nextMembers = selected
      ? members.map(m => m.id === selected ? { ...m, orders: { ...m.orders, [newId]: 1 } } : m)
      : members;
    setMenu(nextMenu); setMembers(nextMembers);
    setNewItemName(""); setNewItemPrice(""); setNewItemIcon("🍽️"); setAddingItem(false);
    triggerSave(nextMembers, nextMenu);
  }
  function removeMenuItem(itemId: string) {
    const nextMenu = menu.filter(i => i.id !== itemId);
    setMenu(nextMenu); triggerSave(members, nextMenu);
  }
  async function newDay() {
    const freshMembers = initMembers();
    setMembers(freshMembers); setMenu(DEFAULT_MENU); setSelected(null); setShowSummary(false);
    setSaving(true);
    try { await fetch("/api/reset", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: freshMembers, menu: DEFAULT_MENU }) }); }
    finally { setSaving(false); }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#FFFDF7", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src={LOGO_B64} alt="Kappi 2.0" style={{ width: 80, height: 80, borderRadius: "50%", animation: "spin 1.5s linear infinite" }} />
      <p style={{ color: "#9d7a5a", fontWeight: 600, fontSize: 15 }}>Loading today's orders…</p>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  if (showAnalytics) return <AnalyticsScreen onClose={() => setShowAnalytics(false)} />;
  if (showSummary)   return <SummaryScreen members={members} menu={menu} onClose={() => setShowSummary(false)} onNewDay={newDay} />;

  // ── Summary Panel (sidebar + mobile drawer) ────────────────────────────────
  const SummaryPanel = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#3d1a06" }}>Live Summary</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
          color: syncStatus === "synced" ? "#16a34a" : syncStatus === "saving" ? "#d97706" : "#ef4444" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block",
            animation: syncStatus === "saving" ? "pulse 1s infinite" : "none" }} />
          {syncStatus === "synced" ? "Synced" : syncStatus === "saving" ? "Saving…" : "Offline"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Members", val: members.length, color: "#8B4513" },
          { label: "Paid",    val: paidCount,       color: "#22c55e" },
          { label: "Pending", val: members.filter(m => memberItemCount(m)>0 && !m.paid).length, color: "#ef4444" },
          { label: "Orders",  val: members.filter(m => memberItemCount(m)>0).length, color: "#FF9800" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #f0e6d6", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#9d7a5a", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {itemTotals.length === 0
        ? <div style={{ textAlign: "center", padding: "20px 0", color: "#c4b8a4", fontSize: 13 }}>No items yet</div>
        : itemTotals.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5ede0" }}>
            <span>{item.icon} <span style={{ fontSize: 12, fontWeight: 600, color: "#3d1a06" }}>{item.name}</span></span>
            <span style={{ fontWeight: 700, color: "#8B4513", fontSize: 13 }}>×{item.qty}</span>
          </div>
        ))}

      <div style={{ marginTop: 16, padding: "14px 16px", background: "linear-gradient(135deg,#8B4513,#c0522a)",
        borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fde8d0", fontSize: 13, fontWeight: 600 }}>Grand Total</span>
        <span style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>₹<AnimatedNumber value={grandTotal} /></span>
      </div>

      <button onClick={() => setShowSummary(true)} style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 12,
        border: "none", background: "#FF9800", cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#fff" }}>
        🧾 Generate Final Summary
      </button>
      <button onClick={() => setShowAnalytics(true)} style={{ marginTop: 8, width: "100%", padding: "10px", borderRadius: 12,
        border: "1.5px solid #e2d5c3", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#8B4513" }}>
        📈 Monthly Analytics
      </button>
      <button onClick={newDay} disabled={saving} style={{ marginTop: 8, width: "100%", padding: "10px", borderRadius: 12,
        border: "1.5px solid #e2d5c3", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#8B4513" }}>
        {saving ? "Resetting…" : "🔄 New Day"}
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#FFFDF7", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid #f0e6d6", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_B64} alt="Kappi 2.0" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
            <span style={{ fontWeight: 900, fontSize: 17, color: "#3d1a06", letterSpacing: "-0.02em" }}>Kappi 2.0 Order</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
              color: syncStatus === "synced" ? "#16a34a" : syncStatus === "saving" ? "#d97706" : "#ef4444" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block",
                animation: syncStatus === "saving" ? "pulse 1s infinite" : "none" }} />
              <span className="hide-mobile">{syncStatus === "synced" ? "Live" : syncStatus === "saving" ? "Saving…" : "Offline"}</span>
            </div>
            <button onClick={() => setShowAnalytics(true)} style={{ padding: "5px 12px", borderRadius: 10,
              border: "1.5px solid #e2d5c3", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#8B4513" }}>
              📈 Analytics
            </button>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 20,
              padding: "4px 14px", fontSize: 13, fontWeight: 700, color: "#c2410c" }}>
              ₹<AnimatedNumber value={grandTotal} />
            </div>
            <button onClick={() => setSummaryOpen(v => !v)} className="mobile-summary-btn"
              style={{ padding: "6px 12px", borderRadius: 10, border: "1.5px solid #e2d5c3",
                background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#8B4513" }}>📊</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px", display: "grid",
        gridTemplateColumns: "260px 1fr 280px", gap: 20, alignItems: "start" }} className="main-grid">

        {/* ── Left: Member List ──────────────────────────────────────────── */}
        <aside>
          <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 18, overflow: "hidden", position: "sticky", top: 76 }}>
            <div style={{ padding: "16px 16px 12px" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member…"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2d5c3",
                  fontSize: 13, background: "#fdf8f3", color: "#3d1a06", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
              {filtered.map(m => {
                const total = memberTotal(m, menu); const count = memberItemCount(m); const active = selected === m.id;
                return (
                  <div key={m.id} onClick={() => setSelected(m.id)} style={{
                    padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                    background: active ? "#fff7ed" : "transparent",
                    borderLeft: `3px solid ${active ? "#8B4513" : "transparent"}`,
                    borderBottom: "1px solid #f5ede0", transition: "all 0.15s" }}>
                    <Avatar name={m.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#3d1a06", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#9d7a5a" }}>{count > 0 ? `${count} item${count !== 1 ? "s" : ""} · ₹${total}` : "No order"}</div>
                    </div>
                    {m.paid && <span style={{ fontSize: 14, color: "#22c55e" }}>✓</span>}
                    <button onClick={e => { e.stopPropagation(); removeMember(m.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#d0b0a0", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 12, borderTop: "1px solid #f0e6d6" }}>
              {addingMember ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addMember(); if (e.key === "Escape") setAddingMember(false); }}
                    placeholder="Member name…"
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e2d5c3",
                      fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fdf8f3" }} />
                  <button onClick={addMember} style={{ padding: "7px 12px", borderRadius: 8, border: "none",
                    background: "#8B4513", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+</button>
                </div>
              ) : (
                <button onClick={() => setAddingMember(true)} style={{ width: "100%", padding: "8px", borderRadius: 10,
                  border: "1.5px dashed #d2b48c", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#9d7a5a" }}>
                  + Add Member
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Center: Order Entry ────────────────────────────────────────── */}
        <main>
          {!selectedMember ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <img src={LOGO_B64} alt="" style={{ width: 72, height: 72, borderRadius: "50%", marginBottom: 16, opacity: 0.5 }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#3d1a06", margin: "0 0 8px" }}>No orders yet</h2>
              <p style={{ color: "#9d7a5a", margin: 0, fontSize: 14 }}>Select a member from the list to start adding items.</p>
            </div>
          ) : (
            <div>
              <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 18, padding: "20px 24px", marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar name={selectedMember.name} size={48} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#3d1a06" }}>{selectedMember.name}</h2>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9d7a5a" }}>
                      {memberItemCount(selectedMember)} items · ₹{memberTotal(selectedMember, menu)}
                    </p>
                  </div>
                </div>
                <PayToggle paid={selectedMember.paid} onChange={() => togglePaid(selectedMember.id)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {menu.map(item => {
                  const qty = selectedMember.orders[item.id] || 0;
                  return (
                    <div key={item.id} style={{ background: "#fff", border: `1.5px solid ${qty > 0 ? "#d97706" : "#f0e6d6"}`,
                      borderRadius: 14, padding: "14px 16px", position: "relative",
                      boxShadow: qty > 0 ? "0 2px 12px rgba(139,69,19,0.10)" : "none", transition: "all 0.2s" }}>
                      {item.id.startsWith("custom-") && (
                        <button onClick={() => removeMenuItem(item.id)} style={{ position: "absolute", top: 8, right: 8,
                          background: "none", border: "none", cursor: "pointer", color: "#d0b0a0", fontSize: 12, padding: 0 }}>✕</button>
                      )}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#3d1a06" }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "#9d7a5a" }}>₹{item.price}</div>
                        </div>
                        {qty > 0 && (
                          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#c2410c" }}>
                            ₹{qty * item.price}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <QtyBtn onClick={() => setQty(selectedMember.id, item.id, qty - 1)} disabled={qty === 0}>−</QtyBtn>
                        <span style={{ fontWeight: 800, fontSize: 16, color: qty > 0 ? "#8B4513" : "#c4b8a4",
                          minWidth: 24, textAlign: "center", transition: "color 0.2s" }}>{qty}</span>
                        <QtyBtn onClick={() => setQty(selectedMember.id, item.id, qty + 1)}>+</QtyBtn>
                      </div>
                    </div>
                  );
                })}

                {addingItem ? (
                  <div style={{ background: "#fff", border: "1.5px solid #8B4513", borderRadius: 14, padding: "14px 16px",
                    display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input value={newItemIcon} onChange={e => setNewItemIcon(e.target.value)} maxLength={2}
                        style={{ width: 40, fontSize: 20, textAlign: "center", border: "1.5px solid #e2d5c3",
                          borderRadius: 8, padding: "4px", background: "#fdf8f3", fontFamily: "inherit" }} />
                      <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setAddingItem(false); }}
                        placeholder="Item name…"
                        style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e2d5c3",
                          fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fdf8f3", color: "#3d1a06" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, color: "#9d7a5a", fontWeight: 600 }}>₹</span>
                      <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setAddingItem(false); }}
                        placeholder="Price"
                        style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e2d5c3",
                          fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fdf8f3", color: "#3d1a06" }} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setAddingItem(false)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1.5px solid #e2d5c3", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#9d7a5a" }}>Cancel</button>
                      <button onClick={addItem} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", background: "#8B4513", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff" }}>Add ✓</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setAddingItem(true)} style={{ background: "transparent", border: "1.5px dashed #d2b48c",
                    borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 8, minHeight: 120, transition: "all 0.2s" }}>
                    <span style={{ fontSize: 28, color: "#d2b48c" }}>+</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#9d7a5a" }}>Add Snack Item</span>
                  </div>
                )}
              </div>

              {memberTotal(selectedMember, menu) > 0 && (
                <div style={{ marginTop: 20, background: "linear-gradient(135deg,#8B4513,#c0522a)", borderRadius: 14,
                  padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#fde8d0", fontSize: 12, fontWeight: 600 }}>{selectedMember.name}'s Total</div>
                    <div style={{ color: "#fff", fontSize: 24, fontWeight: 900 }}>₹<AnimatedNumber value={memberTotal(selectedMember, menu)} /></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#fde8d0", fontSize: 12, marginBottom: 6 }}>{memberItemCount(selectedMember)} item{memberItemCount(selectedMember) !== 1 ? "s" : ""}</div>
                    <PayToggle paid={selectedMember.paid} onChange={() => togglePaid(selectedMember.id)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Right: Live Summary ────────────────────────────────────────── */}
        <aside style={{ position: "sticky", top: 76 }}>
          <div style={{ background: "#fff", border: "1.5px solid #f0e6d6", borderRadius: 18, padding: "20px" }}>
            <SummaryPanel />
          </div>
        </aside>
      </div>

      {/* Active member badge */}
      {selectedMember && (
        <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 40, display: "flex", alignItems: "center", gap: 8,
          background: "rgba(139,69,19,0.08)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(139,69,19,0.15)",
          borderRadius: 40, padding: "6px 14px 6px 8px", pointerEvents: "none" }}>
          <Avatar name={selectedMember.name} size={26} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#8B4513" }}>{selectedMember.name}</span>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .main-grid > aside:last-child { display: none; }
        }
        .mobile-summary-btn { display: none; }
        @media (max-width: 900px) { .mobile-summary-btn { display: block !important; } }
        .hide-mobile { display: inline; }
        @media (max-width: 600px) { .hide-mobile { display: none; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2d5c3; border-radius: 4px; }
        @media print { header, aside, button { display: none !important; } }
      `}</style>

      {/* Mobile bottom drawer */}
      {summaryOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80 }} onClick={() => setSummaryOpen(false)}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff",
            borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", maxHeight: "80vh", overflowY: "auto",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: "#e2d5c3", borderRadius: 2,
              margin: "0 auto 20px", cursor: "pointer" }} onClick={() => setSummaryOpen(false)} />
            <SummaryPanel />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: -1 }} />
        </div>
      )}
    </div>
  );
}
