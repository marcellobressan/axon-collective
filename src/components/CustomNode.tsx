import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from '@xyflow/react';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import useWheelStore from '@/store/wheelStore';
import type { WheelNodeData, WheelNode } from '@shared/types';
const tierColors = [
  'bg-indigo-500 border-indigo-600', // Tier 0 (Central)
  'bg-sky-500 border-sky-600',       // Tier 1
  'bg-teal-500 border-teal-600',     // Tier 2
  'bg-amber-500 border-amber-600',   // Tier 3
];
function CustomNode({ id, data, selected }: NodeProps<WheelNodeData>) {
  const { updateNodeLabel, addNode } = useWheelStore.getState();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
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
    const thisNode = getNode(id) as Node<WheelNodeData> | undefined;
    if (thisNode) {
      addNode(thisNode);
    }
  }, [id, getNode, addNode]);
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);
  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);
  const colorClass = tierColors[data.tier] || 'bg-gray-500 border-gray-600';
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative w-40 h-[60px] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 text-white flex items-center justify-center p-2 text-center',
        colorClass,
        selected && 'ring-2 ring-offset-2 ring-yellow-400'
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
        <div className="text-sm font-medium truncate">{label}</div>
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