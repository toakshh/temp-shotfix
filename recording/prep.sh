#!/usr/bin/env bash
# evidence frames, timeline thumbnails and dashboard covers the synthetic API serves, cut from the rendered ad
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p media
ffmpeg -loglevel error -y -i out/ad_silent.mp4 -c:v libx264 -preset slow -crf 27 -tune grain -pix_fmt yuv420p -g 15 -movflags +faststart media/daybreak_v3.mp4
ex() { ffmpeg -loglevel error -y -ss "$1" -i out/ad_silent.mp4 -frames:v 1 -vf scale=1280:-1 -q:v 3 "media/$2"; }
ex 5.0 ev_f001_ref.jpg; ex 8.05 ev_f001_issue.jpg; ex 15.6 ev_f002_issue.jpg; ex 5.0 ev_f004_ref.jpg
ex 15.6 ev_f004_issue.jpg; ex 1.2 ev_f005_issue.jpg; ex 23.2 ev_f007_issue.jpg
for i in $(seq 0 11); do ffmpeg -loglevel error -y -ss "$((i * 2)).6" -i out/ad_silent.mp4 -frames:v 1 -vf scale=320:-1 -q:v 4 "media/thumb_$(printf %02d "$i").jpg"; done
cover() { ffmpeg -loglevel error -y -f lavfi -i "gradients=s=640x360:c0=$1:c1=$2:x0=0:y0=0:x1=640:y1=360:nb_colors=2,format=rgb24" -frames:v 1 -q:v 4 "media/$3"; }
cover 0x2f4a3a 0xd9b26f past_1.jpg; cover 0x1b2a4a 0x8fa7c9 past_2.jpg; cover 0x5a1f6e 0xff8fb3 past_3.jpg; cover 0x221a33 0x6b5bd6 past_4.jpg
echo "media ready"
