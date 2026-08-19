"use client";

import { useState } from "react";
import { IconAlert, IconCheck, IconBulb, IconReport } from "@/components/icons";
import { CUSTOMERS } from "@/lib/data";
import { riskOf } from "@/lib/predict";
import { ALERTS, MODEL_FACTOR_LABELS, REPORTS, type ViewId } from "@/lib/views";
import { ar, groupStats, pct, RISK_AR, RISK_VAR } from "@/lib/utils";
import type { Customer, ModelConfig, RiskLevel } from "@/types";

/* ---------------- ملخّص القائمة المعروضة ---------------- */
export function ListSummary({ rows, model }: { rows: Customer[]; model: ModelConfig }) {
  if (!rows.length) {
    return <p className="hint" style={{ margin: 0 }}>لا يوجد عملاء مطابقون للفلاتر الحالية.</p>;
  }
  const avg = rows.reduce((a, c) => a + c.prob, 0) / rows.length;
  const rev = rows.reduce((a, c) => a + c.bill * 12, 0);
  const high = rows.filter((c) => riskOf(c.prob, model) === "high").length;
  return (
    <div className="metric-row">
      <div className="metric"><div className="l">عدد العملاء</div><div className="v">{rows.length}</div></div>
      <div className="metric"><div className="l">متوسط الاحتمال</div><div className="v">{pct(avg)}%</div></div>
      <div className="metric"><div className="l">خطر مرتفع</div><div className="v">{high}</div></div>
      <div className="metric"><div className="l">الإيراد السنوي المعرَّض</div><div className="v">{ar(rev)} د.ل</div></div>
    </div>
  );
}

/* ---------------- تحليل الشرائح ---------------- */
function SegmentPanel({
  title, desc, rows, model,
}: {
  title: string; desc: string;
  rows: { label: string; n: number; avg: number; high: number; rev: number }[];
  model: ModelConfig;
}) {
  const mx = Math.max(...rows.map((r) => r.avg));
  return (
    <div className="card">
      <div className="card-head"><div><h3>{title}</h3><div className="desc">{desc}</div></div></div>
      <div className="card-body">
        <div className="bars">
          {rows.map((r) => {
            const lvl = riskOf(r.avg, model);
            return (
              <div className="bar-row" key={r.label}>
                <div className="bar-top">
                  <span className="bar-name">
                    {r.label} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({r.n} عميل)</span>
                  </span>
                  <span className="bar-val" style={{ color: RISK_VAR[lvl] }}>{pct(r.avg)}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${((r.avg / mx) * 100).toFixed(0)}%`, background: RISK_VAR[lvl] }} />
                </div>
                <div className="hint">{r.high} بخطر مرتفع · {ar(r.rev)} د.ل إيراد سنوي معرَّض</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SegmentsView({ model }: { model: ModelConfig }) {
  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>كيف تُقرأ هذه الصفحة</h3>
            <div className="desc">
              كل شريحة تُعرض بمتوسط احتمال المغادرة لعملائها. اللون يتبع مستوى الخطر:
              أحمر للمرتفع، برتقالي للمتوسط، أخضر للمنخفض. الأرقام محسوبة من مجموعة
              العملاء الاصطناعية البالغة {CUSTOMERS.length} عميلاً.
            </div>
          </div>
        </div>
      </div>
      <div className="grid g-2">
        <SegmentPanel title="حسب نوع الباقة" desc="متوسط احتمال المغادرة لكل باقة" rows={groupStats("plan", model)} model={model} />
        <SegmentPanel title="حسب فترة الاشتراك" desc="العملاء الجدد أكثر عرضة للمغادرة" rows={groupStats("tenure", model)} model={model} />
      </div>
      <SegmentPanel title="حسب المنطقة" desc="ترتيب المناطق تنازلياً حسب متوسط احتمال المغادرة" rows={groupStats("region", model)} model={model} />
    </>
  );
}

/* ---------------- تنبيهات الخطر ---------------- */
export function AlertsView({
  onShowCustomers, onAck,
}: { onShowCustomers: (sev: RiskLevel) => void; onAck: (title: string) => void }) {
  const [sev, setSev] = useState<"" | RiskLevel>("");
  const rows = ALERTS.filter((a) => !sev || a.sev === sev);

  return (
    <>
      <div className="card">
        <div className="filters">
          <div className="field" style={{ flex: "1 1 190px" }}>
            <label htmlFor="a-sev">مستوى التنبيه</label>
            <select id="a-sev" value={sev} onChange={(e) => setSev(e.target.value as "" | RiskLevel)}>
              <option value="">كل المستويات</option>
              <option value="high">مرتفع</option>
              <option value="mid">متوسط</option>
              <option value="low">منخفض</option>
            </select>
          </div>
          <div className="filters-actions"><span className="hint">{ALERTS.length} تنبيهاً نشطاً</span></div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <div className="empty">
            <IconCheck />
            <h4>لا توجد تنبيهات بهذا المستوى</h4>
            <p>
              لم يتجاوز أي مؤشر عتبات التنبيه لهذا المستوى خلال الفترة المحددة.
              سيظهر التنبيه هنا تلقائياً عند حدوث تجاوز.
            </p>
          </div>
        </div>
      ) : (
        <div className="alert-list">
          {rows.map((a) => (
            <div className={`card alert ${a.sev}`} key={a.title}>
              <div className="alert-ico"><IconAlert /></div>
              <div className="alert-b">
                <div className="alert-t">
                  {a.title}
                  <span className={`badge ${a.sev}`}><i />{RISK_AR[a.sev]}</span>
                </div>
                <div className="alert-d">{a.desc}</div>
                <div className="alert-m">
                  <span>المؤشر: <b>{a.metric}</b></span>
                  <span>العملاء المتأثرون: <b>{a.affected}</b></span>
                  <span>{a.when}</span>
                </div>
                <div className="alert-acts">
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => onShowCustomers(a.sev)}>
                    عرض العملاء المتأثرين
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => onAck(a.title)}>إقرار بالاستلام</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- التقارير ---------------- */
export function ReportsView({
  onCsv, onPdf,
}: { onCsv: (highRiskOnly: boolean, title: string) => void; onPdf: (title: string) => void }) {
  return (
    <div className="grid g-3">
      {REPORTS.map((r) => (
        <div className="card rep-card" key={r.t}>
          <div className="rep-ico"><IconReport /></div>
          <h4>{r.t}</h4>
          <p>{r.d}</p>
          <p className="hint" style={{ margin: 0 }}>آخر توليد: {r.when}</p>
          <div className="rep-acts">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => onCsv(r.highRiskOnly, r.t)}>CSV</button>
            <button type="button" className="btn btn-sm" onClick={() => onPdf(r.t)}>PDF</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- إعدادات النموذج ---------------- */
export function ModelView({
  model, setModel, onToast,
}: {
  model: ModelConfig;
  setModel: (m: ModelConfig) => void;
  onToast: (t: string, d?: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const retrain = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onToast("اكتملت المحاكاة", "لم تتغير أوزان النموذج — هذه نسخة تدريبية.");
    }, 1400);
  };

  return (
    <>
      <div className="grid g-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>أداء النموذج</h3>
              <div className="desc">مقاييس محسوبة على مجموعة تحقّق اصطناعية — نموذج v2.4، آخر تدريب 12 أغسطس 2026</div>
            </div>
          </div>
          <div className="card-body">
            <div className="metric-row">
              <div className="metric"><div className="l">الدقة (Precision)</div><div className="v">0.84</div></div>
              <div className="metric"><div className="l">الاستدعاء (Recall)</div><div className="v">0.79</div></div>
              <div className="metric"><div className="l">مساحة تحت المنحنى</div><div className="v">0.91</div></div>
              <div className="metric"><div className="l">عدد العوامل</div><div className="v">7</div></div>
            </div>
            <button type="button" className="btn btn-primary" disabled={busy} style={{ marginTop: 14, width: "100%", justifyContent: "center" }} onClick={retrain}>
              {busy ? "جارٍ إعادة التدريب…" : "إعادة تدريب النموذج"}
            </button>
            <p className="hint" style={{ margin: "10px 0 0" }}>
              إعادة التدريب في هذه النسخة التدريبية محاكاة فقط ولا تُغيّر أوزان النموذج فعلياً.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>عتبات التصنيف</h3>
              <div className="desc">تحدد هذه العتبات متى يُصنَّف العميل بخطر مرتفع أو متوسط في كل الصفحات</div>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="slider-row">
              <div className="slider-top"><b>عتبة الخطر المرتفع</b><span>{model.thHigh}%</span></div>
              <input
                type="range" min={50} max={95} value={model.thHigh}
                onChange={(e) => setModel({ ...model, thHigh: Math.max(Number(e.target.value), model.thMid + 5) })}
              />
            </div>
            <div className="slider-row">
              <div className="slider-top"><b>عتبة الخطر المتوسط</b><span>{model.thMid}%</span></div>
              <input
                type="range" min={10} max={60} value={model.thMid}
                onChange={(e) => setModel({ ...model, thMid: Math.min(Number(e.target.value), model.thHigh - 5) })}
              />
            </div>
            <div className="callout">
              <IconBulb />
              <div>
                <div className="t">أثر التغيير</div>
                <div className="b">
                  العملاء باحتمال {model.thHigh}% أو أكثر يُصنَّفون بخطر مرتفع، ومن {model.thMid}%
                  إلى {model.thHigh - 1}% بخطر متوسط.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>العوامل المستخدمة في التنبؤ</h3>
            <div className="desc">إيقاف أي عامل يستبعده من حساب احتمال المغادرة في لوحة التنبؤ الفردي</div>
          </div>
        </div>
        <div className="card-body">
          {MODEL_FACTOR_LABELS.map(([k, t, d]) => (
            <div className="switch-row" key={k}>
              <div><div className="t">{t}</div><div className="d">{d}</div></div>
              <button
                type="button" className="sw-toggle" role="switch"
                aria-checked={Boolean(model[k])} aria-label={t}
                onClick={() => {
                  const next = !model[k];
                  setModel({ ...model, [k]: next });
                  onToast(next ? "تم تفعيل العامل" : "تم استبعاد العامل", "أعد توليد التنبؤ لرؤية الأثر.");
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const VIEW_IDS: ViewId[] = ["home", "predictions", "segments", "alerts", "reports", "model"];
