/**
 * بيانات تدريبية اصطناعية بالكامل.
 * لا تحتوي على أرقام مشتركين حقيقية أو أسماء عملاء أو سجلات استخدام فعلية،
 * التزاماً بقاعدة "بيانات اصطناعية فقط" في مهارة التدريب.
 */
import type {
  Customer,
  Kpi,
  PlanName,
  RangeId,
  RiskSegment,
  TenureBucket,
} from "@/types";

/** تاريخ مرجعي ثابت حتى تبقى الحسابات والتنبؤات قابلة للتكرار. */
export const AS_OF = "2026-08-19";

export const MONTHS = [
  "سبتمبر 2025",
  "أكتوبر 2025",
  "نوفمبر 2025",
  "ديسمبر 2025",
  "يناير 2026",
  "فبراير 2026",
  "مارس 2026",
  "أبريل 2026",
  "مايو 2026",
  "يونيو 2026",
  "يوليو 2026",
  "أغسطس 2026",
] as const;

/** معدل المغادرة الفعلي لكل شهر (%). */
export const ACTUAL = [7.9, 8.1, 7.6, 7.8, 7.4, 7.2, 7.5, 7.1, 6.8, 7.0, 6.7, 6.9];
/** معدل المغادرة المتوقع من النموذج لكل شهر (%). */
export const PREDICTED = [8.0, 7.9, 7.7, 7.6, 7.5, 7.3, 7.3, 7.0, 6.9, 6.8, 6.8, 6.9];

export const RANGES: { id: RangeId; label: string; months: number; d: string }[] = [
  { id: "d7", label: "آخر 7 أيام", months: 1, d: "مقارنة يومية مجمّعة" },
  { id: "d30", label: "آخر 30 يوماً", months: 2, d: "الشهر الحالي والسابق" },
  { id: "m3", label: "آخر 3 أشهر", months: 3, d: "الربع الحالي" },
  { id: "m6", label: "آخر 6 أشهر", months: 6, d: "نصف سنوي" },
  { id: "m12", label: "آخر 12 شهراً", months: 12, d: "سنة كاملة — الافتراضي" },
];

export const KPIS: Record<RangeId, Kpi> = {
  d7:  { total: "1,250,000", risk: "21,180", rate: "6.7%", rev: "1.2 مليون د.ل", dRisk: "+1.1%", dRate: "-0.2%", dRev: "+0.4%" },
  d30: { total: "1,250,000", risk: "38,940", rate: "6.8%", rev: "2.1 مليون د.ل", dRisk: "+2.4%", dRate: "-0.3%", dRev: "+1.2%" },
  m3:  { total: "1,248,300", risk: "57,610", rate: "6.8%", rev: "3.2 مليون د.ل", dRisk: "+3.1%", dRate: "-0.5%", dRev: "+2.0%" },
  m6:  { total: "1,244,900", risk: "71,250", rate: "7.0%", rev: "4.0 مليون د.ل", dRisk: "+3.8%", dRate: "-0.6%", dRev: "+2.6%" },
  m12: { total: "1,250,000", risk: "86,420", rate: "6.9%", rev: "4.8 مليون د.ل", dRisk: "+4.2%", dRate: "-0.8%", dRev: "+3.4%" },
};

/** الشرائح الثلاث ونِسَبها كما وردت في مواصفة المشروع. */
export const RISK_SEGMENTS: RiskSegment[] = [
  { k: "high", label: "خطر مرتفع", value: 18, color: "var(--critical)", count: "155,556" },
  { k: "mid",  label: "خطر متوسط", value: 27, color: "var(--warning)",  count: "233,334" },
  { k: "low",  label: "خطر منخفض", value: 55, color: "var(--good)",     count: "687,500" },
];

/** وزن كل سبب في تفسير تنبؤات النموذج (%). */
export const REASONS = [
  { label: "انخفاض استخدام البيانات", value: 32 },
  { label: "شكاوى خدمة العملاء", value: 26 },
  { label: "ارتفاع الفاتورة", value: 19 },
  { label: "ضعف التغطية", value: 14 },
  { label: "انتهاء الباقة", value: 9 },
];

export const PLANS: PlanName[] = ["فايبر 100", "فايبر 50", "VDSL 30", "ADSL 8", "4G LTE", "FWA"];

export const REGIONS = [
  "طرابلس", "بنغازي", "مصراتة", "سبها", "الزاوية",
  "درنة", "البيضاء", "سرت", "طبرق", "الخمس",
];

export const TENURE_BUCKETS: TenureBucket[] = [
  { id: "t1", label: "أقل من 6 أشهر", min: 0, max: 5 },
  { id: "t2", label: "من 6 إلى 12 شهراً", min: 6, max: 12 },
  { id: "t3", label: "من سنة إلى 3 سنوات", min: 13, max: 36 },
  { id: "t4", label: "أكثر من 3 سنوات", min: 37, max: 999 },
];

export const CUSTOMERS: Customer[] = [
  { id: "LTT-8842391", plan: "فايبر 100", region: "طرابلس", bill: 185, prob: 0.92, tenure: 9,  usage: 64,  complaints: 5, reason: "شكاوى خدمة العملاء",      action: "ترقية مجانية 3 أشهر + متابعة مباشرة" },
  { id: "LTT-7391044", plan: "4G LTE",    region: "بنغازي", bill: 65,  prob: 0.88, tenure: 4,  usage: 3,   complaints: 2, reason: "انخفاض استخدام البيانات", action: "باقة بيانات مخصصة بخصم 25%" },
  { id: "LTT-9120556", plan: "VDSL 30",   region: "مصراتة", bill: 120, prob: 0.85, tenure: 14, usage: 41,  complaints: 4, reason: "ضعف التغطية",             action: "زيارة فنية عاجلة + تعويض شهر" },
  { id: "LTT-6634871", plan: "ADSL 8",    region: "سبها",   bill: 45,  prob: 0.81, tenure: 52, usage: 12,  complaints: 3, reason: "ارتفاع الفاتورة",         action: "مراجعة الفاتورة واقتراح خطة أوفر" },
  { id: "LTT-8047123", plan: "فايبر 50",  region: "الزاوية", bill: 140, prob: 0.76, tenure: 11, usage: 78,  complaints: 1, reason: "انتهاء الباقة",           action: "تجديد مبكر بسعر مثبَّت لسنة" },
  { id: "LTT-7758290", plan: "FWA",       region: "درنة",   bill: 95,  prob: 0.72, tenure: 7,  usage: 28,  complaints: 4, reason: "شكاوى خدمة العملاء",      action: "اتصال من فريق الاحتفاظ خلال 24 ساعة" },
  { id: "LTT-9903417", plan: "4G LTE",    region: "البيضاء", bill: 55,  prob: 0.68, tenure: 3,  usage: 2,   complaints: 0, reason: "انخفاض استخدام البيانات", action: "هدية 20 جيجابايت لمدة شهر" },
  { id: "LTT-6212845", plan: "فايبر 100", region: "طرابلس", bill: 210, prob: 0.61, tenure: 29, usage: 132, complaints: 1, reason: "ارتفاع الفاتورة",         action: "خصم ولاء 15% لمدة 6 أشهر" },
  { id: "LTT-8590132", plan: "VDSL 30",   region: "سرت",    bill: 110, prob: 0.54, tenure: 18, usage: 37,  complaints: 2, reason: "ضعف التغطية",             action: "ترقية الموزع المحلي وإشعار العميل" },
  { id: "LTT-7044968", plan: "ADSL 8",    region: "طبرق",   bill: 40,  prob: 0.47, tenure: 61, usage: 9,   complaints: 1, reason: "انتهاء الباقة",           action: "تذكير تجديد مع خصم 10%" },
  { id: "LTT-9471203", plan: "فايبر 50",  region: "الخمس",  bill: 135, prob: 0.38, tenure: 23, usage: 88,  complaints: 0, reason: "انخفاض استخدام البيانات", action: "استبيان رضا + عرض حزمة محتوى" },
  { id: "LTT-6885574", plan: "4G LTE",    region: "مصراتة", bill: 70,  prob: 0.31, tenure: 16, usage: 24,  complaints: 2, reason: "شكاوى خدمة العملاء",      action: "متابعة تذكرة الدعم حتى الإغلاق" },
  { id: "LTT-8126790", plan: "فايبر 100", region: "بنغازي", bill: 195, prob: 0.24, tenure: 44, usage: 150, complaints: 0, reason: "ارتفاع الفاتورة",         action: "عرض حزمة ترفيه مجانية" },
  { id: "LTT-7503318", plan: "FWA",       region: "الزاوية", bill: 88,  prob: 0.16, tenure: 38, usage: 33,  complaints: 0, reason: "انتهاء الباقة",           action: "لا يوجد إجراء عاجل — مراقبة دورية" },
];
