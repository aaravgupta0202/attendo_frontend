# Attendo — Icons & Splash Screens Guide

Place all files inside your `/icons/` folder at the root of the project.

---

## App Icons (PNG, square, transparent or with padding)

| File                     | Size      | Used for |
|--------------------------|-----------|----------|
| `icon-16.png`            | 16×16     | Browser favicon tab |
| `icon-32.png`            | 32×32     | Browser favicon HD |
| `icon-72.png`            | 72×72     | Android legacy |
| `icon-96.png`            | 96×96     | Android, shortcut icons |
| `icon-128.png`           | 128×128   | Chrome Web Store / general |
| `icon-144.png`           | 144×144   | Windows tile (IE/Edge) |
| `icon-152.png`           | 152×152   | iPad (non-Retina) home screen |
| `icon-167.png`           | 167×167   | iPad Pro home screen |
| `icon-180.png`           | 180×180   | iPhone home screen (all modern iPhones) |
| `icon-192.png`           | 192×192   | Android home screen, PWA manifest |
| `icon-192-maskable.png`  | 192×192   | Android adaptive icon (safe zone = centre 75%) |
| `icon-256.png`           | 256×256   | General / desktop |
| `icon-384.png`           | 384×384   | Android splash / Windows tile |
| `icon-512.png`           | 512×512   | PWA splash screen, Play Store |
| `icon-512-maskable.png`  | 512×512   | Android adaptive icon large (safe zone = centre 75%) |

> **Maskable icons**: Keep your logo/art inside the central 75% of the canvas (the "safe zone").
> The outer 25% can be cut off in a circle, squircle, or rounded square by Android.

---

## iOS Splash Screens (PNG, exact pixel dimensions)

Apple requires portrait splash screens at the exact device resolution.

| File                        | Dimensions  | Device |
|-----------------------------|-------------|--------|
| `splash-1290x2796.png`      | 1290×2796   | iPhone 14/15 Plus, iPhone 15 Pro Max |
| `splash-1179x2556.png`      | 1179×2556   | iPhone 14/15 Pro |
| `splash-1170x2532.png`      | 1170×2532   | iPhone 12/13/14 |
| `splash-1125x2436.png`      | 1125×2436   | iPhone X/XS/11 Pro |
| `splash-828x1792.png`       | 828×1792    | iPhone XR/11 |
| `splash-750x1334.png`       | 750×1334    | iPhone SE (2nd/3rd gen), iPhone 8 |
| `splash-2048x2732.png`      | 2048×2732   | iPad Pro 12.9" |
| `splash-1668x2388.png`      | 1668×2388   | iPad Pro 11" |
| `splash-1640x2360.png`      | 1640×2360   | iPad Air (5th gen) |
| `splash-1536x2048.png`      | 1536×2048   | iPad mini, iPad (9th gen) |

**Splash screen design tip**: Use a plain background matching your `theme_color`
(`#4f46e5` / indigo) with your logo centred. Keep it simple — it shows for <1s.

---

## Optional: Screenshots (for richer install prompt on Android/desktop)

| File                    | Size       | Used for |
|-------------------------|------------|----------|
| `screenshot-mobile.png` | 390×844    | Android/Chrome install dialog (narrow) |
| `screenshot-desktop.png`| 1280×800   | Desktop Chrome install dialog (wide) |

---

## Quick way to generate all icons

### Option A — Use a PWA icon generator online
1. **PWABuilder** (free): https://www.pwabuilder.com/imageGenerator  
   Upload a 512×512 PNG of your logo → downloads a ZIP with all sizes

2. **Favicon.io**: https://favicon.io/favicon-converter/  
   Good for standard favicon sizes

3. **RealFaviconGenerator**: https://realfavicongenerator.net  
   Generates favicons + Apple touch icons + Windows tiles

### Option B — Use sharp / Jimp in Node.js
```bash
npm install sharp
node -e "
const sharp = require('sharp');
const sizes = [16,32,72,96,128,144,152,167,180,192,256,384,512];
sizes.forEach(s => sharp('source-1024.png').resize(s,s).toFile('icons/icon-'+s+'.png'));
"
```

### Option C — Figma / Sketch
Design at 1024×1024, export at each size listed above.

---

## Folder structure
```
your-project/
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-167.png
│   ├── icon-180.png
│   ├── icon-192.png
│   ├── icon-192-maskable.png
│   ├── icon-256.png
│   ├── icon-384.png
│   ├── icon-512.png
│   ├── icon-512-maskable.png
│   ├── splash-1290x2796.png
│   ├── splash-1179x2556.png
│   ├── splash-1170x2532.png
│   ├── splash-1125x2436.png
│   ├── splash-828x1792.png
│   ├── splash-750x1334.png
│   ├── splash-2048x2732.png
│   ├── splash-1668x2388.png
│   ├── splash-1640x2360.png
│   ├── splash-1536x2048.png
│   ├── screenshot-mobile.png   (optional)
│   └── screenshot-desktop.png  (optional)
├── index.html
├── stats.html
├── setup.html
├── manifest.json
├── service-worker.js
├── browserconfig.xml
├── css/
└── js/
```

---

## Testing the PWA

### Chrome DevTools
1. Open the site → DevTools → **Application** tab
2. Check **Manifest** section — should show all icons, no errors
3. Check **Service Workers** — should show as "Activated and running"
4. Click **Lighthouse** → run a PWA audit → aim for 100

### iOS Safari
1. Open in Safari → Share button → "Add to Home Screen"
2. Confirm the icon and name look correct

### Android Chrome
1. Chrome shows an install banner automatically (after a few visits)
2. Or: ⋮ menu → "Add to Home Screen" / "Install app"

### Desktop Chrome/Edge
1. Address bar shows an install icon (⊕) on the right
2. Or: ⋮ menu → "Install Attendo"
