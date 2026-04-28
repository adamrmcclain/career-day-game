# Career Day Game — Claude Context

## What this is

A live-coding demo built during a career day presentation for **3rd graders**.
The game starts simple (arrow-key movement), then the kids suggest prompts and we
build features in real time. There are **4 kid prompts** planned — the content is
unknown until the day.

## Running the project

```bash
npm start
# Open http://localhost:3500
```

No dependencies — uses only Node's built-in `http` and `fs` modules.

## Project structure

```
career-day/
├── server.js          # Static file server (no npm packages)
├── package.json
├── docs/              # Served locally by server.js AND by GitHub Pages
│   ├── index.html     # Game shell — dark background, canvas, title
│   ├── game.js        # All game logic (canvas 2D)
│   └── assets/
│       └── character.png   # Currently: character-b (superhero)
└── images/
    └── kenney_blocky-characters_20/
        └── Previews/   # 18 character PNGs (a–r), 64×64 px
```

## Tech choices & rationale

| Choice | Why |
|---|---|
| Node.js built-in `http` | Presenter is comfortable with Node; no install step |
| HTML5 Canvas | Visual, easy to explain to kids, no framework complexity |
| No bundler / no framework | Less to break live on stage; everything in one `game.js` |
| Zero npm dependencies | `npm start` just works — nothing to install |

## Branch map — presentation safety net

Each branch is a complete, working snapshot. If something breaks during the demo,
`git checkout <branch>` and refresh the browser to jump to a safe state.

```
main                  ← bare-bones baseline (left/right only, no jump)
└── jumping-test      ← W to jump, physics, 1100×700 canvas
    └── feature/obstacle  ← + wooden crate to jump over
        └── feature/npc   ← + NPC character (press A) says "Go Wildcats!"
            └── feature/duck  ← + ↓ to duck (sprite squishes)
```

### Switching branches mid-demo

```bash
git checkout feature/obstacle   # e.g. if duck feature breaks
# Cmd+R in browser — no restart needed
```

### What each branch adds

| Branch | New feature | Key(s) |
|---|---|---|
| `jumping-test` | Jump to halfway up screen | W |
| `feature/obstacle` | Wooden crate — must jump over it | — |
| `feature/npc` | Construction worker NPC with speech bubble | A |
| `feature/duck` | Duck / crouch (sprite squishes 50%) | ↓ |

## Current game state (baseline — `main`)

- **Character** moves left/right only (← →) at 5 px/frame
- Character locked to ground, clamped to canvas bounds
- Background: sky gradient + sun + clouds + grass strip
- Canvas: 1100 × 700

## How to extend (for kid prompts)

All game state lives in the `state` object in `game.js`. The natural extension
points are:

- **New objects** (coins, enemies, obstacles) → add array to `state`, draw in
  `render()`, update logic in `update()`
- **Scoring** → add `state.score`, render text with `ctx.fillText`
- **Different character** → swap `docs/assets/character.png` or load multiple
  images into `assets` and pick by key
- **Sound** → `new Audio('assets/sound.mp3').play()`
- **Animation** → replace single PNG with a sprite sheet and track frame index

## Available characters

All 64×64 PNGs in `images/kenney_blocky-characters_20/Previews/`:

| File | Appearance |
|---|---|
| character-a | Adventurer (blue shirt, hat) |
| character-b | **Superhero (red/blue) ← currently in use** |
| character-c | Green outfit |
| character-d | Construction worker (yellow) |
| character-e | Purple/orange |
| character-f | Dark/ninja |
| character-g | Blue/red stripes |
| character-h through character-r | Additional characters |

To swap: `cp images/kenney_blocky-characters_20/Previews/character-X.png docs/assets/character.png`

## Presentation tips

- Run `npm start` before the presentation and leave the tab open
- The browser auto-refreshes on file save if you use a live-reload extension,
  otherwise just Cmd+R after each change
- Keep `game.js` open in your editor so changes are visible to the audience
- Each kid prompt is a new git-style "feature" — narrate what you're adding
- **Start on `feature/duck`** so all features are visible from the beginning,
  then demo how each one was added by walking through the branch history
