import { CUSTOMERS, PLANS, REGIONS, TENURE_BUCKETS } from "@/lib/data";
import { applyFilters, sortRows } from "@/lib/utils";
import type { ApiErrorResponse, ApiListResponse, Filters, SortKey, SortState } from "@/types";
import type { NextRequest } from "next/server";

/**
 * GET /api/customers
 *
 * معاملات الاستعلام كلها اختيارية:
 *   region, plan, risk (high|mid|low), tenure (t1..t4), sort, dir (asc|desc)
 *
 * كل قيمة تُتحقَّق مقابل قائمة مسموح بها على الخادم. المبدأ التدريبي هنا:
 * لا تُفترض صلاحية أي مُدخل لأن الواجهة تُقيّده — الواجهة قابلة للتجاوز.
 */

const RISKS = ["high", "mid", "low"] as const;
const DIRS = ["asc", "desc"] as const;
const SORT_KEYS = ["id", "plan", "region", "bill", "prob", "reason", "action"] as const;
const TENURE_IDS = TENURE_BUCKETS.map((t) => t.id);

/** يتحقّق من قيمة واحدة مقابل قائمة مسموح بها. يُرجع خطأً بدل رميه. */
function pick(
  value: string | null,
  allowed: readonly string[],
  field: string
): { ok: true; value: string } | { ok: false; error: ApiErrorResponse } {
  if (!value) return { ok: true, value: "" };
  if (!allowed.includes(value)) {
    return {
      ok: false,
      error: { error: `قيمة غير مسموح بها للحقل "${field}": ${value}`, allowed },
    };
  }
  return { ok: true, value };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;

  const checks = [
    pick(q.get("region"), REGIONS, "region"),
    pick(q.get("plan"), PLANS, "plan"),
    pick(q.get("risk"), RISKS, "risk"),
    pick(q.get("tenure"), TENURE_IDS, "tenure"),
    pick(q.get("sort"), SORT_KEYS, "sort"),
    pick(q.get("dir"), DIRS, "dir"),
  ];

  for (const c of checks) {
    if (!c.ok) return Response.json(c.error, { status: 400 });
  }

  const [region, plan, risk, tenure, sort, dir] = checks.map((c) =>
    c.ok ? c.value : ""
  );

  const filters: Filters = { region, plan, risk, tenure };
  const sortState: SortState = {
    key: (sort || "prob") as SortKey,
    dir: (dir || "desc") as SortState["dir"],
  };

  const data = sortRows(applyFilters(CUSTOMERS, filters), sortState);

  const body: ApiListResponse = { count: data.length, synthetic: true, data };
  return Response.json(body, {
    headers: { "cache-control": "no-store" },
  });
}
