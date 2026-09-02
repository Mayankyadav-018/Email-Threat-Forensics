import PostalMime from "postal-mime";

import type {
  ParsedEmail,
  RelayHop,
} from "../types/email";

function headerValues(
  headers: Array<{ key: string; value: string }>,
  name: string
): string[] {
  return headers
    .filter(
      (h) =>
        h.key.toLowerCase() ===
        name.toLowerCase()
    )
    .map((h) => h.value);
}

function firstHeader(
  headers: Array<{ key: string; value: string }>,
  name: string
): string | null {
  return (
    headerValues(headers, name)[0] ?? null
  );
}

/**
 * Extract a specific authentication result
 * from Authentication-Results headers.
 *
 * Example:
 * mx.example.com; spf=fail; dkim=fail; dmarc=fail
 *
 * Returns:
 * dkim=fail
 * dmarc=fail
 */
function extractAuthResults(
  authenticationResults: string[],
  mechanism: "spf" | "dkim" | "dmarc"
): string[] {
  const results: string[] = [];

  for (const header of authenticationResults) {
    const regex = new RegExp(
      `\\b${mechanism}\\s*=\\s*[^;\\s]+`,
      "gi"
    );

    const matches =
      header.match(regex) ?? [];

    for (const match of matches) {
      if (!results.includes(match)) {
        results.push(match);
      }
    }
  }

  return results;
}

export async function parseEmail(
  rawEmail: string
): Promise<ParsedEmail> {
  const parser = new PostalMime();

  const email =
    await parser.parse(rawEmail);

  const headers =
    email.headers ?? [];

  const headerMap: Record<
    string,
    string
  > = {};

  for (const header of headers) {
    const key =
      header.key.toLowerCase();

    if (headerMap[key]) {
      headerMap[key] +=
        `\n${header.value}`;
    } else {
      headerMap[key] =
        header.value;
    }
  }

  /*
   * Authentication-Results
   */
  const authenticationResults =
    headerValues(
      headers,
      "authentication-results"
    );

  /*
   * Explicit SPF header
   */
  const explicitSpf =
    headerValues(
      headers,
      "received-spf"
    );

  /*
   * Explicit DKIM-Signature header
   */
  const dkimSignatures =
    headerValues(
      headers,
      "dkim-signature"
    );

  /*
   * Explicit DMARC header
   */
  const explicitDmarc =
    headerValues(
      headers,
      "dmarc-results"
    );

  /*
   * Extract authentication results
   * from Authentication-Results.
   */
  const authenticationSpf =
    extractAuthResults(
      authenticationResults,
      "spf"
    );

  const authenticationDkim =
    extractAuthResults(
      authenticationResults,
      "dkim"
    );

  const authenticationDmarc =
    extractAuthResults(
      authenticationResults,
      "dmarc"
    );

  /*
   * Combine explicit headers with
   * Authentication-Results.
   */
  const receivedSpf =
    [
      ...explicitSpf,
      ...authenticationSpf,
    ];

  const finalDkim =
    [
      ...dkimSignatures,
      ...authenticationDkim,
    ];

  const finalDmarc =
    [
      ...explicitDmarc,
      ...authenticationDmarc,
    ];

  return {
    messageId:
      firstHeader(
        headers,
        "message-id"
      ),

    from: email.from
      ? email.from.address
        ? `${email.from.name ?? ""} <${email.from.address}>`.trim()
        : email.from.name ?? null
      : firstHeader(
          headers,
          "from"
        ),

    to: email.to?.[0]
      ? email.to
          .map((x) =>
            x.address
              ? `${x.name ?? ""} <${x.address}>`.trim()
              : x.name ?? ""
          )
          .join(", ")
      : firstHeader(
          headers,
          "to"
        ),

    cc: email.cc?.length
      ? email.cc
          .map((x) =>
            x.address
              ? `${x.name ?? ""} <${x.address}>`.trim()
              : x.name ?? ""
          )
          .join(", ")
      : null,

    subject:
      email.subject ??
      firstHeader(
        headers,
        "subject"
      ),

    replyTo:
      firstHeader(
        headers,
        "reply-to"
      ),

    returnPath:
      firstHeader(
        headers,
        "return-path"
      ),

    received:
      headerValues(
        headers,
        "received"
      ),

    authenticationResults,

    receivedSpf: [
      ...new Set(receivedSpf),
    ],

    dkimSignatures: [
      ...new Set(finalDkim),
    ],

    dmarcResults: [
      ...new Set(finalDmarc),
    ],

    date:
      firstHeader(
        headers,
        "date"
      ),

    text:
      email.text ?? "",

    html:
      email.html ?? "",

    headers: headerMap,
  };
}

export function reconstructRelayChain(
  receivedHeaders: string[]
): RelayHop[] {
  const result: RelayHop[] = [];

  const ipRegex =
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

  receivedHeaders.forEach(
    (header, index) => {
      const ips =
        header.match(ipRegex) ?? [];

      result.push({
        hop: index + 1,
        raw: header,
        ips: [
          ...new Set(ips),
        ],
      });
    }
  );

  return result;
}