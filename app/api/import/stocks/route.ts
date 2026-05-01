import { NextResponse } from "next/server";
import { importStocks, normalizeImportedStocks, parseImportText } from "@/lib/importStocks";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; mode?: "update" | "skip" };
    const rows = parseImportText(body.text ?? "");
    const { stocks, validation } = normalizeImportedStocks(rows);
    const hasErrors = validation.some((item) => item.errors.length > 0);

    if (hasErrors) {
      return NextResponse.json({ ok: false, validation, result: null }, { status: 400 });
    }

    const result = await importStocks(stocks, body.mode ?? "skip");
    return NextResponse.json({ ok: true, validation, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error), validation: [], result: null },
      { status: 500 }
    );
  }
}
