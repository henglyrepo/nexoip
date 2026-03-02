import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  getBestEffortIpFromHeaders,
  isLikelyPublicIp,
  normalizeIp,
} from "@/lib/net/ip";

export async function GET() {
  const h = await headers();
  const ip = getBestEffortIpFromHeaders(h);
  const normalized = normalizeIp(ip);

  return NextResponse.json(
    {
      ip: normalized,
      isPublicIp: isLikelyPublicIp(normalized),
      country:
        h.get("cf-ipcountry") ??
        h.get("x-vercel-ip-country") ??
        h.get("x-country") ??
        null,
      region: h.get("x-vercel-ip-country-region") ?? null,
      city: h.get("x-vercel-ip-city") ?? null,
      timezone: h.get("x-vercel-ip-timezone") ?? null,
      userAgent: h.get("user-agent"),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}
