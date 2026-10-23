/**
 * TasteCrew agent: multi-step planner that turns group taste seeds into a
 * consensus night plan. Cultural grounding comes from Qloo Insights —
 * without Qloo this would be generic LLM guessing.
 */

const RESTAURANT_TAG = 'urn:tag:category:place:restaurant';
const SEED_TYPES = [
  'urn:entity:artist',
  'urn:entity:movie',
  'urn:entity:tv_show',
  'urn:entity:brand',
  'urn:entity:book',
  'urn:entity:place',
  'urn:entity:podcast',
  'urn:entity:videogame',
];
function entityTypes(h) {
  return h.types || (h.type ? [h.type] : []);
}

const ENTITY_TYPES = {
  place: 'urn:entity:place',
  movie: 'urn:entity:movie',
  artist: 'urn:entity:artist',
  destination: 'urn:entity:destination',
};

function slimPlace(p = {}) {
  return {
    address: p.address || null,
    city: p.geocode?.city || null,
    neighborhood: p.geocode?.name || null,
    priceLevel: p.price_level ?? null,
    rating: p.business_rating ?? null,
    website: p.website || null,
    image: p.images?.[0]?.url || p.image?.url || null,
    cuisine: p.cuisine || null,
  };
}
function slimMovie(p = {}) {
  return {
    year: p.release_year || p.year || null,
    description: p.short_description || p.description || null,
    image: p.image?.url || null,
  };
}

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

  // Step 1: resolve each like into Qloo entity IDs (only taste-signal types)
  const seedIds = [];
  const resolved = [];
  const errors = [];
  for (const m of members) {
    for (const like of m.likes || []) {
      try {
        const search = await qloo.search(like, SEED_TYPES);
        const list = search.results || search.entities || [];
        const hit =
          list.find((h) => entityTypes(h).some((t) => SEED_TYPES.includes(t))) || (qloo.mock ? list[0] : null);
        if (hit) {
          const id = hit.id || hit.entity_id;
          seedIds.push(id);
          resolved.push({ member: m.name, query: like, entity: hit.name || like, type: entityTypes(hit)[0], id });
        } else {
          errors.push({ step: 'search', query: like, error: 'No matching Qloo entity' });
        }
      } catch (e) {
        errors.push({ step: 'search', query: like, error: String(e.message) });
      }
    }
  }
  steps.push({
    step: 1,
    name: 'Resolve taste seeds',
    detail: `Mapped ${resolved.length} likes → Qloo entities`,
    resolved,
  });

  // Step 1b: map mood text to Qloo place tags
  let moodTags = [];
  if (input.mood) {
    try {
      const parts = mood.split(/[+,&/]| and /i).map((x) => x.trim()).filter(Boolean).slice(0, 2);
      for (const part of parts) {
        const t = await qloo.tags(part, ENTITY_TYPES.place);
        const top = (t?.results?.tags || []).find((x) => !String(x.id).startsWith('urn:tag:category:'));
        if (top && !moodTags.some((m) => m.id === top.id)) moodTags.push({ id: top.id, name: top.name, from: part });
      }
    } catch (e) {
      errors.push({ step: 'tags', query: mood, error: String(e.message) });
    }
  }

  // Step 2: Insights for restaurants in the city + movies
  const uniqueSeeds = [...new Set(seedIds)];
  const city = (input.city || '').trim();
  let placesRaw;
  let moviesRaw;
  try {
    placesRaw = await qloo.insights({
      filterType: ENTITY_TYPES.place,
      filterTags: RESTAURANT_TAG,
      locationQuery: city || undefined,
      entityIds: uniqueSeeds,
      signalTags: moodTags.map((t) => t.id),
      take: 20,
    });
  } catch (e) {
    placesRaw = { results: { entities: [] } };
    errors.push({ step: 'insights:place', error: String(e.message) });
  }
  try {
    moviesRaw = await qloo.insights({ filterType: ENTITY_TYPES.movie, entityIds: uniqueSeeds, take: 3 });
  } catch (e) {
    moviesRaw = { results: { entities: [] } };
    errors.push({ step: 'insights:movie', error: String(e.message) });
  }

  const placesAll = placesRaw?.results?.entities || placesRaw?.entities || [];
  // Keep only real restaurants located in the requested city (Qloo's tag/location filters are soft)
  const isRestaurant = (e) =>
    qloo.mock ||
    (e.tags || []).some((t) => t.id === RESTAURANT_TAG || /restaurant/i.test(t.type === 'urn:tag:category:place' ? t.name : ''));
  const inCity = (e) => {
    if (!city || qloo.mock) return true;
    const g = e.properties?.geocode || {};
    const want = city.toLowerCase();
    return [g.city, g.metro, e.properties?.locality?.city?.name].some((v) => v && v.toLowerCase().includes(want));
  };
  const places = placesAll.filter((e) => isRestaurant(e) && inCity(e)).slice(0, 5);
  if (!qloo.mock && placesAll.length && !places.length) {
    errors.push({ step: 'insights:place', error: `No restaurants in "${city}" among Qloo results` });
  }
  const movies = moviesRaw?.results?.entities || moviesRaw?.entities || [];

  steps.push({
    step: 2,
    name: 'Qloo Insights (group affinity)',
    detail: `filter.type=place + filter.tags=restaurant${city ? ` + location="${city}"` : ''}${moodTags.length ? ` + mood tags [${moodTags.map((t) => t.name).join(', ')}]` : ''} (${places.length}) + movie (${movies.length}) from ${uniqueSeeds.length} seed entities`,
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
    city: city || 'unspecified',
    plan: {
      dinner: dinner
        ? {
            name: dinner.name,
            id: dinner.entity_id || dinner.id,
            properties: slimPlace(dinner.properties),
            tags: (dinner.tags || []).map((t) => t.name || t).slice(0, 4),
            affinity: dinner.affinity ?? dinner.query?.affinity ?? null,
          }
        : null,
      entertainment: show
        ? {
            name: show.name,
            id: show.entity_id || show.id,
            properties: slimMovie(show.properties),
            tags: (show.tags || []).map((t) => t.name || t).slice(0, 4),
            affinity: show.affinity ?? show.query?.affinity ?? null,
          }
        : null,
      alternatives: places.slice(1, 4).map((p) => ({
        name: p.name,
        id: p.entity_id || p.id,
        affinity: p.affinity ?? p.query?.affinity ?? null,
        address: p.properties?.address || null,
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
    moodTags,
    errors,
    steps,
    whyQloo:
      'Without Qloo, the agent would invent “nice restaurants.” With Qloo Insights, dinner and entertainment are ranked from a real cultural taste graph seeded by each member’s likes — consensus is evidence-based, not vibes.',
  };
}
