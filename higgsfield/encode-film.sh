#!/usr/bin/env bash
# Deterministische Scroll-Scrub-Encodes für den Oma-Helga-Bulli-Film.
#   bash higgsfield/encode-film.sh desktop       source.mp4  assets/film/omahelga-bulli-desktop.mp4
#   bash higgsfield/encode-film.sh mobile        source.mp4  assets/film/omahelga-bulli-mobile.mp4
#   bash higgsfield/encode-film.sh portrait      portrait.mp4 assets/film/omahelga-bulli-portrait.mp4
#   bash higgsfield/encode-film.sh desktop-webm  source.mp4  assets/film/omahelga-bulli-desktop.webm
#   bash higgsfield/encode-film.sh mobile-webm   source.mp4  assets/film/omahelga-bulli-mobile.webm
#   bash higgsfield/encode-film.sh portrait-webm portrait.mp4 assets/film/omahelga-bulli-portrait.webm
#   bash higgsfield/encode-film.sh poster  assets/film/omahelga-bulli-desktop.mp4 assets/film/omahelga-bulli-desktop-poster.jpg
# Poster IMMER aus dem fertigen Encode ziehen: sie sind exakt das erste Bild, das der Browser dekodiert.
# Kurze GOPs (8 bzw. 4 Frames) ohne Szenenschnitt-Keyframes machen jedes Suchen im Video billig —
# das ist die Voraussetzung dafür, dass der Scroll das Video ruckelfrei vor- und zurückspult.
set -euo pipefail
FFMPEG="${FFMPEG:-ffmpeg}"
usage(){ echo "Usage: $0 desktop|mobile|portrait|desktop-webm|mobile-webm|portrait-webm|poster <input> <output>" >&2; exit 2; }
[ "$#" -eq 3 ] || usage
command -v "$FFMPEG" >/dev/null 2>&1 || { echo "ffmpeg fehlt (FFMPEG=/pfad/zu/ffmpeg setzen)" >&2; exit 127; }
action=$1; input=$2; output=$3
[ -f "$input" ] || { echo "Eingabe fehlt: $input" >&2; exit 2; }
mkdir -p "$(dirname "$output")"
case "$action" in
  desktop)
    "$FFMPEG" -v error -y -i "$input" -an -vf "scale=-2:'min(1080,ih)',unsharp=5:5:0.6:5:5:0.0" \
      -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -profile:v high -level 4.1 \
      -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$output" ;;
  mobile)
    "$FFMPEG" -v error -y -i "$input" -an -vf "scale=-2:'min(720,ih)',unsharp=5:5:0.5:5:5:0.0" \
      -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -profile:v main -level 4.0 \
      -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart "$output" ;;
  portrait)
    "$FFMPEG" -v error -y -i "$input" -an -vf "scale='min(720,iw)':-2,unsharp=5:5:0.5:5:5:0.0" \
      -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -profile:v main -level 4.0 \
      -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart "$output" ;;
  desktop-webm)
    "$FFMPEG" -v error -y -i "$input" -an -vf "scale=-2:'min(1080,ih)',unsharp=5:5:0.6:5:5:0.0" \
      -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -deadline good -cpu-used 3 -pix_fmt yuv420p \
      -g 8 -keyint_min 8 "$output" ;;
  mobile-webm)
    "$FFMPEG" -v error -y -i "$input" -an -vf "scale=-2:'min(720,ih)',unsharp=5:5:0.5:5:5:0.0" \
      -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 3 -pix_fmt yuv420p \
      -g 4 -keyint_min 4 "$output" ;;
  portrait-webm)
    "$FFMPEG" -v error -y -i "$input" -an -vf "scale='min(720,iw)':-2,unsharp=5:5:0.5:5:5:0.0" \
      -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -deadline good -cpu-used 3 -pix_fmt yuv420p \
      -g 4 -keyint_min 4 "$output" ;;
  poster)
    "$FFMPEG" -v error -y -ss 0 -i "$input" -frames:v 1 -q:v 2 -pix_fmt yuvj420p "$output" ;;
  *) usage ;;
esac
echo "fertig: $output"
