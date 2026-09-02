import { Hono } from "hono";

const healthRouter =
  new Hono();

healthRouter.get(
  "/",
  (c) => {
    return c.json({
      status: "ok",

      service:
        "email-threat-forensics",

      timestamp:
        new Date().toISOString(),
    });
  }
);

export default healthRouter;