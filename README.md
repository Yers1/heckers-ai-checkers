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
