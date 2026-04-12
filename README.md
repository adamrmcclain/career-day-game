# Career Day Game

A live-coded game demo built with 3rd graders during a career day presentation.

## Quick start

```bash
npm start
```

Then open **http://localhost:3000** in your browser.

No packages to install — uses only Node.js built-ins.

## Controls

| Key | Action |
|-----|--------|
| ← → ↑ ↓ | Move the character |

## What's here

- `server.js` — tiny Node static file server
- `public/index.html` — game page
- `public/game.js` — all game logic (HTML5 Canvas)
- `public/assets/character.png` — the player sprite
- `images/` — full Kenney Blocky Characters pack (18 characters, 3D models)

## Adding features (kid prompts)

Open `public/game.js`. Everything you need to know is in the comments there.
The `state` object holds all game data; `update()` runs logic; `render()` draws.

See `CLAUDE.md` for the full development context and extension guide.
