"use client";

import { useEffect, useRef, useState } from "react";
import { IconInbox } from "@/components/icons";
import { REASONS, RISK_SEGMENTS } from "@/lib/data";
import type { RiskLevel } from "@/types";

/* ============================================================
   جدول بديل لأي رسم — يضمن أن المعلومة متاحة دون الاعتماد على اللون
   ============================================================ */
export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="dtable-wrap">
      <table className="dtable">
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => <td key={j} className={j ? "num" : undefined}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** زر يُظهر/يُخفي الجدول البديل. */
export function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="btn btn-sm btn-ghost" onClick={onToggle}>
      {open ? "إخفاء الجدول" : "عرض كجدول"}
    </button>
  );
}

/* ============================================================
   الرسم الخطي — الزمن يتدفّق يميناً←يساراً حسب اتجاه القراءة العربي
   ============================================================ */
const W = 760, H = 250, PT = 16, PB = 34, PR = 46, PL = 14;

export function ChurnTrendChart({
  months, actual, predicted,
}: { months: string[]; actual: number[]; predicted: number[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [tipSize, setTipSize] = useState({ w: 150, h: 90 });
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tipRef.current && hover !== null) {
      const r = tipRef.current.getBoundingClientRect();
      if (r.width && (Math.abs(r.width - tipSize.w) > 2 || Math.abs(r.height - tipSize.h) > 2)) {
        setTipSize({ w: r.width, h: r.height });
      }
    }
  }, [hover, tipSize.w, tipSize.h]);

  if (months.length < 2) {
    return (
      <div className="empty">
        <IconInbox />
        <h4>الفترة قصيرة جداً للرسم</h4>
        <p>
          يحتاج الرسم الخطي إلى شهرين على الأقل لإظهار الاتجاه. اختر فترة أطول من
          محدد الفترة الزمنية أعلى الصفحة.
        </p>
      </div>
    );
  }

  const all = [...actual, ...predicted];
  const mn = Math.floor(Math.min(...all) * 2) / 2 - 0.5;
  const mx = Math.ceil(Math.max(...all) * 2) / 2 + 0.5;
  const step = (W - PR - PL) / (months.length - 1);
  const X = (i: number) => W - PR - i * step;
  const Y = (v: number) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");

  const ticks: number[] = [];
  for (let v = mn; v <= mx + 0.001; v += 0.5) ticks.push(+v.toFixed(1));
  const labelEvery = Math.ceil(months.length / 6);
  const last = months.length - 1;

  const onMove = (clientX: number) => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = (clientX - r.left) * (W / r.width);
    let bi = 0, bd = Infinity;
    for (let i = 0; i < months.length; i++) {
      const d = Math.abs(X(i) - vx);
      if (d < bd) { bd = d; bi = i; }
    }
    setHover(bi);
  };

  const tipLeftPct = hover === null ? 0 : (X(hover) / W) * 100;
  const tipTopPct = hover === null ? 0 : (Y(Math.max(actual[hover], predicted[hover])) / H) * 100;

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`مقارنة معدل المغادرة الفعلي والمتوقع خلال ${months.length} أشهر`}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => onMove(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={Y(t)} y2={Y(t)} stroke="var(--grid)" strokeWidth={1} />
            <text x={W - PR + 8} y={Y(t) + 4} fill="var(--muted)" fontSize={11}>{t.toFixed(1)}%</text>
          </g>
        ))}

        <path d={`${path(actual)} L${X(last).toFixed(1)} ${Y(mn)} L${X(0).toFixed(1)} ${Y(mn)} Z`} fill="var(--s1-fill)" />
        <path d={path(actual)} fill="none" stroke="var(--s1)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* الخط المتقطع تمييز ثانوي مقصود — لا يُستبدل بلون فقط */}
        <path d={path(predicted)} fill="none" stroke="var(--s2)" strokeWidth={2.5} strokeDasharray="7 5" strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={X(last)} cy={Y(actual[last])} r={5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} />
        <circle cx={X(last)} cy={Y(predicted[last])} r={5} fill="var(--s2)" stroke="var(--surface)" strokeWidth={2} />

        {months.map((m, i) =>
          i % labelEvery === 0 || i === last ? (
            <text key={m} x={X(i)} y={H - 12} fill="var(--muted)" fontSize={11} textAnchor="middle">
              {m.split(" ")[0]}
            </text>
          ) : null
        )}

        {hover !== null && (
          <g>
            <line x1={X(hover)} x2={X(hover)} y1={PT} y2={H - PB} stroke="var(--axis)" strokeWidth={1} strokeDasharray="4 4" />
            <circle cx={X(hover)} cy={Y(actual[hover])} r={5.5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} />
            <circle cx={X(hover)} cy={Y(predicted[hover])} r={5.5} fill="var(--s2)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      <div
        ref={tipRef}
        className={`tip${hover !== null ? " on" : ""}`}
        style={
          hover === null
            ? { left: 0, top: 0 }
            : { left: `calc(${tipLeftPct}% - ${tipSize.w / 2}px)`, top: `calc(${tipTopPct}% - ${tipSize.h + 14}px)` }
        }
      >
        {hover !== null && (
          <>
            <div className="tip-t">{months[hover]}</div>
            <div className="tip-r">
              <span className="k"><i style={{ background: "var(--s1)" }} />الفعلي</span>
              <span className="v">{actual[hover]}%</span>
            </div>
            <div className="tip-r">
              <span className="k"><i style={{ background: "var(--s2)" }} />المتوقع</span>
              <span className="v">{predicted[hover]}%</span>
            </div>
            <div className="tip-r tip-sep">
              <span className="k">الفارق</span>
              <span className="v">{(actual[hover] - predicted[hover]).toFixed(1)} نقطة</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TrendLegend() {
  return (
    <div className="legend">
      <span className="legend-i"><span className="sw" style={{ background: "var(--s1)" }} />المعدل الفعلي</span>
      <span className="legend-i"><span className="sw dash" />المعدل المتوقع</span>
    </div>
  );
}

/* ============================================================
   الرسم الدائري — فجوة 4 وحدات بين القطاعات لفصلها بصرياً
   ============================================================ */
const R = 70, SW = 22, C = 2 * Math.PI * R, GAP = 4;

export function RiskDonut({ onPick }: { onPick: (k: RiskLevel) => void }) {
  const [active, setActive] = useState<number | null>(null);

  // إزاحة كل قطاع هي مجموع أطوال ما قبله — تُحسب دون تغيير أي متغيّر خارجي
  const arcs = RISK_SEGMENTS.map((g, i) => ({
    ...g,
    len: (g.value / 100) * C,
    offset: RISK_SEGMENTS.slice(0, i).reduce((s, p) => s + (p.value / 100) * C, 0),
  }));

  const shown = active === null ? null : RISK_SEGMENTS[active];

  return (
    <div className="donut-wrap">
      <div className="chart-wrap" style={{ width: 186 }}>
        <svg viewBox="0 0 200 200" role="img" aria-label="توزيع العملاء على مستويات الخطر">
          <g transform="rotate(-90 100 100)">
            <circle cx={100} cy={100} r={R} fill="none" stroke="var(--surface-3)" strokeWidth={SW} />
            {arcs.map((a, i) => (
              <circle
                key={a.k}
                cx={100} cy={100} r={R} fill="none"
                stroke={a.color}
                strokeWidth={active === i ? 27 : active === null ? SW : 18}
                strokeDasharray={`${Math.max(0, a.len - GAP).toFixed(2)} ${(C - a.len + GAP).toFixed(2)}`}
                strokeDashoffset={(-a.offset).toFixed(2)}
                style={{ cursor: "pointer", transition: "stroke-width .15s" }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onClick={() => onPick(a.k)}
              />
            ))}
          </g>
        </svg>
        <div className="donut-hole">
          <div>
            <div className="v num" style={shown ? { color: shown.color } : undefined}>
              {shown ? `${shown.value}%` : "100%"}
            </div>
            <div className="l">{shown ? shown.label : "إجمالي العملاء"}</div>
          </div>
        </div>
      </div>

      <div className="donut-legend">
        {RISK_SEGMENTS.map((g, i) => (
          <button
            key={g.k} type="button" className="dl-row"
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)} onBlur={() => setActive(null)}
            onClick={() => onPick(g.k)}
          >
            <span className="box" style={{ background: g.color }} />
            <span className="n">{g.label}</span>
            <span className="c">{g.count}</span>
            <span className="v">{g.value}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   أعمدة أسباب المغادرة — مقياس واحد، فلون واحد لكل الأعمدة.
   تلوين الأعمدة حسب الرتبة يُرمّز الطول مرتين وهو نمط خاطئ.
   ============================================================ */
export function ReasonBars() {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const mx = Math.max(...REASONS.map((r) => r.value));

  return (
    <div className="bars">
      {REASONS.map((r) => (
        <div className="bar-row" key={r.label} title={`${r.label}: ${r.value}% من وزن التفسير`}>
          <div className="bar-top">
            <span className="bar-name">{r.label}</span>
            <span className="bar-val">{r.value}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: grown ? `${(r.value / mx) * 100}%` : 0, background: "var(--s1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** خط اتجاه مصغَّر داخل بطاقات المؤشرات. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 240, h = 34;
  const mn = Math.min(...values), sp = Math.max(...values) - mn || 1;
  const pts = values.map((v, i) => [w - i * (w / (values.length - 1)), h - 2 - ((v - mn) / sp) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden focusable="false">
      <path d={`${d} L0 ${h} L${w} ${h} Z`} fill={color} opacity={0.16} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}
