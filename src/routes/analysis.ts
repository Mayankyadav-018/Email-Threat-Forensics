import { Hono } from "hono";

import {
  analyzeEmail,
} from "../controllers/analysis.controller";

const analysisRouter =
  new Hono();

analysisRouter.post(
  "/email",
  analyzeEmail
);

export default analysisRouter;