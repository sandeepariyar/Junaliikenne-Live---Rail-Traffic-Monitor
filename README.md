# 🚆 Junaliikenne Live – Rail Traffic Monitor

> **Mission-critical Finnish rail traffic control-room operator dashboard (1440×900 desktop baseline). Designed and engineered by Sandeep Pariyar.**

![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-3FB950?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-WebGL%20Shader-4DA3FF?style=for-the-badge&logo=three.js)
![Lit Web Components](https://img.shields.io/badge/Lit-Web%20Components-325cff?style=for-the-badge&logo=lit)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Fintraffic Open Data](https://img.shields.io/badge/Data-Digitraffic%20Live%20API-F0A030?style=for-the-badge)

---

## 🧭 Overview

**Junaliikenne Live** is a high-contrast, calm dark-theme supervisory dashboard engineered specifically for Finnish railway dispatchers and traffic controllers (Fintraffic / VR operations). It combines real-time situational awareness with rapid incident response tools:

1. **Dual Visualization Engines**:
   - **2D Schematic GIS Map**: Planar vector network with track circuits, station occupancy indicators, and delay cascade vectors.
   - **3D Elävä kartta (Living Map)**: Real-time 3D WebGL engine built with Three.js and custom GLSL shaders featuring faceted terrain elevation, volumetric train headlight cones, and trailing trip paths.
2. **Dynamic Delay Cascading & Ripple Shader**:
   - Concentric amber ripple waves at **Tampere Central Hub** showing real-time propagation of delays to connecting trains.
3. **Real-Time Fintraffic Digitraffic API & Operational Scenario Switch**:
   - Instant toggle between a **curated incident training drill** (IC 27 delay hold, IC 35 Salo cancellation, Oulu FMI blizzard) and **100% live GPS positions** streamed directly from Finland's open railway APIs.
4. **Figma & Lit Web Components Design System**:
   - Reusable, accessible custom elements with Shadow DOM encapsulation: `<ft-status-badge>`, `<ft-alert-card>`, `<ft-tabs>`, `<ft-toggle>`, and `<ft-segmented-control>`.

---

## 🎨 Design Tokens & Accessibility (WCAG 2.2 AA)

Built on an 8px spacing grid with guaranteed contrast ratios exceeding 4.5:1:

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--bg-primary` | `#0E141B` | Deep control-room neutral canvas |
| `--surface` | `#16202A` | Primary structural panels & cards |
| `--surface-raised` | `#1C2836` | Active states & card hover elevations |
| `--border-subtle` | `#243444` | Hairline panel boundaries & grid lines |
| `--text-primary` | `#F2F5F7` | Body & heading copy (12.8:1 contrast) |
| `--text-secondary` | `#9BA9B8` | Metadata & timestamps (6.2:1 contrast) |
| `--color-ok` | `#3FB950` | Nominal / On-time status (`Ajallaan`) |
| `--color-warning` | `#F0A030` | Delay warning (`+12 min`, Tampere hub) |
| `--color-danger` | `#F25555` | Cancelled / Blockage (`Peruttu`, Salo) |
| `--color-info` | `#4DA3FF` | Focus rings, telemetry & active routes |

> **Icon + Text Guarantee**: Status indicators never rely on color alone. Every badge pairs a semantic icon (`Check`, `Clock`, `X`, `TrendingUp`) with explicit text.

---

## ⚡ Key Features

### 1. Top Bar Control Strip
- Train indicator with pulsing live telemetry dot.
- Centered universal search field (`Hae junaa, asemaa tai kohdetta…`) with `Ctrl+K` keyboard shortcut.
- Segmented control for **2D | 3D Elävä kartta**.
- Quick toggles for **Fokustila** (dimming peripheral widgets) and **Vähennä liikettä** (`prefers-reduced-motion` compliance).
- Bilingual toggle (**FI / EN**) with complete localized UI strings.
- Lead Operator profile: **Sandeep Pariyar** (`Pääoperaattori`).
- Real-time European 24-hour clock.

### 2. "Huomio nyt" (Attention Now) Incident Row
Three ranked operator alert cards with impact evaluations and direct dispatch actions:
- **#1 Amber clock**: `IC 27 myöhässä 12 min` · *3 vaihtoyhteyttä vaarassa Tampereella* · `Ehdota: pidä S 365 3 min`.
- **#2 Red X**: `IC 35 peruttu` · *n. 240 matkustajaa* · `Tilaa korvaavat bussit (2 kpl)`.
- **#3 Blue trend**: `Oulun radalla myöhästymiset 3× normaalia` · *Lumisade – FMI* · `Aseta talvinopeus 140 km/h`.

### 3. 3D Elävä kartta Shader Architecture
In 3D mode, the terrain is shaded with a custom GLSL fragment shader that evaluates flat faceted normals directly on the GPU without CPU mesh splitting:

```glsl
// Custom GLSL faceted normal shader formula
vec3 fdx = dFdx(vWorldPosition);
vec3 fdy = dFdy(vWorldPosition);
vec3 normal = normalize(cross(fdx, fdy));
```

- **Tampere Delay Ripple**: A circular wave equation expands outward across the terrain mesh in amber (`#F0A030`), indicating the ripple epicenter.
- **TripsLayer Light Trails**: Moving 3D train pods emit directional volumetric headlight cones and trailing luminous ribbons.
- **FMI Snow Simulation**: Swirling 3D snow particles in the northern Oulu quadrant.
- **Camera Presets**: One-click jumps between **Koko Suomi**, **Tampere Hub (+12m)**, and **Oulu Lumieste**.

### 4. Junaliikenteen tilanne (Traffic Status Panel)
- Tabbed data view with full keyboard navigation (`ArrowLeft` / `ArrowRight`):
  - **Myöhästymiset (Delays)**: High-density sortable table with columns `Juna`, `Reitti`, `Arvio`, and `Tila`.
  - **Asemat (Stations)**: Platform count, active trains, and delay index for Helsinki, Tampere, Turku, Oulu, Jyväskylä, Kuopio, and Rovaniemi.
  - **Häiriöt (Disturbances)**: Root-cause telemetry for track switches, catenary maintenance, and weather alerts.

### 5. Timeline Replay Scrubber
- Bottom-left timeline slider: `-60 min … Nyt … +30 min ennuste`.
- Interactive play/pause and manual scrubbing to inspect historical delay buildup and forecast future cascading effects.

### 6. Vuoron yhteenveto (Shift Handover Synthesis)
- Pinned handover log: *"Aamu rauhallinen, kaksi peruutusta Turun radalla."*
- One-click clipboard copy of the formal shift handover report signed by **Sandeep Pariyar**.
- Interactive **Design System Documentation** viewer modal for testing component variants.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js & Vite
- **Language**: TypeScript (strict types, zero runtime `any`)
- **3D Graphics & Shaders**: Three.js (r160+) with custom GLSL shaders
- **Web Components**: LitElement (`@customElement`, Shadow DOM, CSS custom properties)
- **Styling**: Tailwind CSS v4 + Design Token CSS variables
- **Icons**: Lucide Icons
- **Data**: Fintraffic Digitraffic Open REST API (`https://rata.digitraffic.fi`) & FMI open data

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/junaliikenne-live.git
cd junaliikenne-live

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building for Production

```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── design-system/       # Reusable Figma-style components
│   │   │   ├── FtStatusBadge.tsx
│   │   │   ├── FtAlertCard.tsx
│   │   │   ├── FtTabs.tsx
│   │   │   ├── FtToggle.tsx
│   │   │   ├── FtSegmentedControl.tsx
│   │   │   ├── FtTableRow.tsx
│   │   │   └── FtButton.tsx
│   │   ├── web-components/      # Standards-compliant Lit Web Components
│   │   │   ├── FtStatusBadgeElement.ts
│   │   │   ├── FtAlertCardElement.ts
│   │   │   ├── FtTabsElement.ts
│   │   │   ├── FtToggleElement.ts
│   │   │   └── index.ts
│   │   ├── map/                 # 2D & 3D WebGL maps
│   │   │   ├── RailMapCanvas.tsx
│   │   │   └── ThreeDLiveMap.tsx
│   │   ├── TopBar.tsx           # Global header & operator identity
│   │   ├── AttentionNowRow.tsx  # Ranked incident cards
│   │   ├── TrafficStatusPanel.tsx# High-density data table
│   │   ├── TimelineReplay.tsx   # Daily replay scrubber
│   │   ├── ShiftSummaryCard.tsx # Handover report card
│   │   ├── QuickSearchModal.tsx # Ctrl+K command search
│   │   └── ComponentStorybookModal.tsx # Design system inspector
│   ├── data/
│   │   └── railData.ts          # Stations, tracks, disturbance seeds, translations
│   ├── store/
│   │   └── railStore.ts         # EventTarget reactive store & live GPS poller
│   ├── types/
│   │   └── index.ts             # TypeScript domain interfaces
│   ├── App.tsx                  # Root 1440x900 viewport container
│   ├── index.css                # Global token definitions & focus rings
│   └── main.tsx
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 👤 Author & Architecture

**Sandeep Pariyar**
- Role: Lead System Architect & Front-End Engineer
- Email: sandeep.pariyar@gmail.com

---

## 📄 License

Licensed under the [Apache-2.0 License](LICENSE).
