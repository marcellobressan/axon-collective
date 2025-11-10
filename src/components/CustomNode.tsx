import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useStore } from '@xyflow/react';
import { PlusCircle, Plus, Minus, Info, Vote } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import useWheelStore from '@/store/wheelStore';
import type { WheelNode } from '@shared/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
function CustomNode({ id, data, selected }: NodeProps<WheelNode>) {
  const updateNodeLabel = useWheelStore(s => s.updateNodeLabel);
  const updateNodeDescription = useWheelStore(s => s.updateNodeDescription);
  const addNode = useWheelStore(s => s.addNode);
  const nodeToFocus = useWheelStore(s => s.nodeToFocus);
  const setNodeToFocus = useWheelStore(s => s.setNodeToFocus);
  const editingNodeId = useWheelStore(s => s.editingNodeId);
  const setEditingNodeId = useWheelStore(s => s.setEditingNodeId);
  const toggleNodeCollapse = useWheelStore(s => s.toggleNodeCollapse);
  const castVote = useWheelStore(s => s.castVote);
  const userId = useWheelStore(s => s.userId);
  const isEditing = editingNodeId === id;
  const [label, setLabel] = useState(data.label);
  const [description, setDescription] = useState(data.description || '');
  const [isPulsing, setIsPulsing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { getNode } = useReactFlow();
  const edges = useStore(s => s.edges);
  const hasChildren = useMemo(() => edges.some(edge => edge.source === id), [edges, id]);
  const handleDoubleClick = () => {
    if (data.tier > 3) return;
    setEditingNodeId(id);
  };
  const handleBlur = () => {
    setEditingNodeId(null);
    updateNodeLabel(id, label);
  };
  const handleDescriptionBlur = () => {
    updateNodeDescription(id, description);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLabel(data.label);
      setEditingNodeId(null);
    }
  };
  const handleAddNode = useCallback(() => {
    const thisNode = getNode(id);
    if (thisNode) {
      addNode(thisNode as WheelNode);
    }
  }, [id, getNode, addNode]);
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeCollapse(id);
  };
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);
  // Effect to handle external label changes and trigger pulse
  useEffect(() => {
    if (data.label !== label && !isEditing) {
      setLabel(data.label);
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.label]);
  useEffect(() => {
    if (data.description !== description) {
      setDescription(data.description || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.description]);
  // Effect to handle auto-focusing new nodes
  useEffect(() => {
    if (nodeToFocus === id) {
      setEditingNodeId(id);
      setNodeToFocus(null); // Consume the focus event
    }
  }, [id, nodeToFocus, setNodeToFocus, setEditingNodeId]);
  const nodeColor = data.color || '#6b7280'; // Default to gray
  const probability = data.probability ?? 0;
  const userVote = data.votes?.[userId];
  // Visuals for probability ring
  const normalizedProbability = Math.max(0, (probability - 1) / 4); // Normalize 1-5 scale to 0-1
  const radius = 68; // w-36 is 144px, radius is 72. A bit smaller for padding.
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - normalizedProbability);
  const getProbabilityColor = (probValue: number) => {
    if (probValue === 0) return 'hsl(var(--muted-foreground))';
    // Interpolate from red (0) to yellow (0.5) to green (1)
    const hue = normalizedProbability * 120;
    return `hsl(${hue}, 80%, 50%)`;
  };
  const probabilityColor = getProbabilityColor(probability);
  return (
    <>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: nodeColor, borderColor: nodeColor }}
        className={cn(
          'group relative w-36 h-36 rounded-full shadow-md hover:shadow-xl transition-shadow duration-200 text-white flex items-center justify-center p-4 text-center border-2',
          selected && 'ring-4 ring-offset-2 ring-yellow-400',
          isPulsing && 'animate-pulse'
        )}
        onDoubleClick={handleDoubleClick}
      >
        {data.tier > 0 && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 144 144" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="hsl(var(--border))"
              strokeWidth="4"
              fill="transparent"
              className="opacity-30"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={probabilityColor}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
        )}
        <div className="relative z-10">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full bg-transparent text-white text-center text-sm font-medium resize-none focus:outline-none flex items-center justify-center"
            />
          ) : (
            <div className="text-sm font-medium break-words">{label}</div>
          )}
        </div>
        <Handle type="target" position={Position.Top} className="!bg-teal-500 w-3 h-3 opacity-0" />
        <Handle type="source" position={Position.Bottom} className="!bg-rose-500 w-3 h-3 opacity-0" />
        {data.tier < 3 && (
          <button
            onClick={handleAddNode}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-0.5 bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 z-20"
            aria-label="Add consequence"
          >
            <PlusCircle className="w-5 h-5 text-foreground/80 hover:text-foreground" />
          </button>
        )}
        {hasChildren && (
          <button
            onClick={handleToggleCollapse}
            className="absolute -top-2 -right-2 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20"
            aria-label={data.collapsed ? 'Expand node' : 'Collapse node'}
          >
            {data.collapsed ? <Plus className="w-4 h-4 text-foreground" /> : <Minus className="w-4 h-4 text-foreground" />}
          </button>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="absolute -top-2 -left-2 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20"
              aria-label="View description"
            >
              <Info className="w-4 h-4 text-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80" onPointerDownOutside={(e) => e.preventDefault()}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Node Details</h4>
                <p className="text-sm text-muted-foreground">
                  Add a detailed description for this consequence.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  className="min-h-[100px]"
                  placeholder="Type your description here."
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {data.tier > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20"
                aria-label="Vote on probability"
              >
                <Vote className="w-4 h-4 text-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" onPointerDownOutside={(e) => e.preventDefault()}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Probability Score</h4>
                  <p className="text-sm text-muted-foreground">
                    How likely is this consequence? (1=Unlikely, 5=Very Likely)
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Score:</span>
                  <span className="text-lg font-bold text-primary">{probability.toFixed(2)}</span>
                </div>
                <div className="grid gap-2">
                  <Label>Your Vote</Label>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map((voteValue) => (
                      <Button
                        key={voteValue}
                        variant={userVote === voteValue ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => castVote(id, voteValue)}
                      >
                        {voteValue}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </motion.div>
    </>
  );
}
export default React.memo(CustomNode);