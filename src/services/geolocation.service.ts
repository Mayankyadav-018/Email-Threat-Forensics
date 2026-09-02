import type { Env } from "../lib/supabase";
import type { GeoLocation } from "../types/email";

function isPrivateIP(ip: string): boolean {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 127
  );
}

export async function geolocateIP(
  ip: string,
  env: Env
): Promise<GeoLocation> {
  if (isPrivateIP(ip)) {
    return {
      ip,
      status: "private",

      country: null,
      region: null,
      city: null,

      latitude: null,
      longitude: null,

      isp: null,
      asn: null,
      organization: null,
    };
  }

  if (!env.IPINFO_TOKEN) {
    return {
      ip,
      status: "unavailable",

      country: null,
      region: null,
      city: null,

      latitude: null,
      longitude: null,

      isp: null,
      asn: null,
      organization: null,
    };
  }

  try {
    const response = await fetch(
      `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${env.IPINFO_TOKEN}`
    );

    if (!response.ok) {
      return {
        ip,
        status: "lookup_failed",

        country: null,
        region: null,
        city: null,

        latitude: null,
        longitude: null,

        isp: null,
        asn: null,
        organization: null,
      };
    }

    const data =
      (await response.json()) as {
        country?: string;
        region?: string;
        city?: string;
        loc?: string;
        org?: string;
        asn?: {
          asn?: string;
          name?: string;
        };
      };

    let latitude: number | null = null;
    let longitude: number | null = null;

    if (data.loc) {
      const [lat, lon] =
        data.loc.split(",");

      latitude = Number(lat);
      longitude = Number(lon);
    }

    return {
      ip,
      status: "success",

      country: data.country ?? null,
      region: data.region ?? null,
      city: data.city ?? null,

      latitude:
        Number.isFinite(latitude)
          ? latitude
          : null,

      longitude:
        Number.isFinite(longitude)
          ? longitude
          : null,

      isp: data.org ?? null,

      asn: data.asn?.asn ?? null,

      organization:
        data.asn?.name ??
        data.org ??
        null,
    };
  } catch {
    return {
      ip,
      status: "error",

      country: null,
      region: null,
      city: null,

      latitude: null,
      longitude: null,

      isp: null,
      asn: null,
      organization: null,
    };
  }
}