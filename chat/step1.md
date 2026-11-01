# Step 1: Qwen extraction for a sharp 2×2 image

This prompt is for `pic-16` and similar sharp, top-down 2×2 single-LED images only. Other layouts need their own prompt. Qwen supplies the tile layout and a visual LED observation; the CSV remains the source of truth for measured circuit configuration and observed brightness.

## 1.1 Ask Qwen about pic-16

1. In VS Code, open a **new Continue chat** and select **Qwen3-VL-4B (GenieX QAIRT)**.
2. Attach `img\simple__yellow-10000ohm.jpg` to the Continue chat box.
3. Send this text with the image:

```text
configuration_id: pic-16

ROLE: Visual extractor. Output one JSON object only. No prose, no markdown, no code fences.

The image is a sharp, top-down photo of a 2x2 grid of square tiles. Describe each of the 4 cells exactly once.
Tile types you may see: a round coin-cell battery tile, an LED tile (a round lens with + and - marks), a blue resistor tile with a handwritten value, and a wooden bent-wire tile with an arrow.

OUTPUT: exactly this structure, no other keys:
{
 "configuration_id": "<copy from the configuration_id line above>",
 "cells": {
   "top_left": "<tile>",
   "top_right": "<tile>",
   "bottom_left": "<tile>",
   "bottom_right": "<tile>"
 },
 "led": {
   "lit": true|false,
   "light_color": "<color>"
 }
}

<tile> must be exactly one of:
"battery", "led", "resistor", "bent_wire", "straight_wire", "empty", "unknown"

<color> must be exactly one of:
"green", "yellow", "orange", "red", "white", "blue", "none"

RULES:
1. Exactly 4 entries in "cells". Never more, never fewer.
2. "lit" is true only if the LED lens visibly emits light. A dull or dark lens is false.
3. "light_color" is the color of the emitted light at the brightest part of the glow, not the color of the lens or the tile. If lit is false, light_color is "none".
4. Do not read resistor values. Do not state the topology. Do not estimate the glow size.
5. Output the JSON object and nothing else. Stop after the closing brace.
```

## 1.2 Save and inspect Qwen's reply

1. Check that the reply contains one complete JSON object, with no prose or code fences.
2. For `pic-16`, the expected cells are `battery`, `led`, `resistor`, `bent_wire` in the listed positions. The LED should be lit and yellow or orange.
3. Create `out\qwen\pic-16.json` if needed. Paste only the JSON object into it and save.
4. In a PowerShell terminal opened at the project folder (not the terminal running GenieX), validate the JSON:

```powershell
Get-Content out\qwen\pic-16.json -Raw | ConvertFrom-Json
```


## 1.3 Measure glow with the script

```powershell
python scripts\measure_glow.py pic-16
```

The script prints the result and adds a `led_glow` field to `out\qwen\pic-16.json`. Confirm the file still parses and now has that field:

```powershell
$j = Get-Content out\qwen\pic-16.json -Raw | ConvertFrom-Json
$j.led_glow | Format-List
```

`radius_fraction_of_image_width` is the equivalent radius of the detected bright, colored pixel region divided by the full image width. It is a threshold-based image measurement, not a physical measurement of light or a radius normalized to the LED tile. The thresholds are configurable near the top of `scripts\measure_glow.py`; inspect the detected region and result before treating it as reliable.

## 1.4 Scope and next records

Do not run the 2×2 prompt or the old 26-record verifier on all records. This prompt describes only sharp 2×2 single-LED images. Test `pic-16` first; use a separately checked prompt for other layouts before processing them. When a matching Qwen JSON exists, the glow script can process selected records or all CSV records:

```powershell
python scripts\measure_glow.py pic-16 pic-18 pic-20
python scripts\measure_glow.py
```

Without a matching `out\qwen\<configuration_id>.json`, the script reports `SKIPPED` and does not create that file. `--dry-run` prints measurements only.
