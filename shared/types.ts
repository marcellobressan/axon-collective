import type { Node, Edge } from '@xyflow/react';
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}
// Axon Collective Types
export interface WheelNodeData extends Record<string, unknown> {
  label: string;
  tier: number; // 0 for central, 1 for first-order, etc.
  color?: string;
  collapsed?: boolean;
}
// We use the @xyflow/react types directly in the frontend,
// but define a compatible structure for the backend to avoid dependency issues.
export interface StoredNode {
  id: string;
  position: { x: number; y: number };
  data: WheelNodeData;
  type?: string;
  width?: number | null;
  height?: number | null;
  hidden?: boolean;
}
export interface StoredEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  hidden?: boolean;
}
export interface Wheel {
  id: string;
  title: string;
  nodes: StoredNode[];
  edges: StoredEdge[];
  lastModified?: number;
}
// Frontend-specific types that extend the stored types
export type WheelNode = Node<WheelNodeData, 'custom'>;
export type WheelEdge = Edge;