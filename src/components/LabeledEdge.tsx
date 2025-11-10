import React, { useState, useEffect, useRef } from 'react';
import {
  EdgeLabelRenderer,
  BaseEdge,
  getSmoothStepPath,
  useReactFlow,
  EdgeProps,
} from '@xyflow/react';
import useWheelStore from '@/store/wheelStore';
import { cn } from '@/lib/utils';
export default function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const updateEdgeLabel = useWheelStore((s) => s.updateEdgeLabel);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label as string || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  const handleBlur = () => {
    if (editedLabel !== label) {
      updateEdgeLabel(id, editedLabel);
    }
    setIsEditing(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditedLabel(label as string || '');
      setIsEditing(false);
    }
  };
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 text-xs bg-background border border-primary rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <div className={cn(
              "px-2 py-1 text-xs rounded-md cursor-pointer hover:bg-muted/80",
              label ? "bg-muted text-foreground" : "text-muted-foreground italic"
            )}>
              {label || 'double-click to label'}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}