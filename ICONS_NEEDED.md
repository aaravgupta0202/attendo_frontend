# Attendo — Icons Needed in `/icons/`

Put all files in a folder called `icons/` at the root of the project (same level as `index.html`).

---

## Required Icons (PNG, transparent or solid background)

| Filename                  | Size        | Used for                                     |
|---------------------------|-------------|----------------------------------------------|
| `icon-72.png`             | 72 × 72     | Android legacy                               |
| `icon-96.png`             | 96 × 96     | Android, favicon, shortcut icons             |
| `icon-128.png`            | 128 × 128   | Chrome Web Store, desktop                    |
| `icon-144.png`            | 144 × 144   | Windows tile                                 |
| `icon-152.png`            | 152 × 152   | iPad (non-retina)                            |
| `icon-167.png`            | 167 × 167   | iPad Pro                                     |
| `icon-180.png`            | 180 × 180   | iPhone (default apple-touch-icon)            |
| `icon-192.png`            | 192 × 192   | Android home screen, manifest                |
| `icon-192-maskable.png`   | 192 × 192   | Android adaptive icon (safe zone = 80%)      |
| `icon-256.png`            | 256 × 256   | Desktop / Windows                            |
| `icon-384.png`            | 384 × 384   | Android high-dpi                             |
| `icon-512.png`            | 512 × 512   | Manifest required, PWA install prompt        |
| `icon-512-maskable.png`   | 512 × 512   | Android adaptive icon large (safe zone = 80%)|

---

## Optional — iOS Splash Screens

These show while the app is loading on iPhone/iPad after being installed.
Only needed if you want a polished iOS launch experience.

| Filename                   | Size (px)      | Device                        |
|----------------------------|----------------|-------------------------------|
| `splash-1290x2796.png`     | 1290 × 2796    | iPhone 14 Pro Max             |
| `splash-1179x2556.png`     | 1179 × 2556    | iPhone 14 Pro                 |
| `splash-1170x2532.png`     | 1170 × 2532    | iPhone 14 / 13 / 12           |
| `splash-1125x2436.png`     | 1125 × 2436    | iPhone X / XS / 11 Pro        |
| `splash-828x1792.png`      | 828 × 1792     | iPhone XR / 11                |
| `splash-750x1334.png`      | 750 × 1334     | iPhone 8 / SE                 |
| `splash-2048x2732.png`     | 2048 × 2732    | iPad Pro 12.9"                |
| `splash-1640x2360.png`     | 1640 × 2360    | iPad Air / iPad 10.9"         |

Splash screens should use your brand background color (`#f8f9fb`) with the logo centred.

---

## Optional — Screenshots (for richer install dialog on Android)

| Filename               | Size (px)   | Purpose                  |
|------------------------|-------------|--------------------------|
| `screenshot-mobile.png`  | 390 × 844   | Shown in Android install dialog |
| `screenshot-desktop.png` | 1280 × 800  | Shown in desktop install dialog |

---

## Tips

- **Maskable icons**: Keep your logo within the centre 80% of the canvas (the "safe zone"). The outer 20% can be cropped to a circle or squircle depending on the Android launcher.
- **Easiest tool**: Use [maskable.app](https://maskable.app/editor) to check your maskable icon, or [realfavicongenerator.net](https://realfavicongenerator.net) to generate all sizes from one source PNG.
- **Minimum to get PWA working**: You only strictly need `icon-192.png` and `icon-512.png` for Chrome/Android to offer the install prompt. Everything else improves the experience.
