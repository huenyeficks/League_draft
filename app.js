:root {
  --bg: #09111f;
  --panel: #111b2e;
  --panel-2: #17243a;
  --text: #f3f7ff;
  --muted: #9fb0ca;
  --accent: #c89b3c;
  --border: #26364f;
  --good: #83d18f;
  --bad: #ff8b8b;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, system-ui, Arial, sans-serif; background: radial-gradient(circle at top, #14294a, var(--bg)); color: var(--text); }
.hero { display: flex; justify-content: space-between; gap: 24px; padding: 44px clamp(18px, 4vw, 70px); align-items: center; }
.hero h1 { font-size: clamp(34px, 5vw, 64px); margin: 6px 0; }
.hero p { color: var(--muted); max-width: 720px; }
.eyebrow { color: var(--accent) !important; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; }
.hero-card { background: rgba(17, 27, 46, .82); border: 1px solid var(--border); padding: 20px; border-radius: 18px; min-width: 220px; }
.hero-card span { display: block; color: var(--accent); font-weight: 800; margin-bottom: 8px; }
main { padding: 0 clamp(18px, 4vw, 70px) 60px; display: grid; gap: 22px; }
.panel { background: rgba(17, 27, 46, .92); border: 1px solid var(--border); border-radius: 22px; padding: 22px; box-shadow: 0 18px 60px rgba(0,0,0,.22); }
.section-title, .row, .champ-add { display: flex; gap: 10px; align-items: center; justify-content: space-between; }
.players { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.player-card { background: var(--panel-2); border: 1px solid var(--border); padding: 16px; border-radius: 18px; }
input, textarea, select { width: 100%; background: #091321; color: var(--text); border: 1px solid var(--border); border-radius: 12px; padding: 11px; outline: none; }
textarea { min-height: 90px; resize: vertical; }
label { display: grid; gap: 8px; color: var(--muted); font-size: 14px; }
button { border: 0; border-radius: 12px; padding: 11px 14px; cursor: pointer; font-weight: 800; }
.primary { background: var(--accent); color: #17110a; margin-top: 16px; }
.ghost { background: #24334d; color: var(--text); }
.add-champ { width: 44px; background: var(--accent); color: #17110a; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.tag { display: inline-flex; gap: 8px; align-items: center; background: #0c1728; border: 1px solid var(--border); padding: 7px 9px; border-radius: 999px; font-size: 13px; }
.tag img { width: 24px; height: 24px; border-radius: 50%; }
.tag button { padding: 0 5px; background: transparent; color: var(--bad); }
.two-col { display: grid; grid-template-columns: 1.5fr .8fr; gap: 22px; }
.draft-grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 14px; }
.info-box { background: #0c1728; border: 1px solid var(--border); border-radius: 18px; padding: 16px; color: var(--muted); }
.result.empty { color: var(--muted); }
.comp { display: grid; gap: 16px; }
.pick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.pick { background: #0c1728; border: 1px solid var(--border); border-radius: 16px; padding: 12px; }
.pick img { width: 56px; height: 56px; border-radius: 14px; display: block; margin-bottom: 8px; }
.score { display: flex; gap: 10px; flex-wrap: wrap; }
.score span { background: #0c1728; padding: 8px 10px; border: 1px solid var(--border); border-radius: 999px; }
.disclaimer p { color: var(--muted); font-size: 13px; }
.hint { color: var(--muted); }
@media (max-width: 800px) { .hero, .two-col { grid-template-columns: 1fr; display: grid; } .draft-grid { grid-template-columns: 1fr; } }
