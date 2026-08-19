"use client";

import { useState } from "react";
import { IconBulb, IconTarget } from "@/components/icons";
import { AS_OF, PLANS } from "@/lib/data";
import { daysSince, predict } from "@/lib/predict";
import { RISK_AR, RISK_VAR } from "@/lib/utils";
import type { ModelConfig, PlanName, Prediction } from "@/types";

type Form = {
  id: string; plan: PlanName; tenure: string; usage: string;
  complaints: string; support: string; bill: string;
};

const INITIAL: Form = {
  id: "", plan: "فايبر 100", tenure: "9", usage: "64",
  complaints: "2", support: "2026-08-11", bill: "185",
};

const GAUGE_R = 52;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

export function PredictionPanel({ model }: { model: ModelConfig }) {
  const [form, setForm] = useState<Form>(INITIAL);
  const [result, setResult] = useState<{ p: Prediction; days: number | null; f: Form } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((s) => ({ ...s, [k]: v }));

  const run = () => {
    setBusy(true);
    const days = daysSince(form.support, AS_OF);
    const p = predict(
      {
        id: form.id || "—",
        plan: form.plan,
        tenure: Number(form.tenure) || 0,
        usage: Number(form.usage) || 0,
        complaints: Number(form.complaints) || 0,
        bill: Number(form.bill) || 0,
        daysSince: days,
      },
      model
    );
    // تأخير قصير مقصود ليظهر هيكل التحميل — النموذج نفسه فوري
    setTimeout(() => {
      setResult({ p, days, f: form });
      setBusy(false);
    }, 380);
  };

  return (
    <div className="card-body">
      <div className="pred-grid">
        <div className="field">
          <label htmlFor="p-id">رقم العميل</label>
          <input id="p-id" type="text" placeholder="LTT-8842391" value={form.id} onChange={(e) => set("id", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-plan">نوع الاشتراك</label>
          <select id="p-plan" value={form.plan} onChange={(e) => set("plan", e.target.value as PlanName)}>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="p-tenure">مدة الاشتراك (بالأشهر)</label>
          <input id="p-tenure" type="number" min={0} max={600} value={form.tenure} onChange={(e) => set("tenure", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-usage">متوسط الاستهلاك الشهري (جيجابايت)</label>
          <input id="p-usage" type="number" min={0} max={2000} value={form.usage} onChange={(e) => set("usage", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-complaints">عدد الشكاوى</label>
          <input id="p-complaints" type="number" min={0} max={50} value={form.complaints} onChange={(e) => set("complaints", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-support">آخر تواصل مع الدعم</label>
          <input id="p-support" type="date" value={form.support} onChange={(e) => set("support", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-bill">قيمة الفاتورة (د.ل)</label>
          <input id="p-bill" type="number" min={0} max={5000} value={form.bill} onChange={(e) => set("bill", e.target.value)} />
        </div>
      </div>

      <button
        type="button" className="btn btn-primary" disabled={busy}
        style={{ marginTop: 14, width: "100%", justifyContent: "center" }}
        onClick={run}
      >
        <IconTarget /> {busy ? "جارٍ الحساب…" : "توليد التنبؤ"}
      </button>

      {busy && (
        <div className="pred-out">
          <div className="sk" style={{ height: 118 }} />
          <div className="sk sk-line" style={{ width: "70%" }} />
          <div className="sk sk-line" style={{ width: "50%" }} />
        </div>
      )}

      {!busy && result && (
        <div className="pred-out">
          <div className="gauge">
            <div className="gauge-ring">
              <svg viewBox="0 0 118 118" role="img" aria-label={`احتمال المغادرة ${result.p.score}%`}>
                <circle cx={59} cy={59} r={GAUGE_R} fill="none" stroke="var(--surface-3)" strokeWidth={11} />
                <circle
                  cx={59} cy={59} r={GAUGE_R} fill="none"
                  stroke={RISK_VAR[result.p.level]} strokeWidth={11} strokeLinecap="round"
                  strokeDasharray={`${((GAUGE_C * result.p.score) / 100).toFixed(1)} ${GAUGE_C.toFixed(1)}`}
                  transform="rotate(-90 59 59)"
                />
              </svg>
              <div className="gauge-mid">
                <div>
                  <div className="v num" style={{ color: RISK_VAR[result.p.level] }}>{result.p.score}%</div>
                  <div className="l">احتمال المغادرة</div>
                </div>
              </div>
            </div>

            <div className="gauge-side">
              <div>
                <div className="out-label">تصنيف مستوى الخطر</div>
                <span className={`badge ${result.p.level}`} style={{ fontSize: 13.5, padding: "5px 12px", marginTop: 4 }}>
                  <i />خطر {RISK_AR[result.p.level]}
                </span>
              </div>
              <div className="hint">
                العميل {result.f.id || "—"} · {result.f.plan} · {result.f.tenure} شهراً
                {result.days != null ? ` · آخر دعم منذ ${result.days} يوماً` : ""}
              </div>
            </div>
          </div>

          <div>
            <div className="out-label" style={{ marginBottom: 7 }}>أهم العوامل المؤثرة</div>
            {result.p.top.length ? (
              <div className="factors">
                {result.p.top.map((f) => (
                  <div className="f-row" key={f.n}>
                    <div className="f-top"><b>{f.n}</b><span>+{f.w}</span></div>
                    <div className="f-track">
                      <div className="f-fill" style={{ width: `${((f.w / result.p.mx) * 100).toFixed(0)}%`, background: RISK_VAR[result.p.level] }} />
                    </div>
                    <div className="hint">{f.d}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint" style={{ margin: 0 }}>
                لم يُسجَّل أي عامل خطر إيجابي لهذا العميل — المؤشرات كلها في النطاق الآمن.
              </p>
            )}
          </div>

          <div className="callout">
            <IconBulb />
            <div>
              <div className="t">إجراء احتفاظ مقترح</div>
              <div className="b">{result.p.action}</div>
            </div>
          </div>

          <p className="hint" style={{ margin: 0 }}>
            نموذج تفسيري مبسَّط لأغراض التدريب — الأوزان ثابتة وقابلة للمراجعة من صفحة
            إعدادات النموذج.
          </p>
        </div>
      )}
    </div>
  );
}
