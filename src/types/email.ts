export interface ParsedEmail {
  messageId: string | null;
  from: string | null;
  to: string | null;
  cc: string | null;
  subject: string | null;
  replyTo: string | null;
  returnPath: string | null;

  received: string[];

  authenticationResults: string[];
  receivedSpf: string[];
  dkimSignatures: string[];
  dmarcResults: string[];

  date: string | null;

  text: string;
  html: string;

  headers: Record<string, string>;
}

export interface IOCResult {
  ips: string[];
  publicIps: string[];
  privateIps: string[];
  domains: string[];
  urls: string[];
}

export interface GeoLocation {
  ip: string;
  status: string;

  country: string | null;
  region: string | null;
  city: string | null;

  latitude: number | null;
  longitude: number | null;

  isp: string | null;
  asn: string | null;
  organization: string | null;
}

export interface RelayHop {
  hop: number;
  raw: string;
  ips: string[];
}

export interface Correlation {
  indicator: string;
  type: string;
  previousEmailId: number;
  relationship: string;
  severity: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface AttackGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ForensicEvent {
  timestamp: string;
  event: string;
  description: string;
  metadata?: Record<string, unknown>;
}