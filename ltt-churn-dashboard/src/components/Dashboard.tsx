"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChurnTrendChart, DataTable, ReasonBars, RiskDonut, TableToggle, TrendLegend,
} from "@/components/Charts";
import { CustomerDrawer, Rail, Toasts, Topbar, type Toast } from "@/components/Chrome";
import { CustomerTable } from "@/components/CustomerTable";
import { FilterBar } from "@/components/FilterBar";
import { IconDownload, IconPrinter } from "@/components/icons";
import { Kpis } from "@/components/Kpis";
import { PredictionPanel } from "@/components/PredictionPanel";
import { AlertsView, ListSummary, ModelView, ReportsView, SegmentsView } from "@/components/Views";
import { ACTUAL, CUSTOMERS, MONTHS, PREDICTED, RANGES, REASONS } from "@/lib/data";
import { DEFAULT_MODEL } from "@/lib/predict";
import { applyFilters, EMPTY_FILTERS, saveCsv, toCsv } from "@/lib/utils";
import { NAV, type ViewId } from "@/lib/views";
import type { Customer, Filters, ModelConfig, RangeId, RiskLevel } from "@/types";

export function Dashboard() {
  const [view, setView] = useState<ViewId>("home");
  const [range, setRange] = useState<RangeId>("m12");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [model, setModel] = useState<ModelConfig>(DEFAULT_MODEL);
  const [railOpen, setRailOpen] = useState(false);
  const [drawer, setDrawer] = useState<Customer | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLineTable, setShowLineTable] = useState(false);
  const [showBarTable, setShowBarTable] = useState(false);
  const toastId = useRef(0);

  const meta = NAV.find((n) => n.id === view)!;
  const rows = useMemo(() => applyFilters(CUSTOMERS, filters, model), [filters, model]);

  const toast = useCallback((t: string, d?: string) => {
    const id = ++toastId.current;
    setToasts((x) => [...x, { id, t, d }]);
    setTimeout(() => setToasts((x) => x.filter((i) => i.id !== id)), 3600);
  }, []);

  /** تأخير قصير مقصود لإظهار هيكل التحميل عند تغيير الفلاتر أو الفترة. */
  const flashLoading = useCallback(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, []);

  const go = (v: ViewId) => {
    setView(v);
    setRailOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onFilter = (k: keyof Filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    flashLoading();
  };
  const onReset = () => {
    setFilters(EMPTY_FILTERS);
    flashLoading();
  };

  const onRange = (r: RangeId) => {
    setRange(r);
    flashLoading();
  };

  const pickRisk = (k: RiskLevel) => {
    setFilters((f) => ({ ...f, risk: k }));
    flashLoading();
    toast("تم تطبيق الفلتر", `جدول العملاء يعرض الآن مستوى الخطر المحدَّد فقط.`);
  };

  const exportCsv = async (highRiskOnly = false, label?: string) => {
    const source = highRiskOnly
      ? applyFilters(CUSTOMERS, { ...filters, risk: "high" }, model)
      : rows;
    if (!source.length) {
      toast("لا توجد بيانات للتصدير", "عدّل الفلاتر ثم أعد المحاولة.");
      return;
    }
    const res = await saveCsv("ltt-churn-customers.csv", toCsv(source, model));
    if (res) toast("تم تصدير الملف", label ? `${label} — ${res}` : res);
  };

  const printPdf = (label?: string) => {
    toast("جارٍ تحضير الطباعة", label ?? 'اختر "حفظ كـ PDF" من نافذة الطباعة.');
    setTimeout(() => window.print(), 400);
  };

  const offer = (c: Customer) => toast("تم إرسال عرض الاحتفاظ", `العميل ${c.id} — ${c.action}`);
  const call = (c: Customer) =>
    toast("تم إنشاء مهمة تواصل", `أُسندت مهمة الاتصال بالعميل ${c.id} إلى فريق الاحتفاظ.`);

  // إغلاق الشريط الجانبي عند الرجوع إلى مقاس الحاسوب
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const onChange = () => { if (mq.matches) setRailOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const months = RANGES.find((r) => r.id === range)!.months;
  const mo = MONTHS.slice(-months);
  const actual = ACTUAL.slice(-months);
  const predicted = PREDICTED.slice(-months);

  return (
    <div className="shell">
      <Rail view={view} onGo={go} open={railOpen} />

      <div className="main">
        <Topbar
          title={meta.title} sub={meta.sub} range={range}
          onRange={onRange} onBurger={() => setRailOpen((o) => !o)}
          onExport={() => printPdf()} onGo={go}
        />

        <div className="content">
          {view === "home" && (
            <>
              <Kpis range={range} />

              <FilterBar filters={filters} onChange={onFilter} onReset={onReset} idPrefix="f" />

              <div className="grid g-8-4">
                <div className="card">
                  <div className="card-head">
                    <div>
                      <h3>اتجاه معدل المغادرة المتوقع</h3>
                      <div className="desc">
                        مقارنة شهرية بين معدل المغادرة الفعلي والمتوقع خلال آخر 12 شهراً
                      </div>
                    </div>
                    <div className="card-head-tools">
                      <TableToggle open={showLineTable} onToggle={() => setShowLineTable((o) => !o)} />
                    </div>
                  </div>
                  <div className="card-body">
                    <TrendLegend />
                    {loading ? (
                      <div className="sk" style={{ height: 250 }} />
                    ) : (
                      <ChurnTrendChart months={[...mo]} actual={actual} predicted={predicted} />
                    )}
                    {showLineTable && (
                      <DataTable
                        head={["الشهر", "المعدل الفعلي", "المعدل المتوقع", "الفارق"]}
                        rows={mo.map((m, i) => [m, `${actual[i]}%`, `${predicted[i]}%`, (actual[i] - predicted[i]).toFixed(1)])}
                      />
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div><h3>توزيع مستوى الخطر</h3><div className="desc">نسبة العملاء في كل مستوى</div></div>
                  </div>
                  <div className="card-body">
                    <RiskDonut onPick={pickRisk} />
                  </div>
                </div>
              </div>

              <div className="grid g-7-5">
                <div className="card">
                  <div className="card-head">
                    <div>
                      <h3>أسباب المغادرة الأكثر تأثيراً</h3>
                      <div className="desc">وزن كل سبب في تفسير تنبؤات النموذج</div>
                    </div>
                    <div className="card-head-tools">
                      <TableToggle open={showBarTable} onToggle={() => setShowBarTable((o) => !o)} />
                    </div>
                  </div>
                  <div className="card-body">
                    <ReasonBars />
                    {showBarTable && (
                      <DataTable
                        head={["سبب المغادرة", "وزن التأثير"]}
                        rows={REASONS.map((r) => [r.label, `${r.value}%`])}
                      />
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div>
                      <h3>تحليل عميل فردي</h3>
                      <div className="desc">أدخل بيانات العميل لتوليد تنبؤ فوري وقابل للتفسير</div>
                    </div>
                  </div>
                  <PredictionPanel model={model} />
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>العملاء ذوو الأولوية للتدخل</h3>
                    <div className="desc">
                      {rows.length} من {CUSTOMERS.length} عميلاً مطابقاً للفلاتر
                    </div>
                  </div>
                  <div className="card-head-tools">
                    <button type="button" className="btn btn-sm" onClick={() => exportCsv()}><IconDownload /> CSV</button>
                    <button type="button" className="btn btn-sm" onClick={() => printPdf()}><IconPrinter /> PDF</button>
                  </div>
                </div>
                <CustomerTable
                  rows={rows} model={model} loading={loading}
                  onReset={onReset} onView={setDrawer} onOffer={offer} onCall={call}
                />
              </div>
            </>
          )}

          {view === "predictions" && (
            <>
              <FilterBar filters={filters} onChange={onFilter} onReset={onReset} idPrefix="g" />
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>ملخّص القائمة المعروضة</h3>
                    <div className="desc">إحصاءات محسوبة من العملاء المطابقين للفلاتر الحالية</div>
                  </div>
                  <div className="card-head-tools">
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => go("home")}>
                      فتح تحليل عميل فردي
                    </button>
                  </div>
                </div>
                <div className="card-body"><ListSummary rows={rows} model={model} /></div>
              </div>
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>جميع العملاء المصنَّفين</h3>
                    <div className="desc">{rows.length} من {CUSTOMERS.length} عميلاً مطابقاً للفلاتر</div>
                  </div>
                  <div className="card-head-tools">
                    <button type="button" className="btn btn-sm" onClick={() => exportCsv()}><IconDownload /> تصدير CSV</button>
                  </div>
                </div>
                <CustomerTable
                  rows={rows} model={model} loading={loading}
                  onReset={onReset} onView={setDrawer} onOffer={offer} onCall={call}
                />
              </div>
            </>
          )}

          {view === "segments" && <SegmentsView model={model} />}

          {view === "alerts" && (
            <AlertsView
              onShowCustomers={(sev) => {
                setFilters((f) => ({ ...f, risk: sev === "low" ? "low" : "high" }));
                go("predictions");
              }}
              onAck={(title) => toast("تم الإقرار بالتنبيه", title)}
            />
          )}

          {view === "reports" && (
            <ReportsView
              onCsv={(highRiskOnly, title) => void exportCsv(highRiskOnly, title)}
              onPdf={(title) => printPdf(title)}
            />
          )}

          {view === "model" && <ModelView model={model} setModel={setModel} onToast={toast} />}
        </div>
      </div>

      {(railOpen || drawer) && (
        <div
          className="scrim"
          onClick={() => { setRailOpen(false); setDrawer(null); }}
        />
      )}

      <CustomerDrawer
        customer={drawer} model={model}
        onClose={() => setDrawer(null)} onOffer={offer} onCall={call}
      />

      <Toasts items={toasts} />
    </div>
  );
}
