# Alpine Flow (Browser Ski Resort Prototype)

Open-world skiing prototype built with Three.js.

## Multiplayer modes

- **Offline simulation (default):** runs with AI skiers only, no backend required.
- **Supabase Realtime (online):** if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided, player movement is broadcast/received in real time.

## Supabase realtime setup

1. Create a Supabase project.
2. Copy your project URL and anon key.
3. Set these in the browser before loading the game, for example in DevTools:

```js
localStorage.setItem('SUPABASE_URL', 'https://YOUR_PROJECT.supabase.co');
localStorage.setItem('SUPABASE_ANON_KEY', 'YOUR_ANON_KEY');
location.reload();
```

4. Open the game in two browser windows/tabs (or two devices) to see real-time skier updates.

> This version uses Supabase Realtime broadcast/presence channels (`alpine-flow`) for low-latency state sync and interpolation.

## Run locally

Because this uses ES modules, serve the folder with a local web server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Controls

- `A/D` or left stick: steer
- `Shift` or right trigger: stronger carving
- `Space` or gamepad A: brake / snowplow
- `E` near lift base: board lift

## Features implemented

- Large seamless mountain with multiple natural slope profiles
- Base village hub with lodges
- Animated chairlift transporting player in real time
- Momentum-focused ski feel: downhill acceleration, carving drag, braking
- Third-person lag camera with turn tilt and wide FOV
- Ambient snowfall particle system and atmospheric fog
- Supabase Realtime-powered multiplayer interpolation (with offline fallback)
- Keyboard + gamepad support
