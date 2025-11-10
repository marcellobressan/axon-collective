import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Wheel, WheelNode, WheelEdge } from '@shared/types';
import type { Connection, EdgeChange, NodeChange, Viewport } from '@xyflow/react';
import { addEdge, applyEdgeChanges, applyNodeChanges, getConnectedEdges } from '@xyflow/react';
import { api } from '@/lib/api-client';
import { radialLayout } from '@/lib/layout';
type HistoryState = {
  nodes: WheelNode[];
  edges: WheelEdge[];
};
export type RFState = {
  wheelId: string | null;
  title: string;
  nodes: WheelNode[];
  edges: WheelEdge[];
  viewport: Viewport | null;
  isLoading: boolean;
  error: string | null;
  nodeToFocus: string | null;
  editingNodeId: string | null;
  past: HistoryState[];
  future: HistoryState[];
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
  setEditingNodeId: (nodeId: string | null) => void;
  undo: () => void;
  redo: () => void;
};
const tierColors = ['#3b82f6', '#0ea5e9', '#14b8a6', '#f59e0b']; // blue, sky, teal, amber
const useWheelStore = create<RFState>()(
  immer((set, get) => {
    const takeSnapshot = () => {
      set(state => {
        state.past.push({ nodes: state.nodes, edges: state.edges });
        state.future = []; // Clear future on new action
      });
    };
    return {
      wheelId: null,
      title: '',
      nodes: [],
      edges: [],
      viewport: null,
      isLoading: true,
      error: null,
      nodeToFocus: null,
      editingNodeId: null,
      past: [],
      future: [],
      fetchWheel: async (id) => {
        const isInitialLoad = get().wheelId !== id || get().nodes.length === 0;
        if (isInitialLoad) {
          set({ isLoading: true, error: null, wheelId: id, past: [], future: [] });
        } else {
          set({ error: null });
        }
        try {
          const remoteWheel = await api<Wheel>(`/api/wheels/${id}`);
          if (isInitialLoad) {
            const layoutResult = radialLayout(remoteWheel.nodes as WheelNode[], remoteWheel.edges);
            set({
              title: remoteWheel.title,
              nodes: layoutResult.nodes,
              edges: layoutResult.edges,
              isLoading: false,
              wheelId: id,
            });
          } else {
            set(state => {
              state.title = remoteWheel.title;
              const localNodesById = new Map(state.nodes.map(n => [n.id, n]));
              const remoteNodesById = new Map(remoteWheel.nodes.map(n => [n.id, n]));
              for (const remoteNode of remoteWheel.nodes) {
                const localNode = localNodesById.get(remoteNode.id);
                if (localNode) {
                  localNode.data = remoteNode.data;
                } else {
                  state.nodes.push(remoteNode as WheelNode);
                }
              }
              state.nodes = state.nodes.filter(n => remoteNodesById.has(n.id));
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
        const isDrag = changes.every(c => c.type === 'position' && c.dragging);
        if (!isDrag) takeSnapshot();
        set((state) => {
          state.nodes = applyNodeChanges(changes, state.nodes) as WheelNode[];
          if (state.editingNodeId) {
            const deselectionChange = changes.find(
              (change) =>
                change.type === 'select' &&
                change.id === state.editingNodeId &&
                !change.selected
            );
            if (deselectionChange) {
              state.editingNodeId = null;
            }
          }
        });
      },
      onEdgesChange: (changes) => {
        takeSnapshot();
        set((state) => {
          state.edges = applyEdgeChanges(changes, state.edges);
        });
      },
      onConnect: (connection) => {
        takeSnapshot();
        set((state) => {
          state.edges = addEdge(connection, state.edges);
        });
      },
      updateNodeLabel: (nodeId, label) => {
        takeSnapshot();
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data.label = label;
          }
        });
      },
      updateNodeColor: (nodeId, color) => {
        takeSnapshot();
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data.color = color;
          }
        });
      },
      deleteNode: (nodeId) => {
        takeSnapshot();
        set((state) => {
          const nodeToDelete = state.nodes.find(n => n.id === nodeId);
          if (!nodeToDelete || nodeToDelete.data.tier === 0) return;
          const connectedEdges = getConnectedEdges([nodeToDelete], state.edges);
          const edgeIdsToRemove = new Set(connectedEdges.map(e => e.id));
          state.edges = state.edges.filter(e => !edgeIdsToRemove.has(e.id));
          state.nodes = state.nodes.filter(n => n.id !== nodeId);
        });
      },
      addNode: (sourceNode) => {
        takeSnapshot();
        const newTier = sourceNode.data.tier + 1;
        if (newTier > 3) return;
        const newNode: WheelNode = {
          id: crypto.randomUUID(),
          type: 'custom',
          data: { label: 'New Consequence', tier: newTier, color: tierColors[newTier] || '#6b7280' },
          position: { x: sourceNode.position.x, y: sourceNode.position.y + 150 },
          width: 144,
          height: 144,
        };
        const newEdge: WheelEdge = {
          id: `e-${sourceNode.id}-${newNode.id}`,
          source: sourceNode.id,
          target: newNode.id,
        };
        const { nodes, edges } = radialLayout([...get().nodes, newNode], [...get().edges, newEdge]);
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
        takeSnapshot();
        const { nodes, edges } = get();
        const layoutResult = radialLayout(nodes, edges);
        set({ nodes: layoutResult.nodes, edges: layoutResult.edges });
      },
      updateTitle: (newTitle: string) => {
        set({ title: newTitle });
      },
      setNodeToFocus: (nodeId) => {
        set({ nodeToFocus: nodeId });
      },
      setEditingNodeId: (nodeId) => {
        set({ editingNodeId: nodeId });
      },
      undo: () => {
        set(state => {
          if (state.past.length === 0) return;
          const lastState = state.past.pop();
          if (lastState) {
            state.future.unshift({ nodes: state.nodes, edges: state.edges });
            state.nodes = lastState.nodes;
            state.edges = lastState.edges;
          }
        });
      },
      redo: () => {
        set(state => {
          if (state.future.length === 0) return;
          const nextState = state.future.shift();
          if (nextState) {
            state.past.push({ nodes: state.nodes, edges: state.edges });
            state.nodes = nextState.nodes;
            state.edges = nextState.edges;
          }
        });
      },
    };
  })
);
export default useWheelStore;