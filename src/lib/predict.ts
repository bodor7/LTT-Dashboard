/**
 * نموذج تنبؤ تفسيري مبسَّط لأغراض التدريب.
 *
 * الأوزان ثابتة ومكتوبة صراحة حتى يستطيع المتدرّب أن يتبع كل نقطة في النتيجة
 * إلى سببها. هذا ليس نموذجاً مدرَّباً على بيانات حقيقية، والغرض منه أن يكون
 * قابلاً للشرح لا أن يكون دقيقاً.
 */
import type {
  Factor,
  ModelConfig,
  PlanName,
  Prediction,
  PredictionInput,
  RiskLevel,
} from "@/types";

/** وزن طبيعة الباقة — سالب يعني باقة أكثر استقراراً. */
const PLAN_WEIGHT: Record<PlanName, number> = {
  "فايبر 100": -2,
  "فايبر 50": -1,
  "VDSL 30": 1,
  "ADSL 8": 6,
  "4G LTE": 3,
  FWA: 4,
};

export const DEFAULT_MODEL: ModelConfig = {
  thHigh: 70,
  thMid: 40,
  useComplaints: true,
  useUsage: true,
  useBilling: true,
  useSupport: true,
};

/** إجراء الاحتفاظ المقترح لكل عامل خطر رئيسي. */
const ACTION_BY_FACTOR: Record<string, string> = {
  "عدد الشكاوى المسجَّلة": "اتصال من فريق الاحتفاظ خلال 24 ساعة + تعويض عن فترة التعطل",
  "استهلاك بيانات منخفض جداً": "باقة بيانات مخصصة بخصم 25% مع هدية 20 جيجابايت",
  "استهلاك بيانات منخفض": "عرض حزمة محتوى مجانية لتنشيط الاستخدام",
  "قيمة فاتورة مرتفعة": "مراجعة الفاتورة واقتراح خطة أوفر بنفس السرعة",
  "قيمة فاتورة متوسطة-مرتفعة": "خصم ولاء 15% لمدة 6 أشهر",
  "اشتراك حديث جداً": "مكالمة ترحيب وشرح مزايا الباقة + دعم إعداد مجاني",
  "اشتراك قصير المدة": "عرض تجديد مبكر بسعر مثبَّت لسنة كاملة",
  "تواصل حديث مع الدعم": "متابعة تذكرة الدعم حتى الإغلاق وتأكيد رضا العميل",
  "تواصل مع الدعم خلال شهر": "استبيان رضا قصير + متابعة من مشرف الخدمة",
};

const NO_ACTION = "لا يوجد إجراء عاجل — يُنصح بالمراقبة الدورية فقط";
const FALLBACK_ACTION = "متابعة دورية من فريق الاحتفاظ";

/** النقطة التي يبدأ منها كل عميل قبل إضافة أوزان العوامل. */
const BASE_SCORE = 12;

export function riskOf(prob: number, model: ModelConfig = DEFAULT_MODEL): RiskLevel {
  const pct = prob <= 1 ? prob * 100 : prob;
  if (pct >= model.thHigh) return "high";
  if (pct >= model.thMid) return "mid";
  return "low";
}

export function predict(
  v: PredictionInput,
  model: ModelConfig = DEFAULT_MODEL
): Prediction {
  const f: Factor[] = [];

  if (model.useComplaints && v.complaints > 0) {
    f.push({
      n: "عدد الشكاوى المسجَّلة",
      w: Math.min(30, v.complaints * 9),
      d: `${v.complaints} شكوى خلال آخر 6 أشهر`,
    });
  }

  if (v.tenure < 6) {
    f.push({ n: "اشتراك حديث جداً", w: 14, d: `${v.tenure} شهراً فقط — فترة عدم استقرار` });
  } else if (v.tenure < 12) {
    f.push({ n: "اشتراك قصير المدة", w: 8, d: `${v.tenure} شهراً — أقل من سنة` });
  } else if (v.tenure > 36) {
    f.push({ n: "ولاء طويل المدة", w: -8, d: `${v.tenure} شهراً — عامل استقرار` });
  }

  if (model.useUsage) {
    if (v.usage < 5) {
      f.push({ n: "استهلاك بيانات منخفض جداً", w: 18, d: `${v.usage} جيجابايت شهرياً — مؤشر خمول` });
    } else if (v.usage < 20) {
      f.push({ n: "استهلاك بيانات منخفض", w: 10, d: `${v.usage} جيجابايت شهرياً` });
    } else if (v.usage > 100) {
      f.push({ n: "استهلاك مرتفع ومنتظم", w: -6, d: `${v.usage} جيجابايت شهرياً — اعتماد قوي` });
    }
  }

  if (model.useBilling) {
    if (v.bill > 150) {
      f.push({ n: "قيمة فاتورة مرتفعة", w: 12, d: `${v.bill} د.ل شهرياً — حساسية للسعر` });
    } else if (v.bill > 100) {
      f.push({ n: "قيمة فاتورة متوسطة-مرتفعة", w: 6, d: `${v.bill} د.ل شهرياً` });
    }
  }

  if (model.useSupport && v.daysSince != null) {
    if (v.daysSince <= 14) {
      f.push({ n: "تواصل حديث مع الدعم", w: 10, d: `منذ ${v.daysSince} يوماً` });
    } else if (v.daysSince <= 30) {
      f.push({ n: "تواصل مع الدعم خلال شهر", w: 5, d: `منذ ${v.daysSince} يوماً` });
    }
  }

  const planWeight = PLAN_WEIGHT[v.plan] ?? 0;
  if (planWeight) {
    f.push({
      n: `طبيعة الباقة (${v.plan})`,
      w: planWeight,
      d: planWeight > 0 ? "باقة ذات معدل مغادرة أعلى" : "باقة ذات معدل مغادرة أقل",
    });
  }

  const raw = BASE_SCORE + f.reduce((s, x) => s + x.w, 0);
  const score = Math.max(2, Math.min(97, raw));
  const top = f.filter((x) => x.w > 0).sort((a, b) => b.w - a.w).slice(0, 4);

  return {
    score,
    level: riskOf(score, model),
    top,
    action: top.length ? (ACTION_BY_FACTOR[top[0].n] ?? FALLBACK_ACTION) : NO_ACTION,
    mx: Math.max(1, ...top.map((x) => x.w)),
  };
}

/** عدد الأيام بين تاريخ التواصل والتاريخ المرجعي، أو null لمُدخل فارغ/غير صالح. */
export function daysSince(dateStr: string, asOf: string): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = new Date(asOf).getTime();
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.max(0, Math.round((now - then) / 86_400_000));
}
