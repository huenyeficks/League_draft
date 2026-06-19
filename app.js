const STORAGE_KEY = 'lol5stackDraftAssistant.v2';
const TAGS = ['tank','frontline','engage','disengage','peel','cc','ap','ad','scaling','early','poke','pick','splitpush','dive','enchanter','utility','mobility'];
const FOCUS_WEIGHTS = {
  balanced: {},
  teamfight: { engage: 2, frontline: 2, tank: 1, cc: 2, scaling: 1 },
  pick: { pick: 3, cc: 2, mobility: 1, poke: 1 },
  poke: { poke: 3, disengage: 2, utility: 1, cc: 1 },
  scaling: { scaling: 3, peel: 2, frontline: 1, enchanter: 1 },
  dive: { dive: 3, engage: 2, mobility: 2, early: 1 }
};

let version = 'latest';
let champions = [];
let state = { players: defaultPlayers() };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

init();

async function init() {
  loadState();
  renderTags();
  renderPlayers();
  await loadDataDragon();
  renderPlayers();
  bindEvents();
}

function bindEvents() {
  $('#suggestBtn').addEventListener('click', suggestComp);
  $('#resetDemo').addEventListener('click', () => {
    state = demoState();
    saveState();
    renderPlayers();
  });
  $('#comfort').addEventListener('input', (e) => $('#comfortOut').textContent = e.target.value);
  $('#addChampion').addEventListener('click', addChampionToPlayer);
}

async function loadDataDragon() {
  try {
    const versions = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(r => r.json());
    version = versions[0];
    const data = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/de_DE/champion.json`).then(r => r.json());
    champions = Object.values(data.data).map(c => ({
      id: c.id,
      key: c.key,
      name: c.name,
      image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`
    })).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    $('#championList').innerHTML = champions.map(c => `<option value="${escapeHtml(c.name)}"></option>`).join('');
    $('#patchBadge').textContent = `Data Dragon Patch ${version}`;
  } catch (error) {
    console.error(error);
    $('#patchBadge').textContent = 'Data Dragon nicht erreichbar';
  }
}

function renderTags() {
  $('#tagPicker').innerHTML = TAGS.map(tag => `
    <label><input type="checkbox" value="${tag}"><span>${tag}</span></label>
  `).join('');
}

function renderPlayers() {
  const playersEl = $('#players');
  const playerSelect = $('#playerSelect');
  playersEl.innerHTML = '';
  playerSelect.innerHTML = '';

  state.players.forEach((player, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${player.role} - ${player.name}`;
    playerSelect.appendChild(option);

    const node = $('#playerTemplate').content.cloneNode(true);
    const card = node.querySelector('.player-card');
    const nameInput = node.querySelector('.player-name');
    const roleSelect = node.querySelector('.player-role');
    const pool = node.querySelector('.pool');

    nameInput.value = player.name;
    roleSelect.value = player.role;
    nameInput.addEventListener('change', () => updatePlayer(index, { name: nameInput.value.trim() || `Spieler ${index + 1}` }));
    roleSelect.addEventListener('change', () => updatePlayer(index, { role: roleSelect.value }));

    if (!player.pool.length) {
      pool.innerHTML = '<p class="empty">Noch keine Champions.</p>';
    } else {
      pool.innerHTML = player.pool.map((champ, champIndex) => championRow(champ, champIndex)).join('');
      pool.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', () => {
          state.players[index].pool.splice(Number(btn.dataset.index), 1);
          saveState();
          renderPlayers();
        });
      });
    }
    playersEl.appendChild(node);
  });
}

function championRow(champ, champIndex) {
  const meta = findChampion(champ.name);
  const img = meta ? meta.image : '';
  return `
    <div class="champ">
      ${img ? `<img src="${img}" alt="${escapeHtml(champ.name)}">` : '<div></div>'}
      <div><strong>${escapeHtml(champ.name)}</strong><small>${champ.comfort}/5 · ${champ.tags.join(', ')}</small></div>
      <button class="remove" data-index="${champIndex}" title="Entfernen">×</button>
    </div>
  `;
}

function addChampionToPlayer() {
  const playerIndex = Number($('#playerSelect').value);
  const rawName = $('#championSearch').value.trim();
  const meta = findChampion(rawName);
  const name = meta ? meta.name : rawName;
  const comfort = Number($('#comfort').value);
  const tags = $$('#tagPicker input:checked').map(input => input.value);

  if (!name || tags.length === 0) {
    alert('Bitte Champion und mindestens einen Tag wählen.');
    return;
  }

  const pool = state.players[playerIndex].pool;
  const existing = pool.find(c => normalize(c.name) === normalize(name));
  if (existing) {
    existing.comfort = comfort;
    existing.tags = tags;
  } else {
    pool.push({ name, comfort, tags });
  }

  $('#championSearch').value = '';
  $$('#tagPicker input').forEach(input => input.checked = false);
  saveState();
  renderPlayers();
}

function suggestComp() {
  const blocked = new Set(parseChampions($('#bans').value).concat(parseChampions($('#picked').value)).map(normalize));
  const focus = $('#focus').value;
  const lists = state.players.map(player => player.pool.filter(champ => !blocked.has(normalize(champ.name))));

  if (lists.some(list => list.length === 0)) {
    $('#result').className = 'result';
    $('#result').innerHTML = '<p>Mindestens ein Spieler hat keinen verfügbaren Champion. Prüfe Pools oder Bans.</p>';
    return;
  }

  let best = null;
  const maxCombos = 20000;
  let checked = 0;

  function walk(index, picks) {
    if (checked > maxCombos) return;
    if (index === lists.length) {
      checked++;
      const score = scoreComp(picks, focus);
      if (!best || score.total > best.score.total) best = { picks: [...picks], score };
      return;
    }
    for (const champ of lists[index]) {
      if (picks.some(p => normalize(p.champ.name) === normalize(champ.name))) continue;
      picks.push({ player: state.players[index], champ });
      walk(index + 1, picks);
      picks.pop();
    }
  }

  walk(0, []);
  if (!best) {
    $('#result').innerHTML = '<p>Keine gültige Kombination gefunden.</p>';
    return;
  }
  renderResult(best, focus, checked);
}

function scoreComp(picks, focus) {
  const tags = {};
  let comfort = 0;
  for (const pick of picks) {
    comfort += pick.champ.comfort;
    for (const tag of pick.champ.tags) tags[tag] = (tags[tag] || 0) + 1;
  }

  const metrics = {
    comfort: Math.round((comfort / 25) * 100),
    frontline: clampScore((tags.frontline || 0) + (tags.tank || 0)),
    engage: clampScore((tags.engage || 0) + (tags.cc || 0)),
    damage: damageBalance(tags.ap || 0, tags.ad || 0),
    scaling: clampScore(tags.scaling || 0),
    peel: clampScore((tags.peel || 0) + (tags.disengage || 0) + (tags.enchanter || 0))
  };

  let total = metrics.comfort * 0.36 + metrics.frontline * 0.14 + metrics.engage * 0.15 + metrics.damage * 0.15 + metrics.scaling * 0.1 + metrics.peel * 0.1;
  const weights = FOCUS_WEIGHTS[focus] || {};
  for (const [tag, weight] of Object.entries(weights)) total += (tags[tag] || 0) * weight * 3;

  return { total: Math.round(Math.min(100, total)), metrics, tags };
}

function renderResult(best, focus, checked) {
  const focusText = $('#focus option:checked').textContent;
  const pickCards = best.picks.map(({ player, champ }) => {
    const meta = findChampion(champ.name);
    return `
      <div class="pick-card">
        ${meta ? `<img src="${meta.image}" alt="${escapeHtml(champ.name)}">` : ''}
        <h3>${escapeHtml(champ.name)}</h3>
        <div class="role">${escapeHtml(player.role)} · ${escapeHtml(player.name)}</div>
        <p>${champ.comfort}/5 Comfort</p>
      </div>
    `;
  }).join('');

  const bars = Object.entries(best.score.metrics).map(([name, value]) => `
    <div class="bar-row"><span>${labelMetric(name)}</span><div class="bar"><div class="fill" style="width:${value}%"></div></div><b>${value}</b></div>
  `).join('');

  $('#result').className = 'result';
  $('#result').innerHTML = `
    <div class="score">${best.score.total}/100</div>
    <p>Fokus: ${focusText}. Geprüfte Kombinationen: ${checked}.</p>
    <div class="comp-grid">${pickCards}</div>
    <div class="bars">${bars}</div>
    <div class="explain">
      <strong>Erklärung</strong>
      <p>${explain(best, focus)}</p>
    </div>
  `;
}

function explain(best, focus) {
  const t = best.score.tags;
  const parts = [];
  if ((t.frontline || 0) + (t.tank || 0) >= 2) parts.push('Ihr habt genug Frontline.');
  else parts.push('Frontline ist eher dünn. Spielt vorsichtiger um Vision und Engage.');
  if ((t.ap || 0) > 0 && (t.ad || 0) > 0) parts.push('Der Schaden ist gemischt, Gegner können schwerer itemizen.');
  else parts.push('Der Schaden ist einseitig. Achtet auf gegnerische Resistenzen.');
  if ((t.engage || 0) + (t.cc || 0) >= 3) parts.push('Ihr habt gute Möglichkeiten, Kämpfe zu starten.');
  if ((t.scaling || 0) >= 2) parts.push('Die Comp wird später stark. Vermeidet unnötige frühe Fights.');
  if (focus !== 'balanced') parts.push('Der gewählte Fokus wurde extra höher bewertet.');
  return parts.join(' ');
}

function defaultPlayers() {
  return ['Top', 'Jungle', 'Mid', 'ADC', 'Support'].map((role, i) => ({ name: `Spieler ${i + 1}`, role, pool: [] }));
}

function demoState() {
  return { players: [
    { name: 'Top', role: 'Top', pool: [champ('Ornn',5,['tank','frontline','engage','cc','scaling']), champ('Gwen',4,['ap','scaling','splitpush']), champ('Renekton',4,['ad','early','dive'])] },
    { name: 'Jungle', role: 'Jungle', pool: [champ('Jarvan IV',5,['engage','frontline','cc','early','ad']), champ('Sejuani',4,['tank','engage','cc','peel']), champ('Karthus',3,['ap','scaling'])] },
    { name: 'Mid', role: 'Mid', pool: [champ('Orianna',5,['ap','scaling','utility','cc']), champ('Ahri',4,['ap','pick','mobility']), champ('Jayce',3,['ad','poke','early'])] },
    { name: 'ADC', role: 'ADC', pool: [champ('Jinx',5,['ad','scaling']), champ('Caitlyn',4,['ad','poke','early']), champ("Kai'Sa",4,['ad','ap','dive','scaling'])] },
    { name: 'Support', role: 'Support', pool: [champ('Nautilus',5,['tank','engage','cc']), champ('Lulu',4,['enchanter','peel','utility','scaling']), champ('Rakan',4,['engage','peel','utility'])] }
  ]};
}

function champ(name, comfort, tags) { return { name, comfort, tags }; }
function updatePlayer(index, patch) { state.players[index] = { ...state.players[index], ...patch }; saveState(); renderPlayers(); }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadState() { try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || state; } catch { state = { players: defaultPlayers() }; } }
function parseChampions(text) { return text.split(/[,
;]/).map(s => s.trim()).filter(Boolean); }
function normalize(text) { return String(text).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function findChampion(name) { return champions.find(c => normalize(c.name) === normalize(name)); }
function clampScore(count) { return Math.min(100, count * 34); }
function damageBalance(ap, ad) { if (ap > 0 && ad > 0) return 100; if (ap + ad >= 4) return 45; return 70; }
function labelMetric(name) { return ({ comfort: 'Comfort', frontline: 'Frontline', engage: 'Engage', damage: 'Damage', scaling: 'Scaling', peel: 'Peel' })[name] || name; }
function escapeHtml(text) { return String(text).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[c])); }
