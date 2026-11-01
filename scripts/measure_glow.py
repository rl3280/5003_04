r"""Measure LED glow size from a photo and add it to out/qwen/<id>.json.

Usage:
  python scripts\measure_glow.py                 # all records in data\annotations.csv
  python scripts\measure_glow.py pic-16 pic-01   # selected records
  python scripts\measure_glow.py --dry-run pic-16
"""
import colorsys
import csv
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BLUR_RADIUS = 2
MIN_VALUE = 200  # glow pixels must be at least this bright (0-255)
MIN_CHROMA = 60  # and at least this colored (max channel - min channel)
MIN_AREA_PX = 150  # ignore smaller blobs
MAX_GLOWS = 2


def flood(mask, start):
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    seen[start] = True
    queue = deque([start])
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return seen


def components(mask):
    remaining = mask.copy()
    found = []
    for y, x in zip(*np.nonzero(mask)):
        if remaining[y, x]:
            region = flood(remaining, (int(y), int(x)))
            remaining &= ~region
            found.append(region)
    return found


def fill_holes(region):
    outside = np.zeros_like(region)
    h, w = region.shape
    seeds = [(y, x) for y in (0, h - 1) for x in range(w)] + [(y, x) for x in (0, w - 1) for y in range(h)]
    background = np.zeros_like(region)
    for s in seeds:
        if not region[s] and not background[s]:
            background |= flood(~region, s)
    return ~background


def hue_name(rgb):
    hh, _, _ = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    deg = hh * 360
    if deg < 20 or deg >= 340:
        return "red"
    if deg < 45:
        return "orange"
    if deg < 70:
        return "yellow"
    if deg < 170:
        return "green"
    if deg < 260:
        return "blue"
    return "other"


def measure(path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    a = np.asarray(img.filter(ImageFilter.GaussianBlur(BLUR_RADIUS))).astype(float)
    mask = (a.max(axis=2) >= MIN_VALUE) & ((a.max(axis=2) - a.min(axis=2)) >= MIN_CHROMA)
    glows = []
    for region in components(mask):
        region = fill_holes(region)
        area = int(region.sum())
        if area < MIN_AREA_PX:
            continue
        ys, xs = np.nonzero(region)
        radius = (area / np.pi) ** 0.5
        ring = a[region & mask].mean(axis=0)
        glows.append({
            "center_xy": [int(xs.mean()), int(ys.mean())],
            "radius_px": round(float(radius), 1),
            "radius_fraction_of_image_width": round(float(radius / w), 3),
            "color": hue_name(ring),
            "mean_rgb": [int(round(c)) for c in ring],
            "_area": area,
        })
    glows.sort(key=lambda g: -g["_area"])
    for g in glows:
        del g["_area"]
    return {"lit": bool(glows), "glows": glows[:MAX_GLOWS], "image_size": [w, h]}


def main(argv):
    dry = "--dry-run" in argv
    ids = [x for x in argv if not x.startswith("--")]
    with open(ROOT / "data" / "annotations.csv", newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if ids:
        rows = [r for r in rows if r["configuration_id"] in ids]
    for r in rows:
        cid = r["configuration_id"]
        result = measure(ROOT / "img" / r["image_file"])
        result["method"] = "script: bright (>=%d) and colored (chroma>=%d) region, holes filled" % (MIN_VALUE, MIN_CHROMA)
        print(cid, json.dumps(result))
        if dry:
            continue
        out = ROOT / "out" / "qwen" / (cid + ".json")
        if not out.exists():
            print("  SKIPPED (no Qwen file yet):", out)
            continue
        data = json.loads(out.read_text(encoding="utf-8"))
        data["led_glow"] = result
        out.write_text(json.dumps(data, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
