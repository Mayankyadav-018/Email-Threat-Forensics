import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Correlation,
  IOCResult,
} from "../types/email";

export async function correlateIndicators(
  supabase: SupabaseClient,
  emailId: number,
  iocs: IOCResult
): Promise<Correlation[]> {
  const values = [
    ...iocs.ips,
    ...iocs.domains,
    ...iocs.urls,
  ];

  if (!values.length) {
    return [];
  }

  const { data, error } =
    await supabase
      .from("email_indicators")
      .select(
        "email_id, indicator_type, value"
      )
      .in("value", values)
      .neq("email_id", emailId);

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    indicator: item.value,
    type: item.indicator_type,
    previousEmailId: item.email_id,
    relationship: "shared_indicator",
    severity: "high",
  }));
}