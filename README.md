const STORAGE_KEY = 'lol5stackDraftAssistant.v1';
const TAGS = ['tank','frontline','engage','disengage','peel','cc','ap','ad','scaling','early','poke','pick','splitpush','dive','enchanter','utility'];
let champions = [];
let version = 'latest';
let state = { players: defaultPlayers() };

const championList = document.querySelector('#championList');
const playersEl = document.querySelector('#players');
const template = document.querySelector('#playerTemplate');

init();

async function init() {
  loadState();
  renderPlayers();
  await loadDataDragon();
  renderPlayers();
  document.querySelector('#suggestBtn').addEventListener('click', suggestComp);
  document.querySelector('#resetDemo').addEventListener('click', () => { state = demoState(); saveState(); renderPlayers(); });
}

async function loadDataDragon() {
  try {
    const versions = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(r => r.json());
    version = versions[0];
    const data = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/de_DE/champion.json`).then(r => r.json());
    champions = Object.values(data.data).map(c => ({ id: c.id, key: c.key, name: c.name, image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}` }));
    championList.innerHTML = champions.map(c => `<option value="${c.name}"></option>`).join('');
    document.querySelector('#patchBadge').textContent = `Data Dragon Patch ${version}`;
  } catch (e) {
    document.querySelector('#patchBadge').textContent = 'Data Dragon nicht erreichbar';
    console.error(e);
  }
}

function defaultPlayers() {
  return ['Top','Jungle','Mid','ADC','Support'].map((role, i) => ({ name: `Spieler ${i+1}`, role, pool: [] }));
}

function demoState() {
  return { players: [
    { name: 'Top', role: 'Top', pool: [champ('Ornn',5,['tank','frontline','engage','cc','scaling']), champ('Gwen',4,['ap','scaling','splitpush']), champ('Renekton',4,['ad','early','dive'])] },
    { name: 'Jungle', role: 'Jungle', pool: [champ('Jarvan IV',5,['engage','frontline','cc','early','ad']), champ('Sejuani',4,['tank','engage','cc','peel']), champ('Karthus',3,['ap','scaling'])] },
    { name: 'Mid', role: 'Mid', pool: [champ('Orianna',5,['ap','scaling','utility','cc']), champ('Ahri',4,['ap','pick','mobility']), champ('Jayce',3,['ad','poke','early'])] },
    { name: 'ADC', role: 'ADC', pool: [champ('Jinx',5,['ad','scaling']), champ('Caitlyn',4,['ad','poke','early']), champ('Kai\'Sa',4,['ad','ap','dive','scaling'])] },
    { name: 'Support', role: 'Support', pool: [champ('Nautilus',5,['tank','engage','cc']), champ('Lulu',4,['enchanter','peel','utility','scaling']), champ('Rakan',4,['engage','peel','utility'])] }
  ]};
}
function champ(name, comfort, tags) { return { name, comfort, tags }; }

function renderPlayers() {
  playersEl.innerHTML = '';
  state.players.forEach((player, idx) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.player-card');
    const name = node.querySelector('.player-name');
    const role = node.querySelector('.player-role');
    const search = node.querySelector('.champ-search');
    const comfort = node.querySelector('.comfort');
    const tags = node.querySelector('.tags');
    name.value = player.name; role.value = player.role;
    name.addEventListener('input', () => { player.name = name.value; saveState(); });
    role.addEventListener('change', () => { player.role = role.value; saveState(); });
    node.querySelector('.add-champ').addEventListener('click', () => {
      const found = findChampion(search.value);
      if (!found) return alert('Champion nicht gefunden. Prüfe Schreibweise oder Data Dragon Verbindung.');
      player.pool.push({ name: found.name, comfort: Number(comfort.value), tags: guessTags(found.name) });
      search.value = ''; saveState(); renderPlayers();
    });
    player.pool.forEach((c, cIdx) => {
      const img = championImage(c.name);
      const tag = document.createElement('span'); tag.className = 'tag';
      tag.innerHTML = `${img ? `<img src="${img}" alt="">` : ''}<b>${c.name}</b> C${c.comfort}<small>${c.tags.join(', ')}</small><button title="entfernen">×</button>`;
      tag.querySelector('button').onclick = () => { player.pool.splice(cIdx,1); saveState(); renderPlayers(); };
      tags.appendChild(tag);
    });
    playersEl.appendChild(node);
  });
}

function suggestComp() {
  const banned = normalizeList(document.querySelector('#enemyBans').value + ',' + document.querySelector('#allyBans').value);
  const locked = normalizeList(document.querySelector('#lockedPicks').value);
  const goal = document.querySelector('#compGoal').value;
  const picks = [];
  for (const player of state.players) {
    const candidates = player.pool.filter(c => !banned.includes(norm(c.name)) && !picks.some(p => norm(p.champ.name) === norm(c.name)));
    let best = null;
    for (const c of candidates) {
      const score = scoreChampion(c, goal, picks, locked);
      if (!best || score > best.score) best = { player, champ: c, score };
    }
    if (best) picks.push(best);
  }
  renderResult(picks, goal);
}

function scoreChampion(c, goal, picks, locked) {
  let score = c.comfort * 10;
  if (locked.includes(norm(c.name))) score += 100;
  if (c.tags.includes(goal)) score += 20;
  if (goal === 'balanced') score += 8;
  const current = picks.flatMap(p => p.champ.tags);
  for (const need of ['frontline','engage','cc']) if (!current.includes(need) && c.tags.includes(need)) score += 8;
  const hasAp = current.includes('ap'), hasAd = current.includes('ad');
  if (!hasAp && c.tags.includes('ap')) score += 7;
  if (!hasAd && c.tags.includes('ad')) score += 7;
  if (current.filter(t => t === 'scaling').length < 2 && c.tags.includes('scaling')) score += 4;
  return score;
}

function renderResult(picks, goal) {
  const result = document.querySelector('#result');
  if (picks.length < 5) {
    result.className = 'result';
    result.innerHTML = `<p>Für ${5 - picks.length} Rolle(n) fehlt ein verfügbarer Champion im Pool.</p>`;
    return;
  }
  const tags = picks.flatMap(p => p.champ.tags);
  const counts = Object.fromEntries(TAGS.map(t => [t, tags.filter(x => x === t).length]));
  const type = goalLabel(goal, counts);
  const strengths = [];
  if (counts.frontline || counts.tank) strengths.push('Frontline');
  if (counts.engage) strengths.push('Engage');
  if (counts.cc >= 2) strengths.push('viel CC');
  if (counts.ap && counts.ad) strengths.push('AP/AD Balance');
  if (counts.scaling >= 2) strengths.push('Scaling');
  if (counts.poke) strengths.push('Poke');
  const weakness = [];
  if (!counts.frontline && !counts.tank) weakness.push('wenig Frontline');
  if (!counts.engage) weakness.push('kein klarer Engage');
  if (!counts.ap) weakness.push('kaum AP-Schaden');
  if (!counts.ad) weakness.push('kaum AD-Schaden');
  result.className = 'result comp';
  result.innerHTML = `
    <div class="pick-grid">${picks.map(p => `<div class="pick"><img src="${championImage(p.champ.name)}" alt=""><b>${p.player.role}</b><br>${p.player.name}<h3>${p.champ.name}</h3><small>Comfort ${p.champ.comfort} · ${p.champ.tags.join(', ')}</small></div>`).join('')}</div>
    <div class="score"><span>Comp: <b>${type}</b></span><span>Stärken: ${strengths.join(', ') || 'Comfort Picks'}</span><span>Risiken: ${weakness.join(', ') || 'keine großen Lücken'}</span></div>
    <p><b>Erklärung:</b> Diese Auswahl nimmt zuerst sichere Comfort-Picks und gleicht danach Team-Bausteine aus. Wichtig sind Frontline, Engage, CC und gemischter Schaden. Dein Wunschziel wird extra gewichtet.</p>
  `;
}

function goalLabel(goal, counts) {
  if (goal !== 'balanced') return document.querySelector(`#compGoal option[value="${goal}"]`).textContent;
  if (counts.engage && counts.scaling) return 'Balanced Teamfight';
  if (counts.poke >= 2) return 'Poke / Siege';
  if (counts.pick >= 2) return 'Pick / Catch';
  return 'Balanced';
}
function guessTags(name) {
  const presets = { 'Ornn':['tank','frontline','engage','cc','scaling'], 'Malphite':['tank','frontline','engage','cc'], 'Jinx':['ad','scaling'], 'Nautilus':['tank','engage','cc'], 'Lulu':['enchanter','peel','utility','scaling'], 'Orianna':['ap','scaling','utility','cc'], 'Jarvan IV':['ad','engage','frontline','cc','early'] };
  return presets[name] || ['ad'];
}
function findChampion(value) { return champions.find(c => norm(c.name) === norm(value) || norm(c.id) === norm(value)); }
function championImage(name) { const c = findChampion(name); return c?.image || ''; }
function normalizeList(text) { return text.split(/[,\n]/).map(norm).filter(Boolean); }
function norm(s) { return String(s || '').trim().toLowerCase().replace(/['’\.\s]/g,''); }
function loadState() { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = JSON.parse(raw); }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
