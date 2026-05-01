import { NextResponse } from "next/server";
import { initial130kTargetPlan } from "@/data/initial130kPlan";
import { stockPresets } from "@/data/stockPresets";
import { importStocks, normalizeImportedStocks, setupTargetPlan } from "@/lib/importStocks";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { presetId?: string; mode?: "update" | "skip"; setup130k?: boolean };
    const preset = stockPresets.find((item) => item.id === body.presetId);
    if (!preset) {
      return NextResponse.json({ ok: false, message: "プリセットが見つかりません。" }, { status: 404 });
    }

    const { stocks, validation } = normalizeImportedStocks(preset.stocks);
    const hasErrors = validation.some((item) => item.errors.length > 0);
    if (hasErrors) {
      return NextResponse.json({ ok: false, validation, result: null }, { status: 400 });
    }

    const result = await importStocks(stocks, body.mode ?? "update");
    if (body.setup130k || preset.id === "initial-130k") {
      await setupTargetPlan(initial130kTargetPlan);
    }

    return NextResponse.json({ ok: true, validation, result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
