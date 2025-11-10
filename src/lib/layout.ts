import type { WheelNode, WheelEdge } from '@shared/types';
export const TIER_RADII = [0, 250, 500, 750]; // Radii for tier 0, 1, 2, 3
export const radialLayout = (nodes: WheelNode[], edges: WheelEdge[]): { nodes: WheelNode[], edges: WheelEdge[] } => {
  if (nodes.length <= 1) {
    return { nodes, edges };
  }
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
    childrenMap.get(edge.source)!.push(edge.target);
    parentMap.set(edge.target, edge.source);
  });
  const root = nodes.find(n => n.data.tier === 0);
  if (!root) return { nodes, edges };
  const nodeAngles = new Map<string, number>();
  nodeAngles.set(root.id, -Math.PI / 2); // Start at the top
  const nodesByTier: WheelNode[][] = Array.from({ length: TIER_RADII.length }, () => []);
  nodes.forEach(node => {
    if (node.data.tier < TIER_RADII.length) {
      nodesByTier[node.data.tier].push(node);
    }
  });
  // Set root position
  const rootNodeToUpdate = nodeMap.get(root.id);
  if (rootNodeToUpdate) {
    rootNodeToUpdate.position = { x: 0, y: 0 };
  }
  // BFS-like traversal to set angles
  const queue: string[] = [root.id];
  const visited = new Set<string>([root.id]);
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = childrenMap.get(parentId) || [];
    const parentAngle = nodeAngles.get(parentId)!;
    const parentTier = nodeMap.get(parentId)!.data.tier;
    // Simple spread for first-level children
    if (parentTier === 0) {
      const angleStep = (2 * Math.PI) / children.length;
      children.forEach((childId, i) => {
        const angle = i * angleStep - Math.PI / 2;
        nodeAngles.set(childId, angle);
      });
    } else {
      // For deeper tiers, spread children around parent's angle
      const spread = Math.PI / (3 * (parentTier + 1)); // Smaller spread for deeper tiers
      const startAngle = parentAngle - (spread * (children.length - 1)) / 2;
      children.forEach((childId, i) => {
        const angle = startAngle + i * spread;
        nodeAngles.set(childId, angle);
      });
    }
    children.forEach(childId => {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push(childId);
      }
    });
  }
  // Position nodes based on calculated angles and tier
  for (let tier = 1; tier < TIER_RADII.length; tier++) {
    const tierNodes = nodesByTier[tier];
    const radius = TIER_RADII[tier];
    // Sort nodes in the tier based on their calculated angle to maintain order
    tierNodes.sort((a, b) => (nodeAngles.get(a.id) ?? 0) - (nodeAngles.get(b.id) ?? 0));
    tierNodes.forEach(node => {
      const angle = nodeAngles.get(node.id);
      if (angle !== undefined) {
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const nodeToUpdate = nodeMap.get(node.id);
        if (nodeToUpdate) {
          nodeToUpdate.position = { x, y };
        }
      }
    });
  }
  return { nodes: Array.from(nodeMap.values()), edges };
};