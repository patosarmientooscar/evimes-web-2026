#!/usr/bin/env bash
# Renders planos del hero desde el panorama de la oficina (una vez; ffmpeg v360).
#   escritorio 2560×1440: yaw 0, pitch +5, fov vertical 62 (la apertura cierra a 55)
#   móvil     1080×1920: yaw 0, pitch +5, fov vertical 80 (cierra a 72)
# De cada uno: versión nítida (apertura / modo fijo) y versión desenfocada y
# teñida de navy al 70 % (LCP del hero). Salida: assets/oficina/hero-*.{jpg,webp,avif}
set -e
cd "$(dirname "$0")/.."
SRC=assets/oficina/pano-5792.jpg
OUT=assets/oficina
# h_fov = 2·atan(tan(v_fov/2) · ancho/alto)
render() { # nombre w h vfov hfov
  ffmpeg -v error -y -i "$SRC" -vf "v360=input=e:output=flat:h_fov=$5:v_fov=$4:yaw=0:pitch=5:w=$2:h=$3:interp=lanczos" -q:v 3 "$OUT/hero-$1.jpg"
  ffmpeg -v error -y -i "$OUT/hero-$1.jpg" -vf "gblur=sigma=22:steps=3,drawbox=c=0x080b14@0.7:t=fill" -q:v 4 "$OUT/hero-$1-blur.jpg"
  for v in "$1" "$1-blur"; do
    ffmpeg -v error -y -i "$OUT/hero-$v.jpg" -c:v libwebp -quality 80 "$OUT/hero-$v.webp"
    ffmpeg -v error -y -i "$OUT/hero-$v.jpg" -c:v libaom-av1 -still-picture 1 -crf 32 -cpu-used 4 "$OUT/hero-$v.avif"
  done
}
render desktop 2560 1440 62 93.8
render mobile  1080 1920 80 50.5
ls -la $OUT/hero-*
