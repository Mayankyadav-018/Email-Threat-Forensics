import type {
  IOCResult,
  ParsedEmail,
} from "../types/email";

const IPV4_REGEX =
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

const URL_REGEX =
  /\bhttps?:\/\/[^\s<>"']+/gi;

const DOMAIN_REGEX =
  /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;

function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    const n = Number(part);
    return (
      Number.isInteger(n) &&
      n >= 0 &&
      n <= 255
    );
  });
}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip
    .split(".")
    .map(Number);

  if (a === 10) return true;

  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  if (a === 127) return true;

  return false;
}

function cleanUrl(url: string): string {
  return url.replace(/[),.;]+$/, "");
}

export function extractIOCs(
  email: ParsedEmail
): IOCResult {
  const combinedText = [
    email.from ?? "",
    email.to ?? "",
    email.subject ?? "",
    email.replyTo ?? "",
    email.returnPath ?? "",
    email.text ?? "",
    email.html ?? "",
    ...email.received,
  ].join("\n");

  const rawIPs =
    combinedText.match(IPV4_REGEX) ?? [];

  const ips = [
    ...new Set(
      rawIPs.filter(isValidIPv4)
    ),
  ];

  const privateIps = ips.filter(
    isPrivateIPv4
  );

  const publicIps = ips.filter(
    (ip) => !isPrivateIPv4(ip)
  );

  const rawUrls =
    combinedText.match(URL_REGEX) ?? [];

  const urls = [
    ...new Set(
      rawUrls.map(cleanUrl)
    ),
  ];

  const rawDomains =
    combinedText.match(DOMAIN_REGEX) ?? [];

  const domains = [
    ...new Set(
      rawDomains
        .map((x) =>
          x.toLowerCase()
        )
        .filter(
          (domain) =>
            !domain.match(
              /^\d+\.\d+\.\d+\.\d+$/
            )
        )
    ),
  ];

  return {
    ips,
    publicIps,
    privateIps,
    domains,
    urls,
  };
}