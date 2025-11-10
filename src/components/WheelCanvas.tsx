import React, { useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  Node,
  NodeTypes,
} from '@xyflow/react';
import { Save, Share2, LayoutPanelLeft, Download, Trash2, Palette } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { toPng, toSvg } from 'html-to-image';
import useWheelStore from '@/store/wheelStore';
import CustomNode from './CustomNode';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import type { WheelNode } from '@shared/types';
import '@xyflow/react/dist/style.css';

const COLORS = ['#3b82f6', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
function downloadImage(dataUrl: string, name: string) {
  const a = document.createElement('a');
  a.setAttribute('download', name);
  a.setAttribute('href', dataUrl);
  a.click();
}
function Canvas() {
  const nodes = useWheelStore(s => s.nodes);
  const edges = useWheelStore(s => s.edges);
  const onNodesChange = useWheelStore(s => s.onNodesChange);
  const onEdgesChange = useWheelStore(s => s.onEdgesChange);
  const onConnect = useWheelStore(s => s.onConnect);
  const isLoading = useWheelStore(s => s.isLoading);
  const error = useWheelStore(s => s.error);
  const saveWheel = useWheelStore(s => s.saveWheel);
  const resetLayout = useWheelStore(s => s.resetLayout);
  const deleteNode = useWheelStore(s => s.deleteNode);
  const updateNodeColor = useWheelStore(s => s.updateNodeColor);
  const nodeTypes: NodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const { getNodes } = useReactFlow();
  const [contextMenuNode, setContextMenuNode] = React.useState<Node<WheelNode> | null>(null);
  const handleSave = async () => {
    const promise = saveWheel();
    toast.promise(promise, {
      loading: 'Saving your masterpiece...',
      success: 'Wheel saved successfully!',
      error: 'Could not save the wheel.',
    });
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Link copied to clipboard!');
    }, (err) => {
      toast.error('Failed to copy link.');
      console.error('Could not copy text: ', err);
    });
  };
  const handleResetLayout = () => {
    resetLayout();
    toast.info('Layout has been reset.');
  };
  const handleExport = (format: 'png' | 'svg') => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      toast.warning('Canvas is empty, nothing to export.');
      return;
    }
    const exportFunc = format === 'png' ? toPng : toSvg;
    const extension = format === 'png' ? 'png' : 'svg';
    exportFunc(document.querySelector('.react-flow__viewport') as HTMLElement, {
      backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
    }).then((dataUrl) => {
      downloadImage(dataUrl, `axon-collective-wheel.${extension}`);
      toast.success(`Exported as ${extension.toUpperCase()}`);
    });
  };
  useHotkeys('mod+s', (e) => { e.preventDefault(); handleSave(); }, { preventDefault: true });
  useHotkeys('mod+r', (e) => { e.preventDefault(); handleResetLayout(); }, { preventDefault: true });
  const onNodeContextMenu = (event: React.MouseEvent, node: Node<WheelNode>) => {
    event.preventDefault();
    setContextMenuNode(node);
  };
  if (isLoading) return <Skeleton className="w-full h-full rounded-lg" />;
  if (error) return <div className="w-full h-full flex items-center justify-center bg-destructive/10 text-destructive-foreground rounded-lg"><p>Error: {error}</p></div>;
  return (
    <div className="w-full h-full relative">
      <ContextMenu>
        <ContextMenuTrigger className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeContextMenu={onNodeContextMenu}
            fitView
            className="bg-background"
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </ContextMenuTrigger>
        {contextMenuNode && (
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => { if (contextMenuNode) deleteNode(contextMenuNode.id); }}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Node
            </ContextMenuItem>
            <div className="flex items-center px-2 py-1.5 text-sm font-semibold"><Palette className="w-4 h-4 mr-2" /> Change Color</div>
            <div className="p-2 grid grid-cols-4 gap-1">
              {COLORS.map(color => (
                <button key={color} style={{ backgroundColor: color }} className="w-6 h-6 rounded-full border" onClick={() => { if (contextMenuNode) updateNodeColor(contextMenuNode.id, color); }} />
              ))}
            </div>
          </ContextMenuContent>
        )}
      </ContextMenu>
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="outline" size="icon" onClick={handleResetLayout} title="Reset Layout (Cmd+R)"><LayoutPanelLeft className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" onClick={handleShare} title="Share"><Share2 className="w-4 h-4" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Export"><Download className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => handleExport('png')}>Export as PNG</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExport('svg')}>Export as SVG</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleSave} title="Save Wheel (Cmd+S)"><Save className="w-4 h-4 mr-2" />Save</Button>
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