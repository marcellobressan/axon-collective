import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, WheelEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Wheel, StoredNode, User } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // AUTH
  app.post('/api/auth/register', async (c) => {
    const { name, email, password } = (await c.req.json()) as Partial<User>;
    if (!isStr(name) || !isStr(email) || !isStr(password)) {
      return bad(c, 'Name, email, and password are required.');
    }
    if (password.length < 6) {
      return bad(c, 'Password must be at least 6 characters long.');
    }
    const existingUser = await UserEntity.findByEmail(c.env, email);
    if (existingUser) {
      return bad(c, 'A user with this email already exists.');
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      password, // In a real app, hash this!
    };
    const created = await UserEntity.create(c.env, newUser);
    const { password: _, ...userToReturn } = created;
    return ok(c, userToReturn);
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = (await c.req.json()) as Partial<User>;
    if (!isStr(email) || !isStr(password)) {
      return bad(c, 'Email and password are required.');
    }
    const user = await UserEntity.findByEmail(c.env, email);
    if (!user || user.password !== password) { // In a real app, compare hashes!
      return bad(c, 'Invalid credentials.');
    }
    const { password: _, ...userToReturn } = user;
    return ok(c, userToReturn);
  });
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
  app.post('/api/wheels/create-demo', async (c) => {
    const { userId } = (await c.req.json()) as { userId?: string };
    if (!isStr(userId)) return bad(c, 'userId is required');
    const title = "Demo: Adopting a 4-Day Work Week";
    const centralNode = { id: '0', type: 'custom', data: { label: title, tier: 0, color: '#4f46e5' }, position: { x: 0, y: 0 } };
    const n1 = { id: crypto.randomUUID(), type: 'custom', data: { label: 'Improved Employee Well-being', tier: 1, color: '#3b82f6' }, position: { x: 0, y: 0 } };
    const n2 = { id: crypto.randomUUID(), type: 'custom', data: { label: 'Potential for Higher Productivity', tier: 1, color: '#3b82f6' }, position: { x: 0, y: 0 } };
    const n3 = { id: crypto.randomUUID(), type: 'custom', data: { label: 'Operational Challenges', tier: 1, color: '#3b82f6' }, position: { x: 0, y: 0 } };
    const n1_1 = { id: crypto.randomUUID(), type: 'custom', data: { label: 'Lower Burnout & Stress', tier: 2, color: '#0ea5e9' }, position: { x: 0, y: 0 } };
    const n3_1 = { id: crypto.randomUUID(), type: 'custom', data: { label: 'Coordinating with 5-day clients', tier: 2, color: '#0ea5e9' }, position: { x: 0, y: 0 } };
    const demoWheel: Wheel = {
      id: crypto.randomUUID(),
      title,
      nodes: [centralNode, n1, n2, n3, n1_1, n3_1],
      edges: [
        { id: `e-0-${n1.id}`, source: '0', target: n1.id, type: 'labeled', label: 'Direct Effect' },
        { id: `e-0-${n2.id}`, source: '0', target: n2.id, type: 'labeled', label: 'Direct Effect' },
        { id: `e-0-${n3.id}`, source: '0', target: n3.id, type: 'labeled', label: 'Direct Effect' },
        { id: `e-${n1.id}-${n1_1.id}`, source: n1.id, target: n1_1.id, type: 'labeled', label: 'Result of' },
        { id: `e-${n3.id}-${n3_1.id}`, source: n3.id, target: n3_1.id, type: 'labeled', label: 'Result of' },
      ],
      lastModified: Date.now(),
      ownerId: userId,
      visibility: 'private',
    };
    const created = await WheelEntity.create(c.env, demoWheel);
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
  // USERS (now mainly for admin/debug, registration is the primary creation method)
  app.get('/api/users', async (c) => {
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    // Strip passwords before returning
    page.items = page.items.map(u => {
      const { password, ...user } = u;
      return user;
    });
    return ok(c, page);
  });
}