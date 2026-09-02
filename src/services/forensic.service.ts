import {
  calculateThreatScore,
} from "../services/threat-score.service";

import type {
  ForensicEvent,
  IOCResult,
  Correlation,
  GeoLocation,
} from "../types/email";

export function buildForensicTimeline(
  iocs: IOCResult,
  geolocation: GeoLocation[],
  correlations: Correlation[]
): ForensicEvent[] {
  const now = new Date().toISOString();

  return [
    {
      timestamp: now,
      event: "email_ingested",
      description:
        "Raw email successfully entered the forensic analysis pipeline.",
    },

    {
      timestamp: now,
      event: "ioc_extraction",
      description:
        `Extracted ${iocs.ips.length} IP addresses, ${iocs.domains.length} domains and ${iocs.urls.length} URLs.`,
      metadata: {
        ipCount: iocs.ips.length,
        domainCount: iocs.domains.length,
        urlCount: iocs.urls.length,
      },
    },

    {
      timestamp: now,
      event: "relay_analysis",
      description:
        "Email relay infrastructure was reconstructed from Received headers.",
    },

    {
      timestamp: now,
      event: "geolocation_analysis",
      description:
        `Geolocation analysis performed on ${geolocation.length} IP addresses.`,
    },

    {
      timestamp: now,
      event: "infrastructure_correlation",
      description:
        correlations.length > 0
          ? `${correlations.length} relationship(s) found with previously observed indicators.`
          : "No previous infrastructure correlations found.",
      metadata: {
        correlationCount:
          correlations.length,
      },
    },

    {
      timestamp: now,
      event: "forensic_analysis_complete",
      description:
        "Email forensic intelligence generation completed.",
    },
  ];
}