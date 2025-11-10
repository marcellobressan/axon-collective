import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Wheel, WheelNode, WheelEdge } from '@shared/types';
import type { Connection, EdgeChange, NodeChange, Viewport } from '@xyflow/react';
import { addEdge, applyEdgeChanges, applyNodeChanges, getConnectedEdges } from '@xyflow/react';
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
  nodeToFocus: string | null;
  fetchWheel: (id: string) => Promise<void>;
  setNodes: (nodes: WheelNode[]) => void;
  setEdges: (edges: WheelEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeColor: (nodeId: string, color: string) => void;
  deleteNode: (nodeId: string) => void;
  addNode: (sourceNode: WheelNode) => void;
  saveWheel: () => Promise<void>;
  resetLayout: () => void;
  updateTitle: (newTitle: string) => void;
  setNodeToFocus: (nodeId: string | null) => void;
};
const tierColors = ['#3b82f6', '#0ea5e9', '#14b8a6', '#f59e0b']; // blue, sky, teal, amber
const useWheelStore = create<RFState>()(
  immer((set, get) => ({
    wheelId: null,
    title: '',
    nodes: [],
    edges: [],
    viewport: null,
    isLoading: true,
    error: null,
    nodeToFocus: null,
    fetchWheel: async (id) => {
      const isInitialLoad = get().wheelId !== id || get().nodes.length === 0;
      if (isInitialLoad) {
        set({ isLoading: true, error: null, wheelId: id });
      } else {
        set({ error: null });
      }
      try {
        const remoteWheel = await api<Wheel>(`/api/wheels/${id}`);
        if (isInitialLoad) {
          const layoutResult = treeLayout(remoteWheel.nodes as WheelNode[], remoteWheel.edges);
          set({
            title: remoteWheel.title,
            nodes: layoutResult.nodes,
            edges: layoutResult.edges,
            isLoading: false,
            wheelId: id,
          });
        } else {
          // Smart merge for background updates
          set(state => {
            state.title = remoteWheel.title;
            const localNodesById = new Map(state.nodes.map(n => [n.id, n]));
            const remoteNodesById = new Map(remoteWheel.nodes.map(n => [n.id, n]));
            // Update existing nodes and add new ones
            for (const remoteNode of remoteWheel.nodes) {
              const localNode = localNodesById.get(remoteNode.id);
              if (localNode) {
                // Preserve local position, update data
                localNode.data = remoteNode.data;
              } else {
                // Add new node
                state.nodes.push(remoteNode as WheelNode);
              }
            }
            // Remove deleted nodes
            state.nodes = state.nodes.filter(n => remoteNodesById.has(n.id));
            // Just replace edges, as they are dependent on nodes
            state.edges = remoteWheel.edges;
          });
        }
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
        state.nodes = applyNodeChanges(changes, state.nodes) as WheelNode[];
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
    updateNodeColor: (nodeId, color) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data.color = color;
        }
      });
    },
    deleteNode: (nodeId) => {
      set((state) => {
        const nodeToDelete = state.nodes.find(n => n.id === nodeId);
        if (!nodeToDelete || nodeToDelete.data.tier === 0) return; // Cannot delete central node
        const connectedEdges = getConnectedEdges([nodeToDelete], state.edges);
        const edgeIdsToRemove = new Set(connectedEdges.map(e => e.id));
        state.edges = state.edges.filter(e => !edgeIdsToRemove.has(e.id));
        state.nodes = state.nodes.filter(n => n.id !== nodeId);
      });
    },
    addNode: (sourceNode) => {
      const newTier = sourceNode.data.tier + 1;
      if (newTier > 3) return; // Limit to 3rd order consequences
      const newNode: WheelNode = {
        id: crypto.randomUUID(),
        type: 'custom',
        data: { label: 'New Consequence', tier: newTier, color: tierColors[newTier] || '#6b7280' },
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
      set({ nodes, edges, nodeToFocus: newNode.id });
    },
    saveWheel: async () => {
      const { wheelId, title, nodes, edges } = get();
      if (!wheelId) return;
      try {
        const nodesToSave = nodes.map(({ id, position, data, type, width, height }) => ({
          id, position, data, type, width, height
        }));
        await api(`/api/wheels/${wheelId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, nodes: nodesToSave, edges }),
        });
      } catch (error) {
        console.error('Failed to save wheel:', error);
        throw error;
      }
    },
    resetLayout: () => {
        const { nodes, edges } = get();
        const layoutResult = treeLayout(nodes, edges);
        set({ nodes: layoutResult.nodes, edges: layoutResult.edges });
    },
    updateTitle: (newTitle: string) => {
      set({ title: newTitle });
    },
    setNodeToFocus: (nodeId) => {
      set({ nodeToFocus: nodeId });
    },
  }))
);
export default useWheelStore;