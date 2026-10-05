# Ergonomic Digital Twin — FatigueX

AI-powered Worker Ergonomics and Fatigue-Risk Digital Twin application.

> **MVP Prototype** — PSE Project | See [docs/PRD.md](./docs/PRD.md) for full requirements.

## What It Does

- **Live camera-based pose tracking** via phone camera
- **Digital twin overlay** following worker movements
- **Real-time ergonomic risk scoring** (trunk, neck, shoulders, elbows, knees)
- **Rolling fatigue-risk estimation** with explainable warnings
- **Privacy-first** on-device processing — no video uploaded by default

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Build | Vite |
| State | Zustand |
| Pose AI | MediaPipe Pose Landmarker (upcoming) |
| Rendering | Canvas 2D → WebGL (upcoming) |
| Backend | Optional FastAPI (later) |

## Getting Started

```bash
cd ergonomic-digital-twin
npm install
npm run dev
```

Open on mobile: use the Network URL printed by Vite (e.g., `http://192.168.x.x:5173`).

## Project Structure

```
src/
├── camera/          # Camera stream management (Segment 2)
├── pose/            # MediaPipe pose detection (Segment 2-3)
├── ergonomics/      # Angle calculation & risk scoring (Segment 3-4)
├── fatigue/         # Rolling fatigue-risk estimation (Segment 4-5)
├── digitalTwin/     # Skeleton/3D rendering (Segment 5-6)
├── types/           # TypeScript interfaces for all domain models
├── config/          # Centralized thresholds & constants
├── state/           # Zustand store
├── utils/           # Shared utilities
└── ui/
    ├── components/  # Reusable UI components
    ├── layout/      # AppShell, BottomNav
    └── screens/     # Home, LiveMonitor, Analytics, Settings
```

## Development Segments

| # | Segment | Status |
|---|---------|--------|
| 1 | Project Foundation | ✅ Complete |
| 2 | Camera + Pose Detection | 🔲 Next |
| 3 | Ergonomic Analysis Engine | 🔲 |
| 4 | Fatigue-Risk Engine | 🔲 |
| 5 | Digital Twin Renderer | 🔲 |
| 6 | Alerts + Session Summary | 🔲 |
| 7 | Testing + Polish | 🔲 |

## License

Prototype — PSE Project.
