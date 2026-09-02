import type {
  AttackGraph,
  Correlation,
  GeoLocation,
  IOCResult,
  GraphEdge,
  GraphNode,
} from "../types/email";

export function buildAttackGraph(
  emailId: number,
  sender: string | null,
  iocs: IOCResult,
  geolocation: GeoLocation[],
  correlations: Correlation[]
): AttackGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const addNode = (
    node: GraphNode
  ) => {
    if (
      !nodes.some(
        (existing) =>
          existing.id === node.id
      )
    ) {
      nodes.push(node);
    }
  };

  const addEdge = (
    edge: GraphEdge
  ) => {
    if (
      !edges.some(
        (existing) =>
          existing.source === edge.source &&
          existing.target === edge.target &&
          existing.relationship ===
            edge.relationship
      )
    ) {
      edges.push(edge);
    }
  };

  const emailNode =
    `email:${emailId}`;

  addNode({
    id: emailNode,
    type: "email",
    label: `Email ${emailId}`,
  });

  if (sender) {
    const senderNode =
      `sender:${sender}`;

    addNode({
      id: senderNode,
      type: "sender",
      label: sender,
    });

    addEdge({
      source: emailNode,
      target: senderNode,
      relationship: "sent_by",
    });
  }

  for (const ip of iocs.ips) {
    const ipNode = `ip:${ip}`;

    const geo =
      geolocation.find(
        (x) => x.ip === ip
      );

    addNode({
      id: ipNode,
      type: "ip",
      label: ip,
      metadata: {
        country: geo?.country ?? null,
        region: geo?.region ?? null,
        city: geo?.city ?? null,
        latitude:
          geo?.latitude ?? null,
        longitude:
          geo?.longitude ?? null,
        isp: geo?.isp ?? null,
        asn: geo?.asn ?? null,
      },
    });

    addEdge({
      source: emailNode,
      target: ipNode,
      relationship: "observed_ip",
    });
  }

  for (const domain of iocs.domains) {
    const domainNode =
      `domain:${domain}`;

    addNode({
      id: domainNode,
      type: "domain",
      label: domain,
    });

    addEdge({
      source: emailNode,
      target: domainNode,
      relationship: "references_domain",
    });
  }

  for (const url of iocs.urls) {
    const urlNode = `url:${url}`;

    addNode({
      id: urlNode,
      type: "url",
      label: url,
    });

    addEdge({
      source: emailNode,
      target: urlNode,
      relationship: "contains_url",
    });
  }

  for (const correlation of correlations) {
    const previousEmail =
      `email:${correlation.previousEmailId}`;

    const indicatorNode =
      correlation.type === "ip"
        ? `ip:${correlation.indicator}`
        : correlation.type === "domain"
          ? `domain:${correlation.indicator}`
          : `url:${correlation.indicator}`;

    addNode({
      id: previousEmail,
      type: "related_email",
      label: `Related Email ${correlation.previousEmailId}`,
    });

    addEdge({
      source: previousEmail,
      target: indicatorNode,
      relationship: "shared_indicator",
    });
  }

  return {
    nodes,
    edges,
  };
}