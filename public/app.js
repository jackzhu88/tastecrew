const defaults = [
  { name: 'Alex', likes: 'Radiohead, Spirited Away' },
  { name: 'Sam', likes: 'Kendrick Lamar, Parasite' },
  { name: 'Jordan', likes: 'Succession, Aesop' },
];

const membersEl = document.getElementById('members');
const out = document.getElementById('out');
const modeBadge = document.getElementById('modeBadge');
const hint = document.getElementById('hint');

function memberCard(data = { name: '', likes: '' }) {
  const div = document.createElement('div');
  div.className = 'member';
  div.innerHTML = `
    <div class="row">
      <div><label>Name</label><input class="name" value="${escapeAttr(data.name)}" /></div>
    </div>
    <label>Likes (artists, movies, brands — comma separated)</label>
    <input class="likes" value="${escapeAttr(data.likes)}" />
  `;
  return div;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const escapeAttr = esc;
function safeUrl(u) {
  return /^https:\/\//i.test(String(u || '')) ? esc(u) : '';
}

function readMembers() {
  return [...membersEl.querySelectorAll('.member')].map((el) => ({
    name: el.querySelector('.name').value.trim() || 'Guest',
    likes: el
      .querySelector('.likes')
      .value.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }));
}

defaults.forEach((d) => membersEl.appendChild(memberCard(d)));
document.getElementById('addMember').onclick = () => {
  membersEl.appendChild(memberCard({ name: '', likes: '' }));
};

async function refreshHealth() {
  try {
    const r = await fetch('/api/health');
    const j = await r.json();
    modeBadge.textContent = j.qlooMode === 'live' ? 'Qloo: LIVE (hackathon API)' : 'Qloo: MOCK (offline demo data)';
    hint.style.display = j.qlooMode === 'live' ? 'none' : 'block';
    hint.textContent = 'Demo data: the server has no Qloo API key configured, so results are offline samples.';
  } catch {
    modeBadge.textContent = 'API offline';
  }
}

document.getElementById('planBtn').onclick = async () => {
  const btn = document.getElementById('planBtn');
  btn.disabled = true;
  out.innerHTML = '<p class="muted">Agent running: resolve seeds → Qloo insights → consensus + split…</p>';
  try {
    const body = {
      members: readMembers(),
      mood: document.getElementById('mood').value,
      budgetPerPerson: Number(document.getElementById('budget').value) || 40,
      city: document.getElementById('city').value,
    };
    const r = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'plan failed');
    renderPlan(j);
  } catch (e) {
    out.innerHTML = `<p class="warn">${esc(e.message)}</p>`;
  } finally {
    btn.disabled = false;
  }
};

function card(item, kind) {
  if (!item) return '<p class="muted">No result from Qloo.</p>';
  const p = item.properties || {};
  const img = safeUrl(p.image);
  const meta =
    kind === 'place'
      ? [p.neighborhood, p.address, p.priceLevel ? '$'.repeat(p.priceLevel) : null, p.rating ? `★ ${p.rating}` : null]
      : [p.year, p.description];
  const link = kind === 'place' && safeUrl(p.website) ? `<a href="${safeUrl(p.website)}" target="_blank" rel="noopener">website</a>` : '';
  return `<div class="pick">
    ${img ? `<img src="${img}" alt="" />` : ''}
    <div><p><strong>${esc(item.name)}</strong></p>
    <p class="muted">${meta.filter(Boolean).map(esc).join(' · ')} ${link}</p>
    <div>${(item.tags || []).map((t) => `<span class="pill">${esc(t)}</span>`).join('')}</div></div>
  </div>`;
}

function renderPlan(j) {
  const alts = (j.plan?.alternatives || [])
    .map((a) => `<span class="pill" title="${esc(a.address || '')}">${esc(a.name)}</span>`)
    .join('');
  const shares = (j.split?.shares || [])
    .map((s) => `<li><strong>${esc(s.name)}</strong> — <span class="money">$${esc(s.amount)}</span></li>`)
    .join('');
  const steps = (j.steps || [])
    .map((s) => `<li><strong>Step ${esc(s.step)}.</strong> ${esc(s.name)} — ${esc(s.detail)}</li>`)
    .join('');
  const why = (j.rationale || []).map((r) => `<li>${esc(r)}</li>`).join('');
  const errs = (j.errors || [])
    .map((e) => `<li>${esc(e.step)}${e.query ? ` “${esc(e.query)}”` : ''}: ${esc(e.error)}</li>`)
    .join('');

  out.innerHTML = `
    ${errs ? `<div class="warn"><strong>Some Qloo calls failed:</strong><ul class="steps">${errs}</ul></div>` : ''}
    <p class="muted">${esc(j.whyQloo)}</p>
    <h3>Dinner in ${esc(j.city)}</h3>
    ${card(j.plan?.dinner, 'place')}
    <h3>Entertainment</h3>
    ${card(j.plan?.entertainment, 'movie')}
    <h3>Alternatives</h3>
    <div>${alts || '<span class="muted">none</span>'}</div>
    <h3>Fair split (est. night budget)</h3>
    <ul class="steps">${shares}</ul>
    <p class="muted">${esc(j.split?.note)}</p>
    <h3>Agent steps</h3>
    <ul class="steps">${steps}</ul>
    <h3>Why this fits the group</h3>
    <ul class="steps">${why}</ul>
    <p class="muted">mode: ${esc(j.mode)}</p>
  `;
}

refreshHealth();
