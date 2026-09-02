import type { ParsedEmail } from "../types/email";

export type ThreatRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface ThreatScoreReason {
  signal: string;
  points: number;
  description: string;
}

export interface ThreatScoreResult {
  score: number;
  riskLevel: ThreatRiskLevel;
  reasons: ThreatScoreReason[];
}

export interface ThreatScoreInput {
  email: ParsedEmail;

  authentication: {
    spf: string[];
    dkim: string[];
    dmarc: string[];
    authenticationResults: string[];
  };

  iocs: {
    ips: string[];
    publicIps: string[];
    privateIps: string[];
    domains: string[];
    urls: string[];
  };

  correlations?: Array<{
    indicator: string;
    type: string;
    previousEmailId: number;
    relationship: string;
    severity: string;
  }>;
}

/**
 * Calculate an explainable forensic threat score.
 *
 * The score is deterministic.
 * External intelligence such as AbuseIPDB/VirusTotal
 * can be added later as additional scoring signals.
 */
export function calculateThreatScore(
  input: ThreatScoreInput
): ThreatScoreResult {
  let score = 0;

  const reasons: ThreatScoreReason[] = [];

  const addReason = (
    signal: string,
    points: number,
    description: string
  ) => {
    score += points;

    reasons.push({
      signal,
      points,
      description,
    });
  };

  // ============================================================
  // 1. SPF FAILURE
  // ============================================================

  const spfFailed = input.authentication.spf.some(
    (value) => value.toLowerCase() === "fail"
  );

  if (spfFailed) {
    addReason(
      "SPF failure",
      20,
      "The sending server failed SPF authentication."
    );
  }

  // ============================================================
  // 2. DKIM FAILURE
  // ============================================================

  const dkimFailed = input.authentication.dkim.some(
    (value) => value.toLowerCase() === "fail"
  );

  if (dkimFailed) {
    addReason(
      "DKIM failure",
      15,
      "The email failed DKIM authentication."
    );
  }

  // ============================================================
  // 3. DMARC FAILURE
  // ============================================================

  const dmarcFailed = input.authentication.dmarc.some(
    (value) => value.toLowerCase() === "fail"
  );

  if (dmarcFailed) {
    addReason(
      "DMARC failure",
      20,
      "The email failed DMARC authentication."
    );
  }

  // ============================================================
  // 4. REPLY-TO DOMAIN MISMATCH
  // ============================================================

  const sender = input.email.from ?? "";
  const replyTo = input.email.replyTo ?? "";

  const senderDomain = extractDomain(sender);
  const replyToDomain = extractDomain(replyTo);

  if (
    senderDomain &&
    replyToDomain &&
    senderDomain !== replyToDomain
  ) {
    addReason(
      "Reply-To domain mismatch",
      15,
      `The Reply-To domain (${replyToDomain}) differs from the sender domain (${senderDomain}).`
    );
  }

  // ============================================================
  // 5. RETURN-PATH DOMAIN MISMATCH
  // ============================================================

  const returnPath = input.email.returnPath ?? "";

  const returnPathDomain = extractDomain(returnPath);

  if (
    senderDomain &&
    returnPathDomain &&
    senderDomain !== returnPathDomain
  ) {
    addReason(
      "Return-Path domain mismatch",
      10,
      `The Return-Path domain (${returnPathDomain}) differs from the sender domain (${senderDomain}).`
    );
  }

  // ============================================================
  // 6. URL PRESENT
  // ============================================================

  if (input.iocs.urls.length > 0) {
    addReason(
      "URL detected",
      10,
      `The email contains ${input.iocs.urls.length} URL(s) that require investigation.`
    );
  }

  // ============================================================
  // 7. PUBLIC IP
  // ============================================================

  if (input.iocs.publicIps.length > 0) {
    addReason(
      "External infrastructure",
      5,
      `The email references ${input.iocs.publicIps.length} public IP address(es).`
    );
  }

  // ============================================================
  // 8. CORRELATION
  //
  // Do NOT automatically give every shared indicator HIGH risk.
  // Only correlations explicitly marked high/critical contribute.
  // ============================================================

  const highSeverityCorrelations =
    input.correlations?.filter(
      (correlation) =>
        correlation.severity.toLowerCase() === "high" ||
        correlation.severity.toLowerCase() === "critical"
    ) ?? [];

  if (highSeverityCorrelations.length > 0) {
    // Cap this signal so repeated duplicate emails cannot
    // artificially push the score above 100.
    const correlationPoints = Math.min(
      highSeverityCorrelations.length * 3,
      15
    );

    addReason(
      "Infrastructure correlation",
      correlationPoints,
      `${highSeverityCorrelations.length} high-severity shared indicator relationship(s) were found with previous emails.`
    );
  }

  // ============================================================
  // NORMALIZE
  // ============================================================

  score = Math.min(Math.max(score, 0), 100);

  // ============================================================
  // RISK LEVEL
  // ============================================================

  let riskLevel: ThreatRiskLevel;

  if (score >= 70) {
    riskLevel = "CRITICAL";
  } else if (score >= 50) {
    riskLevel = "HIGH";
  } else if (score >= 30) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return {
    score,
    riskLevel,
    reasons,
  };
}

// ============================================================
// HELPER
// ============================================================

function extractDomain(value: string): string | null {
  const normalized = value.trim();

  // Email format:
  // Name <user@example.com>
  // user@example.com

  const emailMatch = normalized.match(
    /@([^>\s]+)/i
  );

  if (!emailMatch) {
    return null;
  }

  return emailMatch[1].toLowerCase();
}