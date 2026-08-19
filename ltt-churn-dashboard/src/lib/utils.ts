import { CUSTOMERS, TENURE_BUCKETS } from "@/lib/data";
import { riskOf } from "@/lib/predict";
import type { Customer, Filters, ModelConfig, RiskLevel, SortState } from "@/types";

export const RISK_AR: Record<RiskLevel, string> = {
  high: "مرتفع",
  mid: "متوسط",
  low: "منخفض",
};

export const RISK_VAR: Record<RiskLevel, string> = {
  high: "var(--critical)",
  mid: "var(--warning)",
  low: "var(--good)",
};

export const EMPTY_FILTERS: Filters = { region: "", plan: "", tenure: "", risk: "" };

export const pct = (v: number) => Math.round(v * 100);

/** أرقام عربية-هندية للنصوص السردية؛ الجداول تبقى بأرقام لاتينية للمحاذاة. */
export const ar = (n: number) => n.toLocaleString("ar-EG", { maximumFractionDigits: 1 });

export function applyFilters(
  rows: readonly Customer[],
  f: Filters,
  model?: ModelConfig
): Customer[] {
  return rows.filter((c) => {
    if (f.region && c.region !== f.region) return false;
    if (f.plan && c.plan !== f.plan) return false;
    if (f.risk && riskOf(c.prob, model) !== f.risk) return false;
    if (f.tenure) {
      const t = TENURE_BUCKETS.find((x) => x.id === f.tenure);
      if (t && (c.tenure < t.min || c.tenure > t.max)) return false;
    }
    return true;
  });
}

export function sortRows(rows: readonly Customer[], s: SortState): Customer[] {
  const m = s.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[s.key];
    const y = b[s.key];
    if (typeof x === "number" && typeof y === "number") return (x - y) * m;
    return String(x).localeCompare(String(y), "ar") * m;
  });
}

/** إحصاءات شريحة واحدة — تُستخدم في صفحة تحليل الشرائح وملخّص القائمة. */
export function summarize(rows: readonly Customer[], model?: ModelConfig) {
  if (!rows.length) return null;
  return {
    n: rows.length,
    avg: rows.reduce((a, c) => a + c.prob, 0) / rows.length,
    high: rows.filter((c) => riskOf(c.prob, model) === "high").length,
    rev: rows.reduce((a, c) => a + c.bill * 12, 0),
  };
}

export function groupStats(
  key: "plan" | "region" | "tenure",
  model?: ModelConfig
) {
  const m = new Map<string, Customer[]>();
  for (const c of CUSTOMERS) {
    const k =
      key === "tenure"
        ? (TENURE_BUCKETS.find((t) => c.tenure >= t.min && c.tenure <= t.max)
            ?? TENURE_BUCKETS[TENURE_BUCKETS.length - 1]).label
        : c[key];
    const list = m.get(k);
    if (list) list.push(c);
    else m.set(k, [c]);
  }
  return [...m.entries()]
    .map(([label, v]) => ({ label, ...summarize(v, model)! }))
    .sort((a, b) => b.avg - a.avg);
}

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_HEADERS = [
  "رقم العميل",
  "نوع الباقة",
  "المنطقة",
  "متوسط الفاتورة (د.ل)",
  "احتمال المغادرة (%)",
  "مستوى الخطر",
  "مدة الاشتراك (شهر)",
  "الاستهلاك (جيجابايت)",
  "عدد الشكاوى",
  "سبب الخطر الرئيسي",
  "الإجراء المقترح",
] as const;

export function toCsv(rows: readonly Customer[], model?: ModelConfig): string {
  const body = rows.map((c) => [
    c.id, c.plan, c.region, c.bill, pct(c.prob),
    RISK_AR[riskOf(c.prob, model)], c.tenure, c.usage, c.complaints,
    c.reason, c.action,
  ]);
  return [CSV_HEADERS, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/**
 * يعرض ملف CSV على المستخدم.
 * داخل صفحة Artifact منشورة تُستخدم قدرة `downloads`؛ ومحلياً يُستخدم Blob.
 * تُرجع رسالة للعرض في الإشعار، أو null إذا رفض المستخدم الحفظ.
 */
export async function saveCsv(filename: string, text: string): Promise<string | null> {
  const w = window as unknown as {
    claude?: { use?: (n: string) => Promise<{ save: (r: unknown) => Promise<unknown> } | null> };
  };
  if (w.claude?.use) {
    try {
      const dl = await w.claude.use("downloads");
      if (dl) {
        try {
          await dl.save({ filename, data: text });
          return filename;
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === "declined") return null;
          if (code === "extension_not_enabled") {
            await dl.save({ filename: filename.replace(/\.csv$/, ".txt"), data: text });
            return "تعذّر حفظ CSV، فحُفظ الملف بصيغة نصية.";
          }
          throw err;
        }
      }
    } catch {
      /* يسقط إلى مسار Blob أدناه */
    }
  }
  // "﻿" يجعل Excel يقرأ العربية بترميز UTF-8 بشكل صحيح.
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return filename;
}
