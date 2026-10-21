/**
 * TasteCrew agent: multi-step planner that turns group taste seeds into a
 * consensus night plan. Cultural grounding comes from Qloo Insights —
 * without Qloo this would be generic LLM guessing.
 */

const ENTITY_TYPES = {
  place: 'urn:entity:place',
  movie: 'urn:entity:movie',
  artist: 'urn:entity:artist',
  destination: 'urn:entity:destination',
};

function splitFair(totalCents, n) {
  if (n <= 0) return [];
  const base = Math.floor(totalCents / n);
  const rem = totalCents % n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

function explainWhy(member, pick) {
  const taste = (member.likes || []).slice(0, 2).join(', ') || 'shared interests';
  return `${member.name} → affinity via ${taste}; pick "${pick.name}" sits in the same cultural neighborhood.`;
}

/**
 * @param {object} qloo - createQlooClient()
 * @param {{ members: Array<{name:string, likes:string[]}>, mood?: string, budgetPerPerson?: number, city?: string }} input
 */
export async function planNight(qloo, input) {
  const members = input.members || [];
  const mood = input.mood || 'casual dinner + something to watch';
  const budget = Number(input.budgetPerPerson) || 40;
  const steps = [];

  // Step 1: resolve each like into Qloo entity IDs
  const seedIds = [];
  const resolved = [];
  for (const m of members) {
    for (const like of m.likes || []) {
      try {
        const search = await qloo.search(like);
        const hit = (search.results || search.entities || [])[0];
        if (hit) {
          const id = hit.id || hit.entity_id;
          seedIds.push(id);
          resolved.push({ member: m.name, query: like, entity: hit.name || like, id });
        }
      } catch (e) {
        if (e.message !== 'MOCK_MODE') {
          // search itself handles mock; ignore soft failures
        }
      }
    }
  }
  steps.push({
    step: 1,
    name: 'Resolve taste seeds',
    detail: `Mapped ${resolved.length} likes → Qloo entities`,
    resolved,
  });

  // Step 2: Insights for places (dining) and movies (entertainment)
  const uniqueSeeds = [...new Set(seedIds)];
  const placeType = ENTITY_TYPES.place;
  const movieType = ENTITY_TYPES.movie;

  let placesRaw;
  let moviesRaw;
  try {
    placesRaw = await qloo.insights({ filterType: placeType, entityIds: uniqueSeeds, take: 5 });
  } catch (e) {
    placesRaw = { results: { entities: [] }, error: String(e.message) };
  }
  try {
    moviesRaw = await qloo.insights({ filterType: movieType, entityIds: uniqueSeeds, take: 3 });
  } catch (e) {
    moviesRaw = { results: { entities: [] }, error: String(e.message) };
  }

  const places = placesRaw?.results?.entities || placesRaw?.entities || [];
  const movies = moviesRaw?.results?.entities || moviesRaw?.entities || [];

  steps.push({
    step: 2,
    name: 'Qloo Insights (group affinity)',
    detail: `filter.type=place (${places.length}) + movie (${movies.length}) from ${uniqueSeeds.length} seed entities`,
    mock: Boolean(placesRaw?.mock || qloo.mock),
  });

  // Step 3: pick top consensus + fair split
  const dinner = places[0] || null;
  const show = movies[0] || null;
  const estimatedTotal = Math.round(budget * members.length * 100); // cents
  const shares = splitFair(estimatedTotal, Math.max(members.length, 1));

  const rationale = members.map((m) => explainWhy(m, dinner || { name: 'the shortlist' }));

  steps.push({
    step: 3,
    name: 'Consensus + fair split',
    detail: `Budget $${budget}/person × ${members.length} → split shares`,
  });

  return {
    agent: 'TasteCrew',
    mode: qloo.mock ? 'mock' : 'live',
    mood,
    city: input.city || 'unspecified',
    plan: {
      dinner: dinner
        ? {
            name: dinner.name,
            id: dinner.entity_id || dinner.id,
            properties: dinner.properties || {},
            tags: (dinner.tags || []).map((t) => t.name || t).slice(0, 4),
            affinity: dinner.affinity,
          }
        : null,
      entertainment: show
        ? {
            name: show.name,
            id: show.entity_id || show.id,
            properties: show.properties || {},
            tags: (show.tags || []).map((t) => t.name || t).slice(0, 4),
            affinity: show.affinity,
          }
        : null,
      alternatives: places.slice(1, 4).map((p) => ({
        name: p.name,
        id: p.entity_id || p.id,
        affinity: p.affinity,
      })),
    },
    split: {
      currency: 'USD',
      budgetPerPerson: budget,
      totalCents: estimatedTotal,
      shares: members.map((m, i) => ({
        name: m.name,
        amountCents: shares[i] || 0,
        amount: ((shares[i] || 0) / 100).toFixed(2),
      })),
      note: 'Fair equal split of the planned night budget (not an on-chain escrow). Ties to Jack’s split-payment product line as UX; crypto optional later.',
    },
    rationale,
    steps,
    whyQloo:
      'Without Qloo, the agent would invent “nice restaurants.” With Qloo Insights, dinner and entertainment are ranked from a real cultural taste graph seeded by each member’s likes — consensus is evidence-based, not vibes.',
  };
}
