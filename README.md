# Heckers AI Checkers

Heckers is a modern web prototype for fast checkers duels with a product angle: rules-first gameplay, AI opponent, AI Coach explanations, local progress, city leaderboard, match history, themes, blitz timer, share-link concept, and a Pro upgrade surface.

## Who it is for

The product is aimed at students and casual players in Kazakhstan and nearby markets who want short, tactical games rather than a plain board. The city leaderboard and 3-minute duels make the app feel like a lightweight competitive service, while AI Coach turns each match into training.

## What is built

- 8x8 playable checkers board with legal diagonal movement.
- Mandatory captures, chained captures, promotion to kings, winner detection.
- Local two-player mode, AI mode, and training mode.
- Three AI difficulty levels.
- Move hints and AI Coach feedback during and after a match.
- 3-minute blitz timers.
- Dark and light themes.
- Match history and progress saved in `localStorage`.
- City leaderboard prototype.
- Upgrade to Pro modal for monetization direction.
- Share-link button that models friend invites.
- Responsive layout for desktop and mobile.

## Differentiators

- **Daily Tactic Sprint:** a dedicated puzzle-like challenge mode that rewards XP.
- **Daily Tasks:** rotating daily objectives for warm-up moves, captures, coach use, and puzzle starts.
- **AI Coach Report:** a shareable post-game summary with style DNA, tactical risk, rank, and advice.
- **Danger Heatmap:** a toggle that marks pieces currently exposed to captures.
- **Blunder Shield:** warns players before they make a move that gives the opponent an immediate capture.
- **Live Eval + Risk Meter:** a real-time arena ribbon that shows position evaluation, danger, and combo state.
- **Predicted Reply:** highlights the likely response after the player selects a move.
- **AI Personas:** Coach, Hunter, and Fortress opponents change the AI's play style.
- **City Cup:** a mini tournament layer that makes the prototype feel like a competitive service.
- **Replay Lab:** a timeline for reviewing tempo and tactical moments.
- **Focus Mode:** hides the side panel for a cleaner tournament-like board experience.
- **Arena Sounds + Capture Animations:** Web Audio move/capture/warning sounds, combo feedback, arena badges, landing motion, board shake, and confetti for tactical moments.
- **Academy Missions:** retention quests for wins, captures, hints, and daily challenges.
- **Player Style DNA:** labels players as Hunter, Builder, or Balanced based on their decisions.
- **Cosmetic Skins:** Classic Arena, Cyber Mint, and Kids School board styles as a monetization path.
- **Achievement Unlocks:** new board/table styles unlock through XP, hints, City Cup progress, and daily tasks.
- **Arena Menu:** a full in-app menu for starting games, launching daily tasks, toggling focus mode, viewing profile stats, and applying unlocked styles.
- **City League:** a local leaderboard concept built around city identity, starting with Алматы.

## Why it is valuable

Most checkers apps stop at moving pieces. Heckers is positioned as a habit-forming training arena: fast matches, local identity through city rankings, post-game learning, and a clear path to monetization through Coach+, seasons, and cosmetic skins.

## How to run

Open `index.html` in a browser. No build step is required.

For a deployed version, this can be uploaded as a static site to GitHub Pages, Netlify, Vercel, or Replit.

## Next startup-ready steps

- Add WebSocket rooms for real multiplayer by invite link.
- Replace the prototype leaderboard with Supabase or Firebase.
- Add account auth and cloud game history.
- Use a stronger engine for deeper coach analysis.
- Connect Stripe checkout for Pro subscriptions and skin purchases.
