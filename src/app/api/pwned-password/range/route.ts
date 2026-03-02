import { NextRequest, NextResponse } from "next/server";

function isValidPrefix(prefix: string): boolean {
  return /^[0-9a-fA-F]{5}$/.test(prefix);
}

export async function GET(req: NextRequest) {
  const prefixRaw = (req.nextUrl.searchParams.get("prefix") || "").trim();
  if (!isValidPrefix(prefixRaw)) {
    return NextResponse.json(
      { error: "Invalid prefix. Use 5 hex characters." },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const prefix = prefixRaw.toUpperCase();

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(
      `https://api.pwnedpasswords.com/range/${encodeURIComponent(prefix)}`,
      {
        cache: "no-store",
        headers: {
          "Add-Padding": "true",
          "User-Agent": "NEXO",
          accept: "text/plain",
        },
        signal: controller.signal,
      }
    );

    if (!r.ok) {
      return NextResponse.json(
        { error: "Upstream unavailable" },
        { status: 502, headers: { "cache-control": "no-store" } }
      );
    }

    const text = await r.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  } finally {
    clearTimeout(t);
  }
}
