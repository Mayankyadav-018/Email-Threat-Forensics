import { Hono } from "hono";
import { cors } from "hono/cors";

import healthRouter from "./routes/health";
import analysisRouter from "./routes/analysis";
import investigationRouter from "./routes/investigations";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) => {
  return c.json({
    name:
      "AI Email Threat Detection, Geolocation & Forensic Intelligence Platform",

    service:
      "email-threat-forensics",

    status:
      "running",

    version:
      "0.1.0",
  });
});

app.route(
  "/health",
  healthRouter
);

app.route(
  "/api/v1/analysis",
  analysisRouter
);

app.route(
  "/api/v1/investigations",
  investigationRouter
);

export default app;