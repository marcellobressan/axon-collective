import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  getIncomers,
  getOutgoers,
} from '@xyflow/react';
import { Save, Share2, LayoutPanelLeft, Download, Trash2, Palette, Undo, Redo, Edit, Eye, Search, X, Presentation, FileText, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { toPng, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useWheelStore from '@/store/wheelStore';
import CustomNode from './CustomNode';
import LabeledEdge from './LabeledEdge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import type { WheelNode } from '@shared/types';
import { TIER_RADII } from '@/lib/layout';
import { cn } from '@/lib/utils';
import { analyzeWheel, ReportData } from '@/lib/report-analyzer';
import { ReportPreview } from './ReportPreview';
import '@xyflow/react/dist/style.css';
const COLORS = ['#3b82f6', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
function downloadImage(dataUrl: string, name: string) {
  const a = document.createElement('a');
  a.setAttribute('download', name);
  a.setAttribute('href', dataUrl);
  a.click();
}
function TierBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="w-full h-full relative flex items-center justify-center">
        {TIER_RADII.slice(1).map((radius, index) => (
          <div
            key={index}
            className="absolute rounded-full border border-dashed border-border"
            style={{
              width: radius * 2,
              height: radius * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
function Canvas() {
  const storeTitle = useWheelStore(s => s.title);
  const storeNodes = useWheelStore(s => s.nodes);
  const storeEdges = useWheelStore(s => s.edges);
  const onNodesChange = useWheelStore(s => s.onNodesChange);
  const onEdgesChange = useWheelStore(s => s.onEdgesChange);
  const onConnect = useWheelStore(s => s.onConnect);
  const isLoading = useWheelStore(s => s.isLoading);
  const error = useWheelStore(s => s.error);
  const saveWheel = useWheelStore(s => s.saveWheel);
  const resetLayout = useWheelStore(s => s.resetLayout);
  const deleteNode = useWheelStore(s => s.deleteNode);
  const updateNodeColor = useWheelStore(s => s.updateNodeColor);
  const undo = useWheelStore(s => s.undo);
  const redo = useWheelStore(s => s.redo);
  const pastStates = useWheelStore(s => s.past);
  const futureStates = useWheelStore(s => s.future);
  const nodeTypes: NodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes: EdgeTypes = useMemo(() => ({ labeled: LabeledEdge }), []);
  const { getNodes, getEdges, fitView } = useReactFlow();
  const [contextMenuNode, setContextMenuNode] = useState<Node<WheelNode> | null>(null);
  const [contextMenuEdge, setContextMenuEdge] = useState<Edge | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const reportPreviewRef = useRef<HTMLDivElement>(null);
  const { nodes, edges } = useMemo(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const matchingNodeIds = new Set(
        storeNodes
          .filter(n => n.data.label.toLowerCase().includes(lowerCaseQuery) || n.data.description?.toLowerCase().includes(lowerCaseQuery))
          .map(n => n.id)
      );
      const filteredNodes = storeNodes.map(n => ({
        ...n,
        className: cn(
          matchingNodeIds.has(n.id) ? 'search-highlight' : 'opacity-20 transition-opacity'
        ),
      }));
      return { nodes: filteredNodes, edges: storeEdges.map(e => ({...e, className: 'opacity-20 transition-opacity'})) };
    }
    if (focusNodeId) {
      const focusNode = storeNodes.find(n => n.id === focusNodeId);
      if (focusNode) {
        const relatedNodes = new Set<string>([focusNodeId]);
        const relatedEdges = new Set<string>();
        const findConnections = (nodeId: string) => {
          const incomers = getIncomers(storeNodes.find(n => n.id === nodeId)!, storeNodes, storeEdges);
          const outgoers = getOutgoers(storeNodes.find(n => n.id === nodeId)!, storeNodes, storeEdges);
          incomers.forEach(n => relatedNodes.add(n.id));
          outgoers.forEach(n => relatedNodes.add(n.id));
          storeEdges.forEach(edge => {
            if (edge.source === nodeId || edge.target === nodeId) {
              relatedEdges.add(edge.id);
            }
          });
        };
        findConnections(focusNodeId);
        const styledNodes = storeNodes.map(node => ({
          ...node,
          className: cn(!relatedNodes.has(node.id) && 'opacity-20 transition-opacity'),
        }));
        const styledEdges = storeEdges.map(edge => ({
          ...edge,
          className: cn(!relatedEdges.has(edge.id) && 'opacity-20 transition-opacity'),
        }));
        return { nodes: styledNodes, edges: styledEdges };
      }
    }
    return { nodes: storeNodes.map(n => ({...n, className: ''})), edges: storeEdges.map(e => ({...e, className: ''})) };
  }, [focusNodeId, storeNodes, storeEdges, searchQuery]);
  useEffect(() => {
    if (reportData && reportPreviewRef.current) {
      const generatePdf = async () => {
        try {
          const canvas = await html2canvas(reportPreviewRef.current!, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = imgWidth / imgHeight;
          const width = pdfWidth;
          const height = width / ratio;
          pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
          pdf.save(`Axon-Report-${storeTitle.replace(/\s/g, '_')}.pdf`);
          toast.success('Report downloaded successfully!');
        } catch (err) {
          console.error("Failed to generate PDF:", err);
          toast.error('Failed to generate PDF report.');
        } finally {
          setReportData(null); // Clean up
          setIsGeneratingReport(false);
        }
      };
      // Delay to ensure component is fully rendered
      const timer = setTimeout(generatePdf, 100);
      return () => clearTimeout(timer);
    }
  }, [reportData, storeTitle]);
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    toast.info('Generating AI-powered report...');
    try {
      const analysis = analyzeWheel(storeNodes, storeEdges, storeTitle);
      setReportData(analysis);
    } catch (err) {
      console.error("Failed to analyze wheel:", err);
      toast.error('Failed to analyze wheel data.');
      setIsGeneratingReport(false);
    }
  };
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
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setFocusNodeId(null);
    if (e.target.value) {
      const lowerCaseQuery = e.target.value.toLowerCase();
      const matchingNodes = storeNodes.filter(n => n.data.label.toLowerCase().includes(lowerCaseQuery) || n.data.description?.toLowerCase().includes(lowerCaseQuery));
      if (matchingNodes.length > 0) {
        fitView({ nodes: matchingNodes, duration: 500, padding: 0.2 });
      }
    } else {
      fitView({ duration: 500 });
    }
  };
  useHotkeys('mod+s', (e) => { e.preventDefault(); handleSave(); }, { preventDefault: true });
  useHotkeys('mod+r', (e) => { e.preventDefault(); handleResetLayout(); }, { preventDefault: true });
  useHotkeys('mod+z', (e) => { e.preventDefault(); undo(); }, { preventDefault: true });
  useHotkeys('mod+shift+z', (e) => { e.preventDefault(); redo(); }, { preventDefault: true });
  const onNodeContextMenu = (event: React.MouseEvent, node: Node<WheelNode>) => {
    event.preventDefault();
    setContextMenuNode(node);
    setContextMenuEdge(null);
  };
  const onEdgeContextMenu = (event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenuEdge(edge);
    setContextMenuNode(null);
  };
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setFocusNodeId(node.id);
    setSearchQuery('');
  }, []);
  const onPaneClick = useCallback(() => {
    setFocusNodeId(null);
    setSearchQuery('');
  }, []);
  if (isLoading) return <Skeleton className="w-full h-full rounded-lg" />;
  if (error) return <div className="w-full h-full flex items-center justify-center bg-destructive/10 text-destructive-foreground rounded-lg"><p>Error: {error}</p></div>;
  return (
    <div className="w-full h-full relative">
      <TierBackground />
      <ContextMenu>
        <ContextMenuTrigger className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            className="bg-transparent"
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: 'labeled' }}
          >
            <div className={cn("transition-opacity", isPresentationMode && "opacity-0 pointer-events-none")}>
              <Controls />
            </div>
          </ReactFlow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {contextMenuNode && (
            <>
              <ContextMenuItem onSelect={() => setFocusNodeId(contextMenuNode.id)}>
                <Eye className="w-4 h-4 mr-2" /> Focus Node
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => deleteNode(contextMenuNode.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Node
              </ContextMenuItem>
              <div className="flex items-center px-2 py-1.5 text-sm font-semibold"><Palette className="w-4 h-4 mr-2" /> Change Color</div>
              <div className="p-2 grid grid-cols-4 gap-1">
                {COLORS.map(color => (
                  <button key={color} style={{ backgroundColor: color }} className="w-6 h-6 rounded-full border" onClick={() => updateNodeColor(contextMenuNode.id, color)} />
                ))}
              </div>
            </>
          )}
          {contextMenuEdge && (
            <ContextMenuItem onSelect={() => {
              toast.info("Double-click the edge label to edit it.");
            }}>
              <Edit className="w-4 h-4 mr-2" /> Edit Label
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <div className={cn("absolute top-4 left-4 z-10 transition-opacity", isPresentationMode && "opacity-0 pointer-events-none")}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9 w-64"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <div className={cn("flex gap-2 transition-opacity", isPresentationMode && "opacity-0 pointer-events-none")}>
          <Button variant="outline" size="icon" onClick={undo} disabled={pastStates.length === 0} title="Undo (Cmd+Z)"><Undo className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={futureStates.length === 0} title="Redo (Cmd+Shift+Z)"><Redo className="w-4 h-4" /></Button>
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
          <Button variant="outline" onClick={handleGenerateReport} disabled={isGeneratingReport} title="Generate AI Report">
            {isGeneratingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Report
          </Button>
          <Button onClick={handleSave} title="Save Wheel (Cmd+S)"><Save className="w-4 h-4 mr-2" />Save</Button>
        </div>
        <Button variant="outline" size="icon" onClick={() => setIsPresentationMode(p => !p)} title={isPresentationMode ? "Exit Presentation Mode" : "Enter Presentation Mode"}>
          {isPresentationMode ? <X className="w-4 h-4" /> : <Presentation className="w-4 h-4" />}
        </Button>
      </div>
      <Toaster richColors />
      {/* Hidden container for rendering the report for PDF generation */}
      <div className="absolute -z-10 -left-[9999px] top-0">
        <ReportPreview ref={reportPreviewRef} data={reportData} />
      </div>
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