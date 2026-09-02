import type { Env } from "../lib/supabase";

export interface ThreatIntelResult {
  indicator: string;
  type: "ip" | "domain" | "url";

  sources: Array<{
    source: string;
    status: string;
    score?: number | null;
    malicious?: boolean | null;
  }>;
}

export async function checkIPReputation(
  ip: string,
  env: Env
): Promise<ThreatIntelResult> {
  const sources: ThreatIntelResult["sources"] = [];

  if (env.ABUSEIPDB_API_KEY) {
    try {
      const response = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}`,
        {
          headers: {
            Key: env.ABUSEIPDB_API_KEY,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const json =
          (await response.json()) as any;

        const score =
          json?.data?.abuseConfidenceScore;

        sources.push({
          source: "AbuseIPDB",
          status: "success",
          score:
            typeof score === "number"
              ? score
              : null,
          malicious:
            typeof score === "number"
              ? score >= 50
              : null,
        });
      }
    } catch {
      sources.push({
        source: "AbuseIPDB",
        status: "error",
      });
    }
  }

  if (!env.ABUSEIPDB_API_KEY) {
    sources.push({
      source: "AbuseIPDB",
      status: "not_configured",
    });
  }

  return {
    indicator: ip,
    type: "ip",
    sources,
  };
}