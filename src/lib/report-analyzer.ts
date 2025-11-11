import type { WheelNode, WheelEdge } from '@shared/types';
export interface ReportData {
  title: string;
  generatedDate: string;
  summary: string;
  keyOutcomes: { label: string; probability: number; tier: number }[];
  scenarios: {
    path: { label: string; tier: number }[];
    finalOutcomeProbability: number;
  }[];
}
const HIGH_PROBABILITY_THRESHOLD = 3.5;
export function analyzeWheel(nodes: WheelNode[], edges: WheelEdge[], title: string): ReportData {
  const centralNode = nodes.find(n => n.data.tier === 0);
  if (!centralNode) {
    throw new Error("Central node not found for analysis.");
  }
  const keyOutcomes = nodes
    .filter(n => (n.data.probability ?? 0) >= HIGH_PROBABILITY_THRESHOLD && n.data.tier > 0)
    .sort((a, b) => (b.data.probability ?? 0) - (a.data.probability ?? 0))
    .map(n => ({
      label: n.data.label,
      probability: n.data.probability ?? 0,
      tier: n.data.tier,
    }));
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const parentMap = new Map<string, string>();
  edges.forEach(edge => {
    parentMap.set(edge.target, edge.source);
  });
  const scenarios: ReportData['scenarios'] = [];
  for (const outcome of keyOutcomes) {
    const outcomeNode = nodes.find(n => n.data.label === outcome.label && n.data.tier === outcome.tier);
    if (outcomeNode) {
      const path: { label: string; tier: number }[] = [];
      let currentNodeId: string | undefined = outcomeNode.id;
      while (currentNodeId) {
        const node = nodeMap.get(currentNodeId);
        if (node) {
          path.unshift({ label: node.data.label, tier: node.data.tier });
        }
        currentNodeId = parentMap.get(currentNodeId);
      }
      scenarios.push({
        path,
        finalOutcomeProbability: outcome.probability,
      });
    }
  }
  const summary = `This report analyzes the futures wheel for "${title}". The analysis identifies ${keyOutcomes.length} key outcomes with a high probability (average score > ${HIGH_PROBABILITY_THRESHOLD}). These outcomes form the basis of ${scenarios.length} likely scenarios, tracing potential pathways from the central concept. The most significant findings are detailed below, providing a strategic overview of the potential future landscape.`;
  return {
    title: `Futures Wheel Analysis: ${title}`,
    generatedDate: new Date().toLocaleString(),
    summary,
    keyOutcomes,
    scenarios,
  };
}