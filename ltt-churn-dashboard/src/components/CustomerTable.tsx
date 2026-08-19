"use client";

import { useMemo, useState } from "react";
import { IconGift, IconPhone, IconSearch } from "@/components/icons";
import { riskOf } from "@/lib/predict";
import { pct, RISK_AR, RISK_VAR, sortRows } from "@/lib/utils";
import type { Customer, ModelConfig, SortKey, SortState } from "@/types";

const COLS: { k: SortKey; label: string; cls?: string }[] = [
  { k: "id", label: "رقم العميل", cls: "id" },
  { k: "plan", label: "نوع الباقة" },
  { k: "region", label: "المنطقة" },
  { k: "bill", label: "متوسط الفاتورة", cls: "num" },
  { k: "prob", label: "احتمال المغادرة" },
  { k: "reason", label: "سبب الخطر الرئيسي", cls: "wrap" },
  { k: "action", label: "الإجراء المقترح", cls: "wrap" },
];

const PER_PAGE = 8;

export function CustomerTable({
  rows, model, loading, onReset, onView, onOffer, onCall,
}: {
  rows: Customer[];
  model: ModelConfig;
  loading: boolean;
  onReset: () => void;
  onView: (c: Customer) => void;
  onOffer: (c: Customer) => void;
  onCall: (c: Customer) => void;
}) {
  const [sort, setSort] = useState<SortState>({ key: "prob", dir: "desc" });
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const current = Math.min(page, pages);
  const slice = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  if (loading) {
    return (
      <div className="sk-rows">
        {[68, 82, 55, 74, 61, 79].map((w, i) => (
          <div className="sk sk-line" key={i} style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="empty">
        <IconSearch />
        <h4>لا توجد بيانات مطابقة</h4>
        <p>
          لم يُطابق أي عميل الفلاتر الحالية. جرّب توسيع نطاق المنطقة أو نوع الباقة،
          أو أعد تعيين الفلاتر للعودة إلى القائمة الكاملة.
        </p>
        <button type="button" className="btn btn-primary" onClick={onReset}>
          إعادة تعيين الفلاتر
        </button>
      </div>
    );
  }

  const toggleSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" }));

  return (
    <>
      <div className="tbl-scroll">
        <table>
          <thead>
            <tr>
              {COLS.map((c) => {
                const on = sort.key === c.k;
                return (
                  <th
                    key={c.k}
                    className="sortable"
                    aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    onClick={() => toggleSort(c.k)}
                  >
                    {c.label}
                    <span className="sort-i">{on ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}</span>
                  </th>
                );
              })}
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((c) => {
              const r = riskOf(c.prob, model);
              return (
                <tr key={c.id}>
                  <td className="id">{c.id}</td>
                  <td>{c.plan}</td>
                  <td>{c.region}</td>
                  <td className="num">{c.bill} د.ل</td>
                  <td>
                    <div className="prob">
                      <span className="prob-v">{pct(c.prob)}%</span>
                      <span className="prob-track">
                        <span className="prob-fill" style={{ width: `${pct(c.prob)}%`, background: RISK_VAR[r] }} />
                      </span>
                    </div>
                    <span className={`badge ${r}`} style={{ marginTop: 4 }}><i />{RISK_AR[r]}</span>
                  </td>
                  <td className="wrap">{c.reason}</td>
                  <td className="wrap">{c.action}</td>
                  <td>
                    <div className="row-acts">
                      <button type="button" className="btn btn-sm" onClick={() => onView(c)}>عرض الملف</button>
                      <button type="button" className="btn btn-sm" title="إرسال عرض احتفاظ" aria-label={`إرسال عرض احتفاظ للعميل ${c.id}`} onClick={() => onOffer(c)}><IconGift /></button>
                      <button type="button" className="btn btn-sm" title="تواصل مع العميل" aria-label={`تواصل مع العميل ${c.id}`} onClick={() => onCall(c)}><IconPhone /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="tbl-foot">
        <span>
          عرض {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, sorted.length)} من {sorted.length}
        </span>
        <div className="pager">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="الصفحة السابقة">‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" aria-current={p === current ? "true" : undefined} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="الصفحة التالية">›</button>
        </div>
      </div>
    </>
  );
}
