# Alpine Flow (Browser Ski Resort Prototype)

Open-world skiing prototype built with Three.js.

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
