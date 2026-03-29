# Alpine Flow (Browser Ski Resort Prototype)

Open-world skiing prototype built with Three.js.

## Current multiplayer status

The current build **does not require Supabase**. It uses local simulated skiers to mimic online traffic, so it runs entirely client-side.

If you want true real-time multiplayer, you will need to add a backend (Supabase Realtime is a good fit).

## Supabase setup for real multiplayer (optional next step)

1. Create a Supabase project.
2. Enable Realtime for a `player_states` table.
3. Add Row Level Security policies so players can only update their own state.
4. Store per-player transform snapshots (`x`, `y`, `z`, `heading`, `speed`, `timestamp`).
5. Broadcast high-frequency movement with Realtime channels (10–20hz) and interpolate client-side.
6. Use presence for lightweight lobby/village occupancy and channel membership.
7. Add a cleanup job for stale player records.

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
- Simulated online presence with interpolated AI skiers
- Keyboard + gamepad support
