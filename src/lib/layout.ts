import { hierarchy, tree } from 'd3-hierarchy';
import type { WheelNode, WheelEdge } from '@shared/types';
const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 80;
export const treeLayout = (nodes: WheelNode[], edges: WheelEdge[]) => {
  if (nodes.length <= 1) {
    return { nodes, edges };
  }
  const root = nodes.find(n => n.data.tier === 0);
  if (!root) {
    console.error("Root node not found for layout");
    return { nodes, edges };
  }
  const nodesById = new Map(nodes.map(n => [n.id, { ...n, children: [] as WheelNode[] }]));
  for (const edge of edges) {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (source && target) {
      source.children.push(target);
    }
  }
  const hierarchyRoot = hierarchy(nodesById.get(root.id)!);
  const treeLayout = tree<WheelNode>()
    .nodeSize([NODE_WIDTH + HORIZONTAL_SPACING, NODE_HEIGHT + VERTICAL_SPACING])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.25));
  treeLayout(hierarchyRoot);
  const newNodes: WheelNode[] = [];
  hierarchyRoot.each(d3Node => {
    const originalNode = nodes.find(n => n.id === d3Node.data.id);
    if (originalNode) {
      newNodes.push({
        ...originalNode,
        position: { x: d3Node.x, y: d3Node.y },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }
  });
  return { nodes: newNodes, edges };
};