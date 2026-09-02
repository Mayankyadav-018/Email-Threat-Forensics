import { Hono } from "hono";

import {
  getSupabase,
} from "../lib/supabase";

const investigationRouter =
  new Hono();

investigationRouter.get(
  "/",
  async (c) => {
    const supabase =
      getSupabase(
        c.env as any
      );

    const { data, error } =
      await supabase
        .from("email_analyses")
        .select(
          "id,message_id,sender,recipient,subject,threat_score,classification,created_at"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (error) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }

    return c.json({
      success: true,
      investigations:
        data ?? [],
    });
  }
);

investigationRouter.get(
  "/:id",
  async (c) => {
    const id =
      Number(
        c.req.param("id")
      );

    if (!Number.isInteger(id)) {
      return c.json(
        {
          success: false,
          error:
            "Invalid investigation ID.",
        },
        400
      );
    }

    const supabase =
      getSupabase(
        c.env as any
      );

    const {
      data: email,
      error: emailError,
    } = await supabase
      .from("email_analyses")
      .select("*")
      .eq("id", id)
      .single();

    if (
      emailError ||
      !email
    ) {
      return c.json(
        {
          success: false,
          error:
            "Investigation not found.",
        },
        404
      );
    }

    const {
      data: indicators,
    } = await supabase
      .from("email_indicators")
      .select("*")
      .eq(
        "email_id",
        id
      );

    const {
      data: events,
    } = await supabase
      .from("forensic_events")
      .select("*")
      .eq(
        "email_id",
        id
      )
      .order(
        "event_time",
        {
          ascending: true,
        }
      );

    const {
      data: nodes,
    } = await supabase
      .from("attack_graph_nodes")
      .select("*")
      .eq(
        "email_id",
        id
      );

    const {
      data: edges,
    } = await supabase
      .from("attack_graph_edges")
      .select("*")
      .eq(
        "email_id",
        id
      );

    return c.json({
      success: true,

      investigation: {
        email,

        indicators:
          indicators ?? [],

        timeline:
          events ?? [],

        attackGraph: {
          nodes:
            nodes ?? [],

          edges:
            edges ?? [],
        },
      },
    });
  }
);

export default investigationRouter;