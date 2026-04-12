# Career Day Game — Claude Context

## What this is

A live-coding demo built during a career day presentation for **3rd graders**.
The game starts simple (arrow-key movement), then the kids suggest prompts and we
build features in real time. There are **4 kid prompts** planned — the content is
unknown until the day.

## Running the project

```bash
npm start
# Open http://localhost:3000
```

No dependencies — uses only Node's built-in `http` and `fs` modules.

## Project structure

```
career-day/
├── server.js          # Static file server (no npm packages)
├── package.json
├── public/
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

## Current game state (baseline)

- **Character** moves with arrow keys (← ↑ → ↓) at 5 px/frame
- Character is clamped to canvas bounds (can't walk off screen)
- Background: sky gradient + sun + clouds + grass strip
- Canvas: 800 × 560

## How to extend (for kid prompts)

All game state lives in the `state` object in `game.js`. The natural extension
points are:

- **New objects** (coins, enemies, obstacles) → add array to `state`, draw in
  `render()`, update logic in `update()`
- **Scoring** → add `state.score`, render text with `ctx.fillText`
- **Different character** → swap `public/assets/character.png` or load multiple
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

To swap: `cp images/kenney_blocky-characters_20/Previews/character-X.png public/assets/character.png`

## Presentation tips

- Run `npm start` before the presentation and leave the tab open
- The browser auto-refreshes on file save if you use a live-reload extension,
  otherwise just Cmd+R after each change
- Keep `game.js` open in your editor so changes are visible to the audience
- Each kid prompt is a new git-style "feature" — narrate what you're adding
