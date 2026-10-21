/**
 * Qloo Taste AI client for the Agentic Hackathon.
 * Base URL must be https://hackathon.api.qloo.com — staging/prod reject hackathon keys.
 * Auth: X-Api-Key header (not Bearer).
 */
import { MOCK_ENTITIES, MOCK_SEARCH } from './mock-data.mjs';

const DEFAULT_BASE = 'https://hackathon.api.qloo.com';

export function createQlooClient({ apiKey, baseUrl = DEFAULT_BASE, forceMock = false } = {}) {
  const mock = forceMock || !apiKey;

  async function request(path, params = {}) {
    if (mock) {
      throw new Error('MOCK_MODE');
    }
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
    });
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }
    if (!res.ok) {
      const err = new Error(`Qloo ${res.status}: ${body?.error || body?.message || text.slice(0, 200)}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  async function search(query, types) {
    if (mock) {
      const q = String(query || '').toLowerCase();
      const hits = MOCK_SEARCH.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.aliases || []).some((a) => a.toLowerCase().includes(q))
      );
      return { results: hits.length ? hits : MOCK_SEARCH.slice(0, 5) };
    }
    const params = { query };
    if (types) params.types = Array.isArray(types) ? types.join(',') : types;
    return request('/search', params);
  }

  async function insights({ filterType, entityIds = [], take = 8 }) {
    if (mock) {
      const pool = MOCK_ENTITIES[filterType] || MOCK_ENTITIES['urn:entity:place'] || [];
      // Rank by simple overlap score against seed names in mock
      const seeds = new Set(entityIds.map(String));
      const scored = pool
        .map((e, i) => ({
          ...e,
          affinity: seeds.size ? 0.92 - i * 0.06 : 0.8 - i * 0.05,
        }))
        .slice(0, take);
      return { results: { entities: scored }, mock: true };
    }
    const params = {
      'filter.type': filterType,
      take: String(take),
    };
    if (entityIds.length) {
      params['signal.interests.entities'] = entityIds;
    }
    return request('/v2/insights', params);
  }

  return {
    mock,
    baseUrl: mock ? 'mock://local' : baseUrl,
    search,
    insights,
  };
}
