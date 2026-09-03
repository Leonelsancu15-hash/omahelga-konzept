# Oma Helga — Konzept „Deine Feier. Unser Eiswagen."

Eine filmische Neuauflage von omahelga.de als **Verkaufs-Konzept**: Der Bulli fährt beim Scrollen
vor, die Klappe geht auf, die Kamera fährt an die Theke — dazu Kapitel zu Catering, Angebot,
Eisdiele, Region, FAQ und ein Anfrage-Formular. Kein Build-Schritt, reine statische Dateien.

> Der gelbe Balken oben („Konzept-Vorschau") und `<meta name="robots" content="noindex">` zeigen,
> dass dies **nicht** die offizielle Website ist. Beides für den Livegang entfernen.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die komplette Seite (Deutsch), alle Kapitel, Formular, Footer |
| `style.css` | Design-Tokens (Creme, Kakao, Rosa, Mint, Pfirsich, Himmel), Layout, Bewegungsgates |
| `main.js` | Lenis-Smooth-Scroll, GSAP/ScrollTrigger-Choreografie, Scroll-Scrub des Films, HUD, Galerie, Formular |
| `scene.js` | Three.js-Partikelfeld hinter dem Film (pausiert, wenn geparkt/unsichtbar) |
| `assets/film/` | Bulli-Film in drei Schnitten (Desktop, Mobil, Hochkant) als MP4 + WebM + Poster |
| `assets/img/` | Echte Fotos der aktuellen Seite (neu zugeschnitten) + zwei generierte Stills + Logos |
| `higgsfield/` | Prompts, Modelle, Einstellungen und das Encode-Skript für den Film |
| `fonts/`, `vendor/` | Young Serif + Nunito, GSAP 3.12.5, ScrollTrigger, Lenis 1.1.18, Three.js r170 |

## Lokal ansehen

```bash
cd omahelga && python3 -m http.server 8767
# http://127.0.0.1:8767/
```

## Was vor einem Livegang noch zu tun ist

- Konzept-Balken und `noindex` entfernen, Domain/OG-URLs auf omahelga.de setzen.
- Formular: aktuell öffnet der Absende-Button eine vorbereitete E-Mail (`mailto:`). Für den
  Betrieb einen Formular-Endpunkt (z. B. Brevo, Formspree, eigener Worker) anbinden.
- Rechtstexte: Impressum, AGB, Datenschutz verlinken auf die bestehenden Seiten von omahelga.de —
  beim Umzug lokal anlegen.
- Film optional mit dem echten Bulli neu drehen; die Scroll-Mechanik bleibt identisch
  (siehe `higgsfield/encode-film.sh`).
