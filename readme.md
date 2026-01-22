<img width="1908" height="1022" alt="image" src="https://github.com/user-attachments/assets/896a754c-f45e-4dd4-82df-ab6c40c48dca" />

````md
# Oracle Core

**Oracle Core** is a cinematic, deep-space “inference console” UI built with **React + Vite + Tailwind + Three.js**.  
It visualizes a prediction payload as **Signal + Confidence + Narrative + Vector Field**, with a particle-globe animation that feels like a sci-fi ops screen.

It runs on **mock data by default** (zero backend required), but can be wired to a real API endpoint in 30 seconds.

---

## ✨ What you get

- **Signal state**: `GREEN / AMBER / RED / UNKNOWN`
- **Confidence**: percent + progress bar
- **Narrative output**: plain language model/engine summary
- **3D particle globe**: Three.js starfield + rotating field
- **Vector feed**: quick list view of “active vectors” (azimuth/elevation/magnitude)
- **Auto-refresh**: pulls a new prediction every **7 seconds**
- **API-ready**: set a single env var and it will call your endpoint

---

## 🧠 Why it exists

Most model demos are either:
1) raw JSON spam, or  
2) over-designed dashboards that hide the core signal.

Oracle Core is the opposite: **one screen**, **fast read**, **operator-friendly**, **clean enough to iterate**.

It’s a UI shell that can sit on top of:
- simulation engines
- governance layers
- autonomy safety rails
- sensor fusion pipelines
- any “predict / decide / explain” flow

---

## 📦 Tech stack

- **React 18**
- **Vite 5**
- **TailwindCSS**
- **Three.js**

---

## ✅ Requirements

- Node.js **18+** recommended
- npm (or pnpm/yarn if you wanna be spicy)

---

## 🚀 Quickstart

```bash
npm install
npm run dev
````

Then open the local URL Vite prints (usually `http://localhost:5173`).

---

## 🏗️ Project structure

```txt
oracle-core/
├─ src/
│  ├─ api/
│  │  └─ base44Client.js
│  ├─ components/
│  │  └─ OracleCore.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ .env.example
└─ .gitignore
```

---

## 🔮 Prediction payload format

Oracle Core expects a prediction object shaped like:

```json
{
  "confidence": 0.86,
  "signal": "GREEN",
  "narrative": "Trajectory stable. No proximate collisions detected.",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "vectors": [
    { "id": 1, "magnitude": 0.4, "azimuth": 120, "elevation": 15 }
  ]
}
```

### Field meanings

**confidence**

* Range: `0.0 → 1.0`
* Rendered as a percentage

**signal**

* `GREEN`, `AMBER` (or `YELLOW`), `RED`, anything else → `UNKNOWN`
* Drives UI coloring and energy vibe

**narrative**

* Any string
* This is the “operator output” — keep it crisp

**timestamp**

* ISO string
* Displayed as “Last update”

**vectors**
Array of objects:

* `id`: unique identifier
* `magnitude`: `0.0 → 1.0`
* `azimuth`: degrees (0–360)
* `elevation`: degrees (-90–90)

These animate as “probe points” orbiting the particle globe.

---

## 🧪 Mock mode (default)

If you do nothing, it runs locally with mock predictions.

Mock data lives inside:

```
src/api/base44Client.js
```

That file exports:

```js
base44.integrations.Core.predict()
```

OracleCore calls that method every 7 seconds.

---

## 🌐 Wiring to a real API

### 1) Create a `.env` file

```bash
cp .env.example .env
```

### 2) Set your API base URL

Example:

```bash
VITE_BASE44_API_URL=https://your-api.example.com
```

### 3) Implement the endpoint

Oracle Core will call:

```
GET {VITE_BASE44_API_URL}/predict
```

Your server must return JSON in the format shown above.

### 4) Run it again

```bash
npm run dev
```

If the endpoint fails, the UI will show an error instead of crashing.

---

## 🧱 Build / preview

Build production assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🔧 Customization ideas

Easy mods that level this up fast:

* Add a **"hold / refresh now"** button
* Add a **history buffer** (last 20 predictions)
* Add **vector trails** for motion readability
* Add a **threat ring overlay** for range gating
* Add a **human authorization panel** (approve/deny actions)
* Add a **replayable audit log** view

This UI is meant to be the *front face* of a governed system.

---

## 🧨 Known limitations (by design)

* No backend included
* No auth included
* No persistence included
* No real “meaning” attached to vectors (they’re a visualization hook)

It’s a **clean starter hull**, not a bloated product.

---

## 🧭 Troubleshooting

### Blank screen

* Make sure `npm install` ran clean
* Restart dev server: `npm run dev`

### API not updating

* Confirm `.env` is set correctly
* Confirm your server responds at `/predict`
* Confirm it returns **valid JSON**
* Check the browser console for fetch errors

### CORS errors

If your API is on a different domain, enable CORS on the server.
(That’s a browser rule, not a code bug.)

---

## 📝 License

Use it, remix it, ship it.
If you turn it into something terrifying, that’s on you 😄

---
