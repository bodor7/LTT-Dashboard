/** مستوى الخطر المشتق من احتمال المغادرة. */
export type RiskLevel = "high" | "mid" | "low";

/** عميل اصطناعي — لا يمثّل أي مشترك حقيقي. */
export type Customer = {
  id: string;
  plan: PlanName;
  region: string;
  /** متوسط الفاتورة الشهرية بالدينار الليبي. */
  bill: number;
  /** احتمال المغادرة بين 0 و 1. */
  prob: number;
  /** مدة الاشتراك بالأشهر. */
  tenure: number;
  /** متوسط الاستهلاك الشهري بالجيجابايت. */
  usage: number;
  complaints: number;
  reason: string;
  action: string;
};

export type PlanName =
  | "فايبر 100"
  | "فايبر 50"
  | "VDSL 30"
  | "ADSL 8"
  | "4G LTE"
  | "FWA";

export type RangeId = "d7" | "d30" | "m3" | "m6" | "m12";

export type TenureBucketId = "t1" | "t2" | "t3" | "t4";

export type TenureBucket = {
  id: TenureBucketId;
  label: string;
  min: number;
  max: number;
};

export type Kpi = {
  total: string;
  risk: string;
  rate: string;
  rev: string;
  dRisk: string;
  dRate: string;
  dRev: string;
};

export type RiskSegment = {
  k: RiskLevel;
  label: string;
  value: number;
  color: string;
  count: string;
};

export type Filters = {
  region: string;
  plan: string;
  tenure: string;
  risk: string;
};

export type SortKey = keyof Pick<
  Customer,
  "id" | "plan" | "region" | "bill" | "prob" | "reason" | "action"
>;

export type SortState = { key: SortKey; dir: "asc" | "desc" };

/** عامل واحد من العوامل المفسِّرة لتنبؤ النموذج. */
export type Factor = {
  /** اسم العامل. */
  n: string;
  /** وزنه بالنقاط — سالب يعني أنه يقلّل الاحتمال. */
  w: number;
  /** شرح مختصر يوضّح مصدر الوزن. */
  d: string;
};

export type PredictionInput = {
  id: string;
  plan: PlanName;
  tenure: number;
  usage: number;
  complaints: number;
  bill: number;
  /** عدد الأيام منذ آخر تواصل مع الدعم، أو null إن لم يُسجَّل. */
  daysSince: number | null;
};

export type Prediction = {
  score: number;
  level: RiskLevel;
  top: Factor[];
  action: string;
  /** أعلى وزن بين العوامل الظاهرة — يُستخدم لتحجيم الأشرطة. */
  mx: number;
};

/** عتبات التصنيف والعوامل المفعَّلة — قابلة للتعديل من صفحة إعدادات النموذج. */
export type ModelConfig = {
  thHigh: number;
  thMid: number;
  useComplaints: boolean;
  useUsage: boolean;
  useBilling: boolean;
  useSupport: boolean;
};

export type ApiListResponse = {
  count: number;
  synthetic: true;
  data: Customer[];
};

export type ApiErrorResponse = {
  error: string;
  allowed?: readonly string[];
};
