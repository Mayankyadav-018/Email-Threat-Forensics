import type { Context } from "hono";

import { getSupabase } from "../lib/supabase";

import {
  parseEmail,
  reconstructRelayChain,
} from "../services/email-parser.service";

import {
  extractIOCs,
} from "../services/ioc-extractor.service";

import {
  geolocateIP,
} from "../services/geolocation.service";

import {
  checkIPReputation,
} from "../services/threat-intel.service";

import {
  correlateIndicators,
} from "../services/correlation.service";

import {
  buildAttackGraph,
} from "../services/graph.service";

import {
  buildForensicTimeline,
} from "../services/forensic.service";

import {
  calculateThreatScore,
} from "../services/threat-score.service";

export async function analyzeEmail(
  c: Context
) {
  try {
    const formData =
      await c.req.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return c.json(
        {
          success: false,
          error:
            "Upload a .eml file using the 'file' field.",
        },
        400
      );
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".eml")
    ) {
      return c.json(
        {
          success: false,
          error:
            "Only .eml files are supported.",
        },
        400
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json(
        {
          success: false,
          error:
            "Maximum file size is 10 MB.",
        },
        400
      );
    }

    const rawEmail =
      await file.text();

    const parsed =
      await parseEmail(rawEmail);

    const iocs =
      extractIOCs(parsed);

    const relayChain =
      reconstructRelayChain(
        parsed.received
      );

    const env = c.env as any;

    const supabase =
      getSupabase(env);

    /*
     * 1. Store email
     */

    const { data: emailRecord, error } =
      await supabase
        .from("email_analyses")
        .insert({
          message_id:
            parsed.messageId,

          sender:
            parsed.from,

          recipient:
            parsed.to,

          subject:
            parsed.subject,

          reply_to:
            parsed.replyTo,

          return_path:
            parsed.returnPath,

          raw_headers:
            JSON.stringify(
              parsed.headers
            ),
        })
        .select()
        .single();

    if (error || !emailRecord) {
      console.error(error);

      return c.json(
        {
          success: false,
          error:
            "Failed to store email analysis.",
        },
        500
      );
    }

    const emailId =
      emailRecord.id;

    /*
     * 2. Geolocation
     */

    const geolocation =
      await Promise.all(
        iocs.publicIps.map(
          (ip) =>
            geolocateIP(
              ip,
              env
            )
        )
      );

    /*
     * 3. Threat intelligence
     */

    const threatIntel =
      await Promise.all(
        iocs.publicIps.map(
          (ip) =>
            checkIPReputation(
              ip,
              env
            )
        )
      );

    /*
     * 4. Store indicators
     */

    const indicatorRows = [
      ...iocs.ips.map((ip) => {
        const geo =
          geolocation.find(
            (x) => x.ip === ip
          );

        return {
          email_id: emailId,

          indicator_type: "ip",

          value: ip,

          country:
            geo?.country ?? null,

          region:
            geo?.region ?? null,

          city:
            geo?.city ?? null,

          latitude:
            geo?.latitude ?? null,

          longitude:
            geo?.longitude ?? null,

          isp:
            geo?.isp ?? null,

          asn:
            geo?.asn ?? null,

          organization:
            geo?.organization ?? null,
        };
      }),

      ...iocs.domains.map(
        (domain) => ({
          email_id: emailId,

          indicator_type:
            "domain",

          value: domain,
        })
      ),

      ...iocs.urls.map(
        (url) => ({
          email_id: emailId,

          indicator_type:
            "url",

          value: url,
        })
      ),
    ];

    if (indicatorRows.length) {
      await supabase
        .from("email_indicators")
        .insert(indicatorRows);
    }

    /*
     * 5. Correlation
     */

    const correlations =
      await correlateIndicators(
        supabase,
        emailId,
        iocs
      );

      /*
 * 5.5. Threat scoring
 */

const threatScore =
  calculateThreatScore({
    email: parsed,
    authentication: {
      spf: parsed.receivedSpf,
      dkim: parsed.dkimSignatures,
      dmarc: parsed.dmarcResults,
      authenticationResults:
        parsed.authenticationResults,
    },
    iocs,
    correlations,

  });

    /*
     * 6. Attack graph
     */

    const attackGraph =
      buildAttackGraph(
        emailId,
        parsed.from,
        iocs,
        geolocation,
        correlations
      );

    /*
     * 7. Forensic timeline
     */

    const timeline =
      buildForensicTimeline(
        iocs,
        geolocation,
        correlations
      );

    /*
     * 8. Store forensic events
     */

    if (timeline.length) {
      await supabase
        .from("forensic_events")
        .insert(
          timeline.map(
            (event) => ({
              email_id:
                emailId,

              event_type:
                event.event,

              description:
                event.description,

              event_time:
                event.timestamp,

              metadata:
                event.metadata ?? null,
            })
          )
        );
    }

    /*
     * 9. Store graph
     */

    if (
      attackGraph.nodes.length
    ) {
      await supabase
        .from("attack_graph_nodes")
        .insert(
          attackGraph.nodes.map(
            (node) => ({
              email_id:
                emailId,

              node_id:
                node.id,

              node_type:
                node.type,

              label:
                node.label,

              metadata:
                node.metadata ?? null,
            })
          )
        );
    }

    if (
      attackGraph.edges.length
    ) {
      await supabase
        .from("attack_graph_edges")
        .insert(
          attackGraph.edges.map(
            (edge) => ({
              email_id:
                emailId,

              source:
                edge.source,

              target:
                edge.target,

              relationship:
                edge.relationship,
            })
          )
        );
    }

    return c.json({
      success: true,

      analysisId:
        emailId,

      email: {
        messageId:
          parsed.messageId,

        sender:
          parsed.from,

        recipient:
          parsed.to,

        subject:
          parsed.subject,

        replyTo:
          parsed.replyTo,

        returnPath:
          parsed.returnPath,

        date:
          parsed.date,
      },

      authentication: {
        spf:
          parsed.receivedSpf,

        dkim:
          parsed.dkimSignatures,

        dmarc:
          parsed.dmarcResults,

        authenticationResults:
          parsed.authenticationResults,
      },

      iocs,

      relayChain,

      geolocation,

      threatIntel,

      correlations,

      threatScore,

      attackGraph,

      forensicTimeline:
        timeline,
    });
  } catch (error) {
    console.error(
      "Email analysis error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      500
    );
  }
}