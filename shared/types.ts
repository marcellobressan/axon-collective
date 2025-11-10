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
export interface WheelNodeData {
  label: string;
  tier: number; // 0 for central, 1 for first-order, etc.
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
}
export type StoredEdge = Edge;
export interface Wheel {
  id: string;
  title: string;
  nodes: StoredNode[];
  edges: StoredEdge[];
}
// Frontend-specific types that extend the stored types
export type WheelNode = Node<WheelNodeData>;
export type WheelEdge = Edge;