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

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
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
    out.innerHTML = `<p class="warn">${e.message}</p>`;
  } finally {
    btn.disabled = false;
  }
};

function renderPlan(j) {
  const d = j.plan?.dinner;
  const e = j.plan?.entertainment;
  const alts = (j.plan?.alternatives || [])
    .map((a) => `<span class="pill">${a.name}</span>`)
    .join('');
  const shares = (j.split?.shares || [])
    .map((s) => `<li><strong>${s.name}</strong> — <span class="money">$${s.amount}</span></li>`)
    .join('');
  const steps = (j.steps || [])
    .map((s) => `<li><strong>Step ${s.step}.</strong> ${s.name} — ${s.detail}</li>`)
    .join('');
  const why = (j.rationale || []).map((r) => `<li>${r}</li>`).join('');

  out.innerHTML = `
    <p class="muted">${j.whyQloo || ''}</p>
    <h3>Dinner</h3>
    <p><strong>${d?.name || '—'}</strong></p>
    <p class="muted">${d ? JSON.stringify(d.properties || {}) : ''}</p>
    <div>${(d?.tags || []).map((t) => `<span class="pill">${t}</span>`).join('')}</div>
    <h3>Entertainment</h3>
    <p><strong>${e?.name || '—'}</strong></p>
    <h3>Alternatives</h3>
    <div>${alts || '<span class="muted">none</span>'}</div>
    <h3>Fair split (est. night budget)</h3>
    <ul class="steps">${shares}</ul>
    <p class="muted">${j.split?.note || ''}</p>
    <h3>Agent steps</h3>
    <ul class="steps">${steps}</ul>
    <h3>Why this fits the group</h3>
    <ul class="steps">${why}</ul>
    <p class="muted">mode: ${j.mode}</p>
  `;
}

refreshHealth();
