import { NextResponse } from "next/server";

import { getLatestUsdRates } from "@/lib/currency";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rates = await getLatestUsdRates();
  return NextResponse.json({ ok: true, currencies: Object.keys(rates).length });
}
