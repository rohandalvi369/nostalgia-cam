# nostalgia cam

A retro photo filter app. Upload a photo, flip through vintage filter presets with sliders that automatically adjust to each filter's values, then save or share the result.

## Features

- **12 filter presets** — Flash III, Dirty, Y2K, Night Club, Paparazzi, Lo-Fi, VHS, Polaroid, Disposable, Sepia, Mono, Toy Cam
- **Auto-syncing sliders** — brightness, contrast, saturation, and grain snap to each filter's parameters; fine-tune any value
- **Save to device** — download edited images directly
- **In-memory gallery** — browse recent edits in a film-strip view
- **Streak counter** — tracks daily usage
- **Surprise me** — randomizes filter + sliders

All image processing runs client-side via Canvas — zero uploads to any server.

## Tech

- React 18
- Vite 5
- framer-motion
- Canvas 2D API (pixel-level filters)

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```
