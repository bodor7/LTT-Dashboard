import { Sparkline } from "@/components/Charts";
import { IconAlert, IconArrowDown, IconArrowUp, IconTarget, IconTrendDown, IconUsers } from "@/components/icons";
import { KPIS } from "@/lib/data";
import type { RangeId } from "@/types";

type Tone = "" | "is-warning" | "is-positive" | "is-danger";

/**
 * اتجاه الدلتا دلالي لا حسابي: ارتفاع العملاء المعرَّضين للمغادرة خبر سيئ
 * ويُعرض بالأحمر، وانخفاض معدل المغادرة خبر جيد ويُعرض بالأخضر.
 */
export function Kpis({ range }: { range: RangeId }) {
  const k = KPIS[range];

  const cards: {
    t: string; v: string; tone: Tone; Ico: typeof IconUsers;
    d?: string; bad?: boolean; foot: string; spark?: [string, number[]];
  }[] = [
    { t: "إجمالي العملاء", v: k.total, tone: "", Ico: IconUsers, foot: "مشترك نشط عبر جميع الباقات" },
    { t: "العملاء المعرضون للمغادرة", v: k.risk, tone: "is-warning", Ico: IconAlert, d: k.dRisk, bad: true, foot: "مقارنة بالفترة السابقة", spark: ["var(--warning)", [62, 66, 71, 74, 79, 86]] },
    { t: "معدل المغادرة المتوقع", v: k.rate, tone: "is-positive", Ico: IconTarget, d: k.dRate, bad: false, foot: "مقارنة بالفترة السابقة", spark: ["var(--good)", [7.9, 7.6, 7.4, 7.2, 7.0, 6.9]] },
    { t: "الإيراد المعرَّض للخطر", v: k.rev, tone: "is-danger", Ico: IconTrendDown, d: k.dRev, bad: true, foot: "قيمة الاشتراكات السنوية المهددة", spark: ["var(--critical)", [3.1, 3.5, 3.8, 4.1, 4.5, 4.8]] },
  ];

  return (
    <div className="grid g-kpi">
      {cards.map(({ t, v, tone, Ico, d, bad, foot, spark }) => (
        <div className={`card kpi ${tone}`} key={t}>
          <div className="kpi-top">
            <div className="kpi-ico"><Ico /></div>
            <div className="kpi-title">{t}</div>
          </div>
          <div className="kpi-val num">{v}</div>
          <div className="kpi-foot">
            {d && (
              <span className={`delta ${bad ? "up-bad" : "down-good"}`}>
                {d.startsWith("-") ? <IconArrowDown /> : <IconArrowUp />}
                {d}
              </span>
            )}
            <span>{foot}</span>
          </div>
          {spark && <Sparkline values={spark[1]} color={spark[0]} />}
        </div>
      ))}
    </div>
  );
}
