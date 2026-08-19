"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconAlert, IconBell, IconBulb, IconCalendar, IconCheck, IconClose, IconCog,
  IconDownload, IconLogout, IconMenu, IconMoon, IconUsers,
} from "@/components/icons";
import { ALERTS, NAV, type ViewId } from "@/lib/views";
import { RANGES } from "@/lib/data";
import { riskOf } from "@/lib/predict";
import { pct, RISK_AR, RISK_VAR } from "@/lib/utils";
import type { Customer, ModelConfig, RangeId } from "@/types";

/* ---------------- الشريط الجانبي ---------------- */
export function Rail({ view, onGo, open }: { view: ViewId; onGo: (v: ViewId) => void; open: boolean }) {
  return (
    <aside className={`rail${open ? " on" : ""}`} id="rail">
      <div className="brand">
        <div className="brand-mark">LTT</div>
        <div>
          <div className="brand-name">شركة الاتصالات والتقنية</div>
          <div className="brand-sub">منصة تحليلات الاحتفاظ بالعملاء</div>
        </div>
      </div>

      <nav className="nav" aria-label="التنقل الرئيسي">
        <div className="nav-label">القوائم</div>
        {NAV.map((it) => {
          const Ico = it.Ico;
          return (
            <button
              key={it.id} type="button" className="nav-item"
              aria-current={view === it.id ? "page" : undefined}
              onClick={() => onGo(it.id)}
            >
              <Ico />
              <span>{it.label}</span>
              {it.badge ? <span className="nav-badge">{it.badge}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="rail-foot">
        <b>نموذج التنبؤ v2.4</b>
        آخر تدريب: 12 أغسطس 2026
      </div>
    </aside>
  );
}

/* ---------------- قائمة منسدلة ---------------- */
function Pop({
  label, ariaLabel, children, className = "btn",
}: {
  label: React.ReactNode; ariaLabel: string; children: (close: () => void) => React.ReactNode; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pop" ref={ref}>
      <button type="button" className={className} aria-expanded={open} aria-haspopup="true" aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && <div className="pop-panel" aria-label={ariaLabel}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

/* ---------------- الترويسة ---------------- */
export function Topbar({
  title, sub, range, onRange, onBurger, onExport, onGo,
}: {
  title: string; sub: string; range: RangeId;
  onRange: (r: RangeId) => void; onBurger: () => void;
  onExport: () => void; onGo: (v: ViewId) => void;
}) {
  const rangeLabel = RANGES.find((r) => r.id === range)?.label ?? "";

  const toggleTheme = () => {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    const isDark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme:dark)").matches;
    root.setAttribute("data-theme", isDark ? "light" : "dark");
  };

  return (
    <header className="topbar">
      <button className="burger" aria-label="إظهار قائمة التنقل" onClick={onBurger}><IconMenu /></button>
      <div>
        <h1>{title}</h1>
        <div className="topbar-sub">{sub}</div>
      </div>

      <div className="topbar-tools">
        <Pop ariaLabel="اختيار الفترة الزمنية" label={<><IconCalendar /><span>{rangeLabel}</span></>}>
          {(close) => (
            <>
              <div className="pop-head"><span>الفترة الزمنية</span></div>
              <div className="pop-list">
                {RANGES.map((r) => (
                  <button
                    key={r.id} type="button"
                    className={`pop-row${range === r.id ? " is-sel" : ""}`}
                    onClick={() => { onRange(r.id); close(); }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="t">{r.label}</div>
                      <div className="d">{r.d}</div>
                    </div>
                    {range === r.id && <span style={{ color: "var(--accent)" }}><IconCheck /></span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </Pop>

        <button type="button" className="btn btn-primary" onClick={onExport}>
          <IconDownload /> تصدير التقرير
        </button>

        <Pop ariaLabel="الإشعارات" className="btn btn-icon" label={<><IconBell /><span className="dot-badge" /></>}>
          {(close) => (
            <>
              <div className="pop-head">
                <span>الإشعارات</span>
                <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>2 غير مقروءة</span>
              </div>
              <div className="pop-list">
                {ALERTS.slice(0, 4).map((a) => (
                  <button key={a.title} type="button" className="pop-row" onClick={() => { close(); onGo("alerts"); }}>
                    <span style={{ color: RISK_VAR[a.sev], flex: "none", marginTop: 2 }}><IconAlert /></span>
                    <div style={{ flex: 1 }}>
                      <div className="t">{a.title}</div>
                      <div className="d">{a.when} · {a.affected}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </Pop>

        <button type="button" className="btn btn-icon" aria-label="تبديل الوضع الليلي" onClick={toggleTheme}>
          <IconMoon />
        </button>

        <Pop
          ariaLabel="حساب المستخدم" className="user-btn"
          label={
            <>
              <div className="avatar">ب أ</div>
              <div className="user-meta"><b>بدر الزيتوني</b><span>محلل الاحتفاظ بالعملاء</span></div>
            </>
          }
        >
          {(close) => (
            <>
              <div className="pop-head">
                <div><div className="t">بدر الزيتوني</div><div className="d">analyst@ltt.example</div></div>
              </div>
              <button type="button" className="pop-row" onClick={() => { close(); onGo("model"); }}>
                <span style={{ color: "var(--muted)", flex: "none" }}><IconCog /></span>
                <span className="t">إعدادات النموذج</span>
              </button>
              <button type="button" className="pop-row" onClick={() => { close(); onGo("alerts"); }}>
                <span style={{ color: "var(--muted)", flex: "none" }}><IconAlert /></span>
                <span className="t">تفضيلات التنبيهات</span>
              </button>
              <button type="button" className="pop-row" onClick={() => { close(); onGo("predictions"); }}>
                <span style={{ color: "var(--muted)", flex: "none" }}><IconUsers /></span>
                <span className="t">قائمة العملاء</span>
              </button>
              <div className="pop-row" style={{ color: "var(--muted)", fontSize: 12 }}>
                <IconLogout />
                <span>نسخة تدريبية — تسجيل الخروج غير مُفعَّل</span>
              </div>
            </>
          )}
        </Pop>
      </div>
    </header>
  );
}

/* ---------------- درج ملف العميل ---------------- */
export function CustomerDrawer({
  customer, model, onClose, onOffer, onCall,
}: {
  customer: Customer | null; model: ModelConfig;
  onClose: () => void; onOffer: (c: Customer) => void; onCall: (c: Customer) => void;
}) {
  useEffect(() => {
    if (!customer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [customer, onClose]);

  const r = customer ? riskOf(customer.prob, model) : "low";

  return (
    <aside
      className={`drawer${customer ? " on" : ""}`}
      role="dialog" aria-modal="true" aria-hidden={!customer}
      aria-label={customer ? `ملف العميل ${customer.id}` : "ملف العميل"}
    >
      <div className="drawer-head">
        <h3>{customer ? `ملف العميل ${customer.id}` : "ملف العميل"}</h3>
        <button type="button" className="btn btn-icon" aria-label="إغلاق" onClick={onClose}><IconClose /></button>
      </div>

      {customer && (
        <div className="drawer-body">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar" style={{ width: 46, height: 46, fontSize: 15 }}>{customer.region.slice(0, 2)}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{customer.id}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{customer.plan} · {customer.region}</div>
            </div>
            <span className={`badge ${r}`} style={{ marginInlineStart: "auto" }}><i />خطر {RISK_AR[r]}</span>
          </div>

          <div className="callout">
            <div style={{ flex: 1 }}>
              <div className="t">احتمال المغادرة المتوقع</div>
              <div className="num" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, color: RISK_VAR[r] }}>
                {pct(customer.prob)}%
              </div>
            </div>
          </div>

          <div className="kv">
            <div className="i"><div className="l">متوسط الفاتورة</div><div className="v">{customer.bill} د.ل</div></div>
            <div className="i"><div className="l">مدة الاشتراك</div><div className="v">{customer.tenure} شهراً</div></div>
            <div className="i"><div className="l">الاستهلاك الشهري</div><div className="v">{customer.usage} جيجابايت</div></div>
            <div className="i"><div className="l">عدد الشكاوى</div><div className="v">{customer.complaints}</div></div>
          </div>

          <div>
            <div className="out-label" style={{ marginBottom: 5 }}>سبب الخطر الرئيسي</div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{customer.reason}</div>
          </div>

          <div className="callout">
            <IconBulb />
            <div><div className="t">إجراء الاحتفاظ المقترح</div><div className="b">{customer.action}</div></div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={() => { onOffer(customer); onClose(); }}>إرسال عرض احتفاظ</button>
            <button type="button" className="btn" onClick={() => { onCall(customer); onClose(); }}>تواصل مع العميل</button>
          </div>

          <p className="hint" style={{ margin: 0 }}>
            بيانات اصطناعية لأغراض التدريب — لا تمثّل عميلاً حقيقياً.
          </p>
        </div>
      )}
    </aside>
  );
}

/* ---------------- الإشعارات اللحظية ---------------- */
export type Toast = { id: number; t: string; d?: string };

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((x) => (
        <div className="toast" key={x.id}>
          <IconCheck />
          <div>
            <div className="t">{x.t}</div>
            {x.d && <div className="d">{x.d}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
