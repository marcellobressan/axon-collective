import { IndexedEntity, type Env } from "./core-utils";
import type { User, Chat, ChatMessage, Wheel } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS } from "@shared/mock-data";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "", password: "" };
  static async findByEmail(env: Env, email: string): Promise<User | null> {
    const { items } = await UserEntity.list(env);
    return items.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map((c) => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter((m) => m.chatId === c.id)
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate((s) => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}
export class WheelEntity extends IndexedEntity<Wheel> {
  static readonly entityName = "wheel";
  static readonly indexName = "wheels";
  static readonly initialState: Wheel = { id: "", title: "", nodes: [], edges: [], ownerId: "", visibility: "private" };
}