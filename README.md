# QuizBuzz – Voice-Quiz Engine

Eine kompetitive, responsive Echtzeit-Web-App für Live-Quiz-Spiele mit Voice-Antworten. Spielbar auf Handy, Tablet und PC. Deutschsprachige Oberfläche.

## Architektur

- **Monorepo** mit npm-Workspaces: `shared/`, `server/`, `client/`
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vite + React 18 + TypeScript + TailwindCSS
- **State**: Zustand (Client) + server-autoritativer Spiel-State
- **Voice**: Aktuell über externen Sprach-Chat (z. B. Discord); LiveKit-Integration ist geplant.

## Lokal starten

```bash
npm install
npm run dev
```

Das startet:
- Server: `http://localhost:3001`
- Client: `http://localhost:5173`

Der Vite-Dev-Server leitet `/socket.io` und `/api` automatisch an den Server weiter.

### Test

1. Tab 1: Name eingeben → **„Raum erstellen"** (Moderator)
2. Tab 2 / Handy: Raum-Code eingeben → **„Mitspielen"**
3. Optional Tab 3: `/present/<code>` für Beamer-Ansicht

## Deployment

### 1. GitHub-Repository erstellen

1. Auf [github.com](https://github.com) ein neues leeres Repository anlegen (z. B. `quizbuzz`).
2. In diesem Projektordner Terminal öffnen:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN_USERNAME/quizbuzz.git
git push -u origin main
```

### 2. Auf Render.com deployen

Empfohlene kostenlose Option: [Render.com](https://render.com)

1. Bei Render anmelden und mit GitHub verbinden.
2. **New Web Service** → GitHub-Repository `quizbuzz` auswählen.
3. Render erkennt die `render.yaml` automatisch. Falls nicht, manuell eintragen:
   - **Runtime**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Root Directory**: `/`
4. **Deploy** klicken.

Der Server baut das Frontend (`client/dist`) und liefert es selbst aus – damit Socket.IO und API auf derselben Domain laufen.

### Wichtige Hinweise

- **Dies ist ein MVP** mit In-Memory-Speicher. Räume werden nach 10 Minuten Inaktivität gelöscht.
- **Server-Neustarts** (z. B. bei kostenlosem Render-Plan nach Inaktivität) löschen alle aktiven Spiele.
- Für Produktion mit persistenter Datenbank und Moderator-Login ist ein Follow-up (Prisma + Auth) geplant.

## Moderator-Funktionen

- Spiel starten / Kategorie-Voting erzwingen / auflösen
- Live-Frage erstellen und direkt stellen
- Hotkeys während Hot-Seat: ↑ richtig / ↓ falsch / Leertaste für Kontext-Aktionen
- Spieler kicken, Punkte zurücksetzen, Einstellungen ändern (Timer, TTS, Kategorie-Anzahl)
- Spiel beenden
- Exklusive Lösungsanzeige (nur Moderator sieht die Antwort)

## Lizenz

MIT
