import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from '@xyflow/react';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import useWheelStore from '@/store/wheelStore';
import type { WheelNodeData, WheelNode } from '@shared/types';
function CustomNode({ id, data, selected }: NodeProps<WheelNode>) {
  const { updateNodeLabel, addNode } = useWheelStore.getState();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [isPulsing, setIsPulsing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { getNode } = useReactFlow();
  const handleDoubleClick = () => {
    if (data.tier > 3) return;
    setIsEditing(true);
  };
  const handleBlur = () => {
    setIsEditing(false);
    updateNodeLabel(id, label);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };
  const handleAddNode = useCallback(() => {
    const thisNode = getNode(id);
    if (thisNode) {
      addNode(thisNode as WheelNode);
    }
  }, [id, getNode, addNode]);
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);
  // Effect to handle external label changes and trigger pulse
  useEffect(() => {
    if (label !== data.label) {
      setLabel(data.label);
      if (!isEditing) {
        setIsPulsing(true);
        const timer = setTimeout(() => setIsPulsing(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [data.label, isEditing, label]);
  const nodeColor = data.color || '#6b7280'; // Default to gray
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ backgroundColor: nodeColor, borderColor: nodeColor }}
      className={cn(
        'group relative w-40 h-[60px] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 text-white flex items-center justify-center p-2 text-center border-2',
        selected && 'ring-2 ring-offset-2 ring-yellow-400',
        isPulsing && 'animate-pulse'
      )}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-teal-500 w-3 h-3" />
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent text-white text-center text-sm font-medium resize-none focus:outline-none"
        />
      ) : (
        <div className="text-sm font-medium break-words">{label}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-rose-500 w-3 h-3" />
      {data.tier < 3 && (
        <button
          onClick={handleAddNode}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-0.5 bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
          aria-label="Add consequence"
        >
          <PlusCircle className="w-5 h-5 text-foreground/80 hover:text-foreground" />
        </button>
      )}
    </motion.div>
  );
}
export default React.memo(CustomNode);