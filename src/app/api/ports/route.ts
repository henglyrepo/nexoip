import net from "node:net";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getBestEffortIpFromHeaders, isLikelyPublicIp } from "@/lib/net/ip";

export const runtime = "nodejs";

const COMMON_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 465, 587, 993, 995, 1723, 3306,
  3389, 5432, 5900, 8080, 8443,
];

async function checkPort(ip: string, port: number, timeoutMs: number) {
  return await new Promise<{ port: number; open: boolean; error?: string }>(
    (resolve) => {
      const socket = new net.Socket();
      let done = false;

      const finish = (open: boolean, error?: string) => {
        if (done) return;
        done = true;
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        resolve({ port, open, error });
      };

      socket.setTimeout(timeoutMs);

      socket.once("connect", () => finish(true));
      socket.once("timeout", () => finish(false, "timeout"));
      socket.once("error", (err) => finish(false, err.message));

      socket.connect(port, ip);
    }
  );
}

export async function GET() {
  const h = await headers();
  const ip = getBestEffortIpFromHeaders(h);

  if (!ip || !isLikelyPublicIp(ip)) {
    return NextResponse.json(
      {
        error:
          "Unable to detect a public client IP from this request (local/dev traffic often shows ::1).",
      },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const timeoutMs = 650;

  // Limit concurrency to avoid spiky resource usage.
  const concurrency = 6;
  const results: Array<{ port: number; open: boolean; error?: string }> = [];
  for (let i = 0; i < COMMON_PORTS.length; i += concurrency) {
    const chunk = COMMON_PORTS.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((port) => checkPort(ip, port, timeoutMs))
    );
    results.push(...chunkResults);
  }

  const opened = results.filter((r) => r.open).map((r) => r.port);

  return NextResponse.json(
    {
      ip,
      portsScanned: COMMON_PORTS,
      opened,
      results,
      note:
        "This runs a TCP connect check from our server to your public IP. NAT/firewalls can affect results.",
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
}
