"use client";

import { PLANS, REGIONS, RISK_SEGMENTS, TENURE_BUCKETS } from "@/lib/data";
import type { Filters } from "@/types";

type FieldDef = {
  k: keyof Filters;
  label: string;
  all: string;
  opts: [string, string][];
};

const FIELDS = (): FieldDef[] => [
  { k: "region", label: "المنطقة", all: "كل المناطق", opts: REGIONS.map((r) => [r, r]) },
  { k: "plan", label: "نوع الباقة", all: "كل الباقات", opts: PLANS.map((p) => [p, p]) },
  { k: "tenure", label: "فترة الاشتراك", all: "كل الفترات", opts: TENURE_BUCKETS.map((t) => [t.id, t.label]) },
  { k: "risk", label: "مستوى الخطر", all: "كل المستويات", opts: RISK_SEGMENTS.map((s) => [s.k, s.label]) },
];

function labelFor(k: keyof Filters, v: string) {
  if (k === "tenure") return TENURE_BUCKETS.find((t) => t.id === v)?.label ?? v;
  if (k === "risk") return RISK_SEGMENTS.find((s) => s.k === v)?.label ?? v;
  return v;
}

export function FilterBar({
  filters, onChange, onReset, idPrefix,
}: {
  filters: Filters;
  onChange: (k: keyof Filters, v: string) => void;
  onReset: () => void;
  idPrefix: string;
}) {
  const fields = FIELDS();
  const active = fields.filter((f) => filters[f.k]);

  return (
    <div className="card">
      <div className="filters">
        {fields.map((f) => (
          <div className="field" key={f.k}>
            <label htmlFor={`${idPrefix}-${f.k}`}>{f.label}</label>
            <select
              id={`${idPrefix}-${f.k}`}
              value={filters[f.k]}
              onChange={(e) => onChange(f.k, e.target.value)}
            >
              <option value="">{f.all}</option>
              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
        <div className="filters-actions">
          <button type="button" className="btn" onClick={onReset}>إعادة تعيين</button>
        </div>
      </div>

      {active.length > 0 && (
        <div className="chip-row">
          <span className="hint">الفلاتر النشطة:</span>
          {active.map((f) => (
            <span className="chip" key={f.k}>
              {f.label}: {labelFor(f.k, filters[f.k])}
              <button type="button" aria-label={`إزالة فلتر ${f.label}`} onClick={() => onChange(f.k, "")}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
