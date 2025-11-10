import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Wheel, WheelNode, WheelEdge } from '@shared/types';
import type { Connection, EdgeChange, NodeChange, Viewport } from '@xyflow/react';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { api } from '@/lib/api-client';
import { treeLayout } from '@/lib/layout';
export type RFState = {
  wheelId: string | null;
  title: string;
  nodes: WheelNode[];
  edges: WheelEdge[];
  viewport: Viewport | null;
  isLoading: boolean;
  error: string | null;
  fetchWheel: (id: string) => Promise<void>;
  setNodes: (nodes: WheelNode[]) => void;
  setEdges: (edges: WheelEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  addNode: (sourceNode: WheelNode) => void;
  saveWheel: () => Promise<void>;
  resetLayout: () => void;
};
const useWheelStore = create<RFState>()(
  immer((set, get) => ({
    wheelId: null,
    title: '',
    nodes: [],
    edges: [],
    viewport: null,
    isLoading: true,
    error: null,
    fetchWheel: async (id) => {
      const isInitialLoad = get().wheelId !== id || get().nodes.length === 0;
      if (isInitialLoad) {
        set({ isLoading: true, error: null, wheelId: id });
      } else {
        set({ error: null });
      }
      try {
        const wheel = await api<Wheel>(`/api/wheels/${id}`);
        // For background updates, we don't want to re-run the layout
        // if the node/edge count is the same, to avoid disrupting user's manual layout.
        // A more sophisticated merge would be needed for a real production app.
        const shouldRunLayout = isInitialLoad || get().nodes.length !== wheel.nodes.length || get().edges.length !== wheel.edges.length;
        const layoutResult = shouldRunLayout ? treeLayout(wheel.nodes, wheel.edges) : { nodes: wheel.nodes, edges: wheel.edges };
        set({
          title: wheel.title,
          nodes: layoutResult.nodes,
          edges: layoutResult.edges,
          isLoading: false,
          wheelId: id,
        });
      } catch (error) {
        console.error('Failed to fetch wheel:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load wheel',
          isLoading: false,
        });
      }
    },
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    onNodesChange: (changes) => {
      set((state) => {
        state.nodes = applyNodeChanges(changes, state.nodes);
      });
    },
    onEdgesChange: (changes) => {
      set((state) => {
        state.edges = applyEdgeChanges(changes, state.edges);
      });
    },
    onConnect: (connection) => {
      set((state) => {
        state.edges = addEdge(connection, state.edges);
      });
    },
    updateNodeLabel: (nodeId, label) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data.label = label;
        }
      });
    },
    addNode: (sourceNode) => {
      const newTier = sourceNode.data.tier + 1;
      if (newTier > 3) return; // Limit to 3rd order consequences
      const newNode: WheelNode = {
        id: crypto.randomUUID(),
        type: 'custom',
        data: { label: 'New Consequence', tier: newTier },
        position: { x: sourceNode.position.x, y: sourceNode.position.y + 150 },
        width: 160,
        height: 60,
      };
      const newEdge: WheelEdge = {
        id: `e-${sourceNode.id}-${newNode.id}`,
        source: sourceNode.id,
        target: newNode.id,
      };
      const { nodes, edges } = treeLayout([...get().nodes, newNode], [...get().edges, newEdge]);
      set({ nodes, edges });
    },
    saveWheel: async () => {
      const { wheelId, title, nodes, edges } = get();
      if (!wheelId) return;
      try {
        await api(`/api/wheels/${wheelId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, nodes, edges }),
        });
      } catch (error) {
        console.error('Failed to save wheel:', error);
        // Optionally set an error state to show in UI
      }
    },
    resetLayout: () => {
        const { nodes, edges } = get();
        const layoutResult = treeLayout(nodes, edges);
        set({ nodes: layoutResult.nodes, edges: layoutResult.edges });
    }
  }))
);
export default useWheelStore;