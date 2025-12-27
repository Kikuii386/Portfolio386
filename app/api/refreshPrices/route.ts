// app/api/refreshPrices/route.ts
import { refreshPrices } from "@/lib/refreshPrices";

// Ensure this route is always dynamic and not cached by Next.js
export const dynamic = "force-dynamic";
// Prefer a nearby region to reduce latency (optional; Vercel will ignore if unsupported)
export const preferredRegion = ["sin1"];
export const runtime = "nodejs";

type OldPrices = Record<string, number>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return json(
        { error: "bad-request", message: "Missing JSON body" },
        400,
      );

    const tokens = (body as any).tokens as Array<any>;
    const oldPrices = ((body as any).oldPrices || {}) as OldPrices;

    if (!Array.isArray(tokens)) {
      return json(
        { error: "bad-request", message: "`tokens` must be an array" },
        400,
      );
    }
    if (!oldPrices || typeof oldPrices !== "object") {
      return json(
        { error: "bad-request", message: "`oldPrices` must be an object" },
        400,
      );
    }

    const result = await refreshPrices(tokens, oldPrices);
    return json(result, 200);
  } catch (e: any) {
    console.error("[/api/refreshPrices] failed:", e);
    return json(
      { error: "refresh-failed", message: e?.message ?? "unknown" },
      500,
    );
  }
}

// Optional: provide a simple GET to sanity-check the route is alive
export async function GET() {
  return json(
    {
      ok: true,
      usage: "POST { tokens: EnrichedToken[], oldPrices: Record<string, number> }",
    },
    200,
  );
}