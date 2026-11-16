#!/usr/bin/env bash
# cuts and encodes the landing page media from the recording (out/master.mp4) and the sample ad
set -euo pipefail
cd "$(dirname "$0")"
M=out/master.mp4
AD=out/ad_silent.mp4
D="../public/media"
mkdir -p "$D"
X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -tune animation -movflags +faststart -an"

clip() { # name start duration width fps crf
  ffmpeg -loglevel error -y -ss "$2" -i "$M" -t "$3" -vf "scale=$4:-2:flags=lanczos,fps=$5" $X264 -crf "$6" "$D/$1.mp4"
  ffmpeg -loglevel error -y -ss "$2" -i "$M" -frames:v 1 -vf "scale=$4:-2:flags=lanczos" -q:v 3 "$D/$1.jpg"
}
still() { # name time width
  ffmpeg -loglevel error -y -ss "$2" -i "$M" -frames:v 1 -vf "scale=$3:-2:flags=lanczos" -q:v 3 "$D/$1.jpg"
}

# the full run: desktop at 60 fps, phones at 30
ffmpeg -loglevel error -y -i "$M" -vf "scale=1600:-2:flags=lanczos" $X264 -crf 24 "$D/film.mp4"
ffmpeg -loglevel error -y -i "$M" -vf "scale=1152:-2:flags=lanczos,fps=30" $X264 -crf 26 "$D/film-720.mp4"
still film 0.2 1600

# hero loop and the three steps
clip hero-loop "${HERO_T:-31.9}" "${HERO_D:-7.6}" 1280 60 25
clip step-brief "${BRIEF_T:-4.3}" 8 1280 60 26
clip step-run "${RUN_T:-23.6}" 7.6 1280 60 26
clip step-proof "${PROOF_T:-41.3}" 9.2 1280 60 26

# stills for the audience presets
still who-creators "${CREATORS_T:-37.0}" 1280
still who-agencies "${AGENCIES_T:-63.0}" 1280
still who-brand "${BRAND_T:-40.3}" 1280

# the sample ad, small GOP so scroll-scrubbing seeks fast
ffmpeg -loglevel error -y -i "$AD" -vf "scale=960:-2:flags=lanczos" -c:v libx264 -preset slow -crf 27 -g 3 -keyint_min 3 -sc_threshold 0 -tune grain -pix_fmt yuv420p -movflags +faststart -an "$D/ad-scrub.mp4"
ffmpeg -loglevel error -y -ss 0.2 -i "$AD" -frames:v 1 -vf "scale=960:-2" -q:v 4 "$D/ad-poster.jpg"
cp media/ev_f001_ref.jpg "$D/ev-ref.jpg"
cp media/ev_f001_issue.jpg "$D/ev-issue.jpg"
cp out/ev-garble.jpg "$D/ev-garble.jpg"
for i in $(seq -w 0 11); do cp "media/thumb_$i.jpg" "$D/thumb_$i.jpg"; done
ls -la "$D"
