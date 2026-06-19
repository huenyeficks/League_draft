# League 5-Stack Draft Assistant

Kostenloses Starter-Projekt ohne Login, Backend oder Abo.

## Start

1. ZIP entpacken
2. Ordner in VS Code öffnen
3. `index.html` öffnen

Besser: VS Code Extension **Live Server** installieren und `index.html` damit starten.

## Was gefixt ist

- Buttons sind sofort nutzbar, auch wenn Data Dragon langsam lädt.
- Data Dragon hat 6 Sekunden Timeout.
- Wenn Data Dragon nicht erreichbar ist, läuft die App im Offline-Modus ohne Icons weiter.
- Der JavaScript-Syntaxfehler im Ban/Pick-Parser ist behoben.

## Dateien

- `index.html` – Struktur der Seite
- `style.css` – Design
- `app.js` – Logik, Speicherung, Draft-Vorschlag, Data Dragon

## Hosting kostenlos

### GitHub Pages

Repo erstellen, Dateien hochladen, unter Settings → Pages aktivieren.

### Vercel

GitHub Repo verbinden. Vercel erkennt die statische Seite automatisch.

## Eigene Domain

Eine Domain kostet meist extra. Die App selbst braucht kein Abo.

## Riot Hinweis

Dieses Projekt nutzt Riot Data Dragon für statische Championdaten und Icons. Es nutzt keinen Riot API-Key.
Dieses Projekt ist nicht von Riot Games unterstützt. Riot Games, League of Legends und alle zugehörigen Eigenschaften gehören Riot Games, Inc.
