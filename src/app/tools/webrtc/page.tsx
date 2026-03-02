"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataValue } from "@/components/ui/data-value";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicIpInfo } from "@/components/ip/usePublicIpInfo";

type CandidateHit = {
  ip: string;
  typ: string;
  raw: string;
};

function parseCandidate(candidate: string): CandidateHit[] {
  const hits: CandidateHit[] = [];
  const typ = candidate.match(/\btyp\s+(host|srflx|relay|prflx)\b/i)?.[1] ?? "unknown";

  // IPv4
  const v4 = candidate.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/g) ?? [];
  for (const ip of v4) hits.push({ ip, typ, raw: candidate });

  // Basic IPv6 match (best-effort)
  const v6 = candidate.match(/\b([0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7})\b/gi);
  if (v6) {
    for (const ip of v6) {
      if (ip.includes("::") || ip.includes(":")) hits.push({ ip, typ, raw: candidate });
    }
  }

  return hits;
}

export default function WebrtcToolPage() {
  const publicInfo = usePublicIpInfo();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateHit[]>([]);

  const candidateIps = useMemo(() => {
    const seen = new Set<string>();
    const out: CandidateHit[] = [];
    for (const c of candidates) {
      const key = `${c.ip}|${c.typ}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }, [candidates]);

  async function run() {
    setRunning(true);
    setError(null);
    setCandidates([]);

    try {
      if (typeof RTCPeerConnection === "undefined") {
        throw new Error("WebRTC not available in this browser");
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.createDataChannel("nexo");
      pc.onicecandidate = (e) => {
        if (!e.candidate?.candidate) return;
        const parsed = parseCandidate(e.candidate.candidate);
        setCandidates((prev) => prev.concat(parsed));
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
      await pc.setLocalDescription(offer);

      await new Promise((r) => setTimeout(r, 3000));
      pc.close();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to run WebRTC check");
    } finally {
      setRunning(false);
    }
  }

  const publicIp = publicInfo.ip;
  const leaksPublic = publicIp
    ? candidateIps.some((c) => c.ip === publicIp && (c.typ === "srflx" || c.typ === "host"))
    : false;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight nexo-animate-in">WebRTC Leak Check</h1>
      <p className="mt-2 text-muted-foreground">
        Checks whether your browser exposes IP addresses via WebRTC ICE candidates.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 nexo-animate-in" style={{ animationDelay: "90ms" }}>
        <Button onClick={run} disabled={running}>
          {running ? "Running..." : "Run check"}
        </Button>
      </div>

      <Card className="mt-6 nexo-animate-in" style={{ animationDelay: "140ms" }}>
        <CardHeader>
          <CardTitle>Public IP (baseline)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div>
            <span className="font-medium">IP:</span>{" "}
            {publicIp ? (
              <DataValue value={publicIp} copyText={publicIp} monospace />
            ) : publicInfo.loading ? (
              <Skeleton className="inline-block h-5 w-36 align-middle" />
            ) : (
              "Unavailable"
            )}
          </div>
          <div className="mt-2 text-muted-foreground">
            Source:{" "}
            {publicInfo.source ? (
              <DataValue value={publicInfo.source} copyText={publicInfo.source} />
            ) : (
              "-"
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 nexo-animate-in" style={{ animationDelay: "190ms" }}>
        <CardHeader>
          <CardTitle>ICE Candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {error ? <div className="text-destructive">{error}</div> : null}
          {candidateIps.length === 0 ? (
            <div className="text-muted-foreground">Run the check to collect candidates.</div>
          ) : (
            <div className="space-y-1">
              {candidateIps.map((c, idx) => (
                <div key={`${c.ip}-${c.typ}-${idx}`}>
                  <DataValue value={c.ip} copyText={c.ip} monospace className="font-medium" />{" "}
                  <span className="text-muted-foreground">({c.typ})</span>
                </div>
              ))}
            </div>
          )}

          {candidateIps.length > 0 ? (
            <div className="pt-3 text-muted-foreground">
              {publicIp
                ? leaksPublic
                  ? "Your public IP appears in WebRTC candidates. If you expected it to be hidden (e.g. VPN), consider disabling WebRTC or using a VPN/browser that prevents leaks."
                  : "Your public IP did not appear in the collected candidates (best-effort check)."
                : "Public IP baseline unavailable; interpretation is limited."}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
