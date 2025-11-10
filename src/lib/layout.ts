import type { WheelNode, WheelEdge } from '@shared/types';
export const TIER_RADII = [0, 250, 500, 750]; // Radii for tier 0, 1, 2, 3
export const radialLayout = (nodes: WheelNode[], edges: WheelEdge[]): { nodes: WheelNode[], edges: WheelEdge[] } => {
  if (nodes.length <= 1) {
    return { nodes, edges };
  }
  const nodesByTier: Map<number, WheelNode[]> = new Map();
  nodes.forEach(node => {
    const tier = node.data.tier;
    if (!nodesByTier.has(tier)) {
      nodesByTier.set(tier, []);
    }
    nodesByTier.get(tier)!.push(node);
  });
  const layoutNodesMap = new Map<string, WheelNode>();
  nodes.forEach(node => layoutNodesMap.set(node.id, { ...node }));
  // Tier 0 (center)
  const rootNode = nodesByTier.get(0)?.[0];
  if (rootNode) {
    const nodeToUpdate = layoutNodesMap.get(rootNode.id);
    if (nodeToUpdate) {
      nodeToUpdate.position = { x: 0, y: 0 };
    }
  }
  // Other tiers
  for (let tier = 1; tier < TIER_RADII.length; tier++) {
    const tierNodes = nodesByTier.get(tier) || [];
    const count = tierNodes.length;
    if (count === 0) continue;
    const radius = TIER_RADII[tier];
    const angleStep = (2 * Math.PI) / count;
    tierNodes.forEach((node, i) => {
      // Start first node at the top
      const angle = i * angleStep - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const nodeToUpdate = layoutNodesMap.get(node.id);
      if (nodeToUpdate) {
        nodeToUpdate.position = { x, y };
      }
    });
  }
  return { nodes: Array.from(layoutNodesMap.values()), edges };
};