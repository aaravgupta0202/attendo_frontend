# Attendo — Icons Guide

Place all icon files directly in the `/icons/` folder at the root of the project.

## Required Icon Files

| File | Size | Used For |
|------|------|----------|
| `icon-72.png`  | 72×72 | Android legacy |
| `icon-96.png`  | 96×96 | Favicon, Android |
| `icon-128.png` | 128×128 | Chrome Web Store, general |
| `icon-144.png` | 144×144 | Windows tile, Android |
| `icon-152.png` | 152×152 | iPad (non-retina) |
| `icon-180.png` | 180×180 | **iPhone / iPad (main apple-touch-icon)** |
| `icon-192.png` | 192×192 | Android home screen, PWA manifest |
| `icon-192-maskable.png` | 192×192 | Android adaptive icon (safe zone) |
| `icon-256.png` | 256×256 | Windows, general |
| `icon-384.png` | 384×384 | Android extra large |
| `icon-512.png` | 512×512 | **PWA splash screen, Play Store** |
| `icon-512-maskable.png` | 512×512 | Android adaptive icon (safe zone) |

## Optional (for richer install experience)
| File | Size | Used For |
|------|------|----------|
| `screenshot-mobile.png` | 390×844 | App store / install dialog preview |
| `screenshot-desktop.png` | 1280×800 | Desktop install dialog preview |

---

## Design Guidelines

### Regular icons (`icon-*.png`)
- Background: **#4f46e5** (indigo) — solid fill
- Icon: white graduation cap `fa-graduation-cap` or your own logo
- Corners: slightly rounded (about 18–22% radius)
- Safe area: icon content should fill ~85% of the canvas

### Maskable icons (`icon-*-maskable.png`)  
- Same as regular BUT:  
- The **safe zone is only the inner 80%** of the canvas — keep your icon content inside that circle
- Background should fill the ENTIRE canvas edge-to-edge (no transparent edges)
- This is used by Android to create adaptive icons (circle, squircle, etc.)

### Quick approach with Figma / Canva / etc.
1. Start with a **512×512** canvas, solid **#4f46e5** background
2. Place a white graduation cap or your logo, centred, ~340px wide
3. Export as `icon-512.png`
4. For maskable: same design but logo ~280px wide (inner 80% zone), export as `icon-512-maskable.png`  
5. Scale down to all the other sizes listed above

### Online generators (fastest)
- **realfavicongenerator.net** — paste a 512px image, download all sizes
- **pwa-asset-generator** (npm) — auto-generates all sizes from one source image
- **maskable.app** — check your maskable icon looks good across Android shapes

---

## Folder Structure
```
/                      ← project root (where index.html lives)
├── icons/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-180.png
│   ├── icon-192.png
│   ├── icon-192-maskable.png
│   ├── icon-256.png
│   ├── icon-384.png
│   ├── icon-512.png
│   └── icon-512-maskable.png
├── index.html
├── stats.html
├── setup.html
├── manifest.json
├── service-worker.js
├── css/
└── js/
```

The manifest.json and all HTML files already reference `icons/icon-*.png` — just drop the files in and it works.
