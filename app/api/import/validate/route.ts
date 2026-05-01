import { NextResponse } from "next/server";
import { normalizeImportedStocks, parseImportText } from "@/lib/importStocks";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const rows = parseImportText(body.text ?? "");
    const { stocks, validation } = normalizeImportedStocks(rows);
    return NextResponse.json({ ok: true, stocks, validation });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error), stocks: [], validation: [] },
      { status: 400 }
    );
  }
}
