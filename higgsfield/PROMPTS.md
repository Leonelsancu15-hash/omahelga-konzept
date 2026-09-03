# Oma Helga — Higgsfield-Pipeline (Prompts, Modelle, Einstellungen)

Alles, was Higgsfield für diese Konzept-Ausgabe von omahelga.de erzeugt hat, mit den exakten
Prompts — damit der Look später ohne Raten neu gewürfelt oder erweitert werden kann.
Die echten Fotos (Eistheke, Waffeln, Crêpes, Café, Team, Spritz, Service) stammen von der
aktuellen Website und wurden nur neu zugeschnitten und als JPG + WebP encodiert.

## Referenz-Still — `nano_banana_2`, `2k`, 16:9 (Job `5a060e71-d9ea-4774-b0db-474f4623d0db`)

`assets/img/hero-still.jpg` (1920 breit, Poster-Fallback ohne JS) und `assets/img/og-cover.jpg`
(1200×630, Social-Cover) — gleichzeitig die Bildreferenz für beide Filme und den Hochzeits-Still:

> Photoreal editorial photograph, 35mm film look, warm golden late-afternoon light. A vintage
> pastel-pink and cream VW T3 camper van converted into a small ice-cream bus stands on a sunlit
> riverside promenade in Germany, old trees and glittering water behind it. Side serving hatch
> open with a pink-and-cream striped awning, a small counter with pastel gelato tubs and waffle
> cones, thin mint pinstripe, chrome hubcaps, round headlights. Bus centred, slightly angled,
> plenty of calm sky on the left for a headline. No people, no text, no logos, no lettering,
> no signs. High-end commercial quality.

## Hochzeits-Still — `nano_banana_2` (Server wählte `nano_banana_flash`), `2k`, 4:5, `image_references`: Referenz-Still

`assets/img/hochzeit*.jpg|webp` (Figur im Catering-Kapitel). Erster Wurf trug ein
Fantasie-Schild („SCOOPS") — deshalb im zweiten Wurf die ausdrückliche Text-Sperre:

> Photoreal editorial photograph, 35mm film look, soft warm golden-hour light. A garden wedding
> reception in Germany: the same vintage pastel-pink and cream VW T3 ice-cream bus as in the
> reference image (pink lower body, cream roof, mint pinstripe, striped awning, chrome hubcaps)
> is parked on a lawn beside an old ivy-covered stone country house. Its side serving hatch is
> open with the pink-and-cream striped awning unrolled, showing a small counter with pastel
> gelato tubs and waffle cones and a few warm string lights. In the foreground stands a small
> round table with a white linen cloth, a jar of wildflowers, two glasses of sparkling wine and
> three paper cups of ice cream with small spoons. Rose petals scattered in the grass.
> Absolutely no text, no lettering, no writing, no signs, no chalkboards, no menu boards,
> no logos, no people. Calm, dreamy, romantic, high-end commercial quality.

## Der Film — Helgas Bulli kommt an (eine durchgehende Einstellung, per Scroll gespult)

Referenz für beide Filme (`image_references`): der Referenz-Still oben. Higgsfield schlägt für
diesen Prompt ein Preset vor — mit `declined_preset_id: 24bae836-2c4a-48e0-89b6-49fcc0b21612`
ablehnen; der Scrub braucht genau diese Kamerafahrt (ankommen → Klappe auf → Kamera fährt an
die Theke). Der Bus bleibt im mittleren Drittel, damit der 16:9-Schnitt auch beschnitten
(`object-fit: cover`) auf Tablets funktioniert.

**Desktop 16:9** — `seedance_2_0`, `duration: 15`, `resolution: 720p`, `mode: std`,
`generate_audio: false`, `bitrate_mode: high` (67,5 Credits) — Job `1bf10466-854f-45ee-9159-43d898d82a37`:

> Cinematic live-action shot, warm golden late-afternoon light, photoreal 35mm film look.
> A vintage pastel-pink and cream VW T3 camper van converted into a small ice-cream bus, exactly
> like the reference image (pink lower body, cream roof, thin mint pinstripe, pink-and-cream
> striped awning, chrome hubcaps, round headlights), drives slowly toward the camera along a
> sunlit riverside promenade with old trees and glittering water on the left. It rolls to a
> gentle stop in the exact centre of the frame, slightly angled so the side serving hatch faces
> the camera. The serving hatch folds open and the striped awning unrolls, revealing a small
> ice-cream counter with pastel gelato tubs and waffle cones. The camera then pushes in slowly
> and smoothly toward the counter, shallow depth of field, soft lens flare, tiny drifting pollen
> glowing in the sunlight. The bus stays inside the central third of the frame for the whole
> shot, never leaves frame. No people, no hands, no text, no logos, no lettering, no signs,
> no number plate text. Steady, dreamy, nostalgic, high-end commercial quality.

**Hochkant 9:16** — gleiche Einstellungen, `aspect_ratio: 9:16` (67,5 Credits) —
Job `df52c286-c5a3-47db-af30-f212881fe439`. Prompt identisch, nur die Bildbeschreibung
angepasst: „Vertical 9:16 …, glittering water behind it … the whole bus visible with sky above
and cobblestones below … The bus stays centred and never leaves frame."

Hinweis für einen späteren Neuwurf: Das Modell hat im Hintergrund der 16:9-Fassung ein
römisches Amphitheater erfunden (passt zum Kapitel „Bella Germania", ist aber nicht Bonn).
Wer die Rheinpromenade will, ergänzt im Prompt z. B. „Rhine promenade in Bonn, Siebengebirge
hills on the horizon, no ancient ruins, no monuments".

## Encoding (siehe `encode-film.sh`)

| Variante | Quelle | Ziel | Einstellungen |
|---|---|---|---|
| desktop | 16:9-Film 1280×720 | `omahelga-bulli-desktop.mp4/.webm` | H.264 CRF 21, GOP 8 / VP9 CRF 32 |
| mobile | 16:9-Film | `omahelga-bulli-mobile.mp4/.webm` | ≤720p, CRF 23, GOP 4 / VP9 CRF 34 |
| portrait | 9:16-Film 720×1280 | `omahelga-bulli-portrait.mp4/.webm` | Breite ≤720, CRF 22, GOP 4 / VP9 CRF 33 |
| poster | jeweils fertiger Encode | `*-poster.jpg` | exakt das erste Bild des Encodes |

Kurze GOPs ohne Szenenschnitt-Keyframes sind die Voraussetzung dafür, dass `video.currentTime`
beim Scrollen in beide Richtungen ohne Ruckeln springt.
