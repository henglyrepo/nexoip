import { headers } from "next/headers";
import { NextResponse } from "next/server";

const SAFE_HEADER_ALLOWLIST = [
  "accept",
  "accept-language",
  "cache-control",
  "cf-ray",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
];

export async function GET() {
  const h = await headers();
  const filtered = Object.fromEntries(
    SAFE_HEADER_ALLOWLIST.map((key) => [key, h.get(key)]).filter(
      ([, value]) => value !== null
    )
  );

  return NextResponse.json({ headers: filtered }, { status: 200 });
}
