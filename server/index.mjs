import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createQlooClient } from './qloo.mjs';
import { planNight } from './agent.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const port = Number(process.env.PORT) || 8787;

const qloo = createQlooClient({
  apiKey: process.env.QLOO_API_KEY || '',
  baseUrl: process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com',
  forceMock: process.env.MOCK_QLOO === '1' || !process.env.QLOO_API_KEY,
});

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(root, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'tastecrew',
    qlooMode: qloo.mock ? 'mock' : 'live',
    baseUrl: qloo.baseUrl,
  });
});

app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'q required' });
    const data = await qloo.search(q);
    res.json({ mode: qloo.mock ? 'mock' : 'live', ...data });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, body: e.body });
  }
});

app.post('/api/plan', async (req, res) => {
  try {
    const body = req.body || {};
    if (!Array.isArray(body.members) || body.members.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 members with likes[]' });
    }
    const plan = await planNight(qloo, body);
    res.json(plan);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`TasteCrew listening on http://127.0.0.1:${port} (qloo=${qloo.mock ? 'mock' : 'live'})`);
});
