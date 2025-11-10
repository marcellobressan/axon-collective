import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react';
import { Save, Share2, LayoutPanelLeft } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import useWheelStore from '@/store/wheelStore';
import CustomNode from './CustomNode';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import '@xyflow/react/dist/style.css';
const selector = (s: any) => ({
  nodes: s.nodes,
  edges: s.edges,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  onConnect: s.onConnect,
  isLoading: s.isLoading,
  error: s.error,
  saveWheel: s.saveWheel,
  resetLayout: s.resetLayout,
});
function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, isLoading, error, saveWheel, resetLayout } = useWheelStore(selector);
  const [localNodes, setLocalNodes, onLocalNodesChange] = useNodesState([]);
  const [localEdges, setLocalEdges, onLocalEdgesChange] = useEdgesState([]);
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes, setLocalNodes]);
  useEffect(() => {
    setLocalEdges(edges);
  }, [edges, setLocalEdges]);
  const handleSave = async () => {
    const promise = saveWheel();
    toast.promise(promise, {
      loading: 'Saving your masterpiece...',
      success: 'Wheel saved successfully!',
      error: 'Could not save the wheel.',
    });
  };
  if (isLoading) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-destructive/10 text-destructive-foreground rounded-lg">
        <p>Error: {error}</p>
      </div>
    );
  }
  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="outline" size="icon" onClick={resetLayout} title="Reset Layout">
          <LayoutPanelLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => {}} title="Share (coming soon)">
          <Share2 className="w-4 h-4" />
        </Button>
        <Button onClick={handleSave} title="Save Wheel">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
      <Toaster richColors />
    </div>
  );
}
export function WheelCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}