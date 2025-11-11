import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, WheelEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Wheel, StoredNode } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // WHEELS
  app.get('/api/wheels', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) {
      return bad(c, 'A user ID is required to fetch wheels.');
    }
    const { items } = await WheelEntity.list(c.env);
    const userWheels = items.filter(w => w.ownerId === userId);
    return ok(c, userWheels);
  });
  app.post('/api/wheels', async (c) => {
    const { title, ownerId } = (await c.req.json()) as { title?: string, ownerId?: string };
    if (!isStr(title)) return bad(c, 'title is required');
    if (!isStr(ownerId)) return bad(c, 'ownerId is required');
    const centralNode = {
      id: '0',
      type: 'custom',
      data: { label: title, tier: 0, color: '#4f46e5' }, // Indigo-600
      position: { x: 0, y: 0 },
    };
    const newWheel: Wheel = {
      id: crypto.randomUUID(),
      title,
      nodes: [centralNode],
      edges: [],
      lastModified: Date.now(),
      ownerId,
      visibility: 'private',
    };
    const created = await WheelEntity.create(c.env, newWheel);
    return ok(c, created);
  });
  app.get('/api/wheels/:id', async (c) => {
    const { id } = c.req.param();
    const userId = c.req.query('userId');
    const wheelEntity = new WheelEntity(c.env, id);
    if (!(await wheelEntity.exists())) return notFound(c, 'Wheel not found');
    const wheel = await wheelEntity.getState();
    if (wheel.visibility === 'public' || (userId && wheel.ownerId === userId)) {
      return ok(c, wheel);
    }
    return notFound(c, 'Wheel not found or access denied');
  });
  app.put('/api/wheels/:id', async (c) => {
    const { id } = c.req.param();
    const { userId, ...wheelData } = (await c.req.json()) as Partial<Wheel> & { userId?: string };
    const wheel = new WheelEntity(c.env, id);
    if (!(await wheel.exists())) return notFound(c, 'Wheel not found');
    const currentWheel = await wheel.getState();
    if (currentWheel.ownerId !== userId) {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    const dataToPatch = { ...wheelData, lastModified: Date.now() };
    await wheel.patch(dataToPatch);
    return ok(c, await wheel.getState());
  });
  app.patch('/api/wheels/:id', async (c) => {
    const { id } = c.req.param();
    const { userId, visibility } = (await c.req.json()) as { userId?: string, visibility?: 'public' | 'private' };
    if (!userId) return bad(c, 'userId is required');
    if (visibility !== 'public' && visibility !== 'private') return bad(c, 'Invalid visibility value');
    const wheel = new WheelEntity(c.env, id);
    if (!(await wheel.exists())) return notFound(c, 'Wheel not found');
    const currentWheel = await wheel.getState();
    if (currentWheel.ownerId !== userId) {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    await wheel.patch({ visibility, lastModified: Date.now() });
    return ok(c, await wheel.getState());
  });
  app.delete('/api/wheels/:id', async (c) => {
    const { id } = c.req.param();
    const userId = c.req.query('userId');
    if (!userId) return bad(c, 'userId is required for deletion');
    const wheel = new WheelEntity(c.env, id);
    if (!(await wheel.exists())) return notFound(c, 'Wheel not found');
    const currentWheel = await wheel.getState();
    if (currentWheel.ownerId !== userId) {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    const deleted = await WheelEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Wheel not found');
    return ok(c, { id, deleted });
  });
  app.post('/api/wheels/:id/nodes/:nodeId/vote', async (c) => {
    const { id: wheelId, nodeId } = c.req.param();
    const { userId, vote } = (await c.req.json()) as { userId?: string; vote?: number };
    if (!isStr(userId) || typeof vote !== 'number' || !Number.isInteger(vote) || vote < 1 || vote > 5) {
      return bad(c, 'userId and an integer vote (1-5) are required');
    }
    const wheel = new WheelEntity(c.env, wheelId);
    if (!(await wheel.exists())) return notFound(c, 'Wheel not found');
    let updatedNode: StoredNode | null = null;
    await wheel.mutate(s => {
      const node = s.nodes.find(n => n.id === nodeId);
      if (!node) {
        throw new Error('Node not found');
      }
      if (!node.data.votes) {
        node.data.votes = {};
      }
      node.data.votes[userId] = vote;
      const votes = Object.values(node.data.votes);
      const sum = votes.reduce((acc, v) => acc + v, 0);
      node.data.probability = votes.length > 0 ? sum / votes.length : 0;
      s.lastModified = Date.now();
      updatedNode = node;
      return s;
    });
    if (!updatedNode) {
      return notFound(c, 'Node not found in wheel');
    }
    return ok(c, updatedNode);
  });
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  // MESSAGES
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
  // DELETE: Users
  app.delete('/api/users/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await UserEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await UserEntity.deleteMany(c.env, list), ids: list });
  });
  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await ChatBoardEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await ChatBoardEntity.deleteMany(c.env, list), ids: list });
  });
}