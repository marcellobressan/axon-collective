import type { WheelNode, WheelEdge } from '@shared/types';
export interface ReportData {
  title: string;
  generatedDate: string;
  summary: string;
  keyOutcomes: {
    label: string;
    probability: number;
    tier: number;
    description?: string;
  }[];
  scenarios: {
    path: { label: string; tier: number }[];
    finalOutcomeProbability: number;
    narrative: string;
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
      description: n.data.description,
    }));
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const parentMap = new Map<string, string>();
  const edgeMap = new Map<string, WheelEdge>();
  edges.forEach(edge => {
    parentMap.set(edge.target, edge.source);
    edgeMap.set(`${edge.source}-${edge.target}`, edge);
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
      let narrative = `The scenario begins with the central concept of "${path[0].label}".`;
      for (let i = 0; i < path.length - 1; i++) {
        const sourceNode = nodes.find(n => n.data.label === path[i].label && n.data.tier === path[i].tier);
        const targetNode = nodes.find(n => n.data.label === path[i + 1].label && n.data.tier === path[i + 1].tier);
        if (sourceNode && targetNode) {
          const edge = edgeMap.get(`${sourceNode.id}-${targetNode.id}`);
          const relationship = edge?.label ? ` as a "${edge.label}"` : '';
          narrative += ` This leads to "${path[i + 1].label}"${relationship}.`;
        }
      }
      scenarios.push({
        path,
        finalOutcomeProbability: outcome.probability,
        narrative,
      });
    }
  }
  const summary = `This report analyzes the futures wheel for "${title}". The analysis, which now incorporates node descriptions for greater depth, identifies ${keyOutcomes.length} key outcomes with a high probability (average score > ${HIGH_PROBABILITY_THRESHOLD}). These outcomes form the basis of ${scenarios.length} likely scenarios, tracing potential pathways from the central concept. The most significant findings are detailed below, providing a strategic overview of the potential future landscape.`;
  return {
    title: `Futures Wheel Analysis: ${title}`,
    generatedDate: new Date().toLocaleString(),
    summary,
    keyOutcomes,
    scenarios,
  };
}