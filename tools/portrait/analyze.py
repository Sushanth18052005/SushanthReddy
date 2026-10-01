"""
Reconnaissance pass on the source headshot.

Answers three questions before any asset work happens:
  1. Is there a hard black frame border that needs cropping?
  2. What is the background colour, and is it flat enough to key against?
  3. Are the subject and background actually separable on saturation alone,
     or does a naive matte produce the haloed-hair look we want to avoid?

Run:  python tools/portrait/analyze.py
"""

from __future__ import annotations

import colorsys
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(r"C:\Users\Sushanth Reddy\Downloads\Passportsize_updated(1).jpeg")


def load() -> np.ndarray:
    image = Image.open(SRC).convert("RGB")
    print(f"source           {image.size[0]} x {image.size[1]}  ({SRC.name})")
    return np.asarray(image)


def detect_border(rgb: np.ndarray) -> None:
    """A near-black uniform frame around the image must be cropped before keying."""
    frame = rgb.astype(np.float32).mean(axis=2)
    height, width = frame.shape

    def is_band(line: np.ndarray) -> bool:
        return bool(line.mean() < 40 and line.std() < 12)

    top = next((i for i in range(height) if not is_band(frame[i])), height)
    bottom = next((i for i in range(height - 1, -1, -1) if not is_band(frame[i])), -1)
    left = next((i for i in range(width) if not is_band(frame[:, i])), width)
    right = next((i for i in range(width - 1, -1, -1) if not is_band(frame[:, i])), -1)

    print(f"border           top={top} bottom={height - 1 - bottom} left={left} right={width - 1 - right}")
    if top or left or bottom < height - 1 or right < width - 1:
        print(f"  -> content box  x={left}..{right}  y={top}..{bottom}")


def background_stats(rgb: np.ndarray) -> None:
    """Sample the outer margin, which is backdrop unless the border crop failed."""
    height, width = rgb.shape[:2]
    margin = max(6, min(height, width) // 40)

    strips = np.concatenate(
        [
            rgb[:margin].reshape(-1, 3),
            rgb[-margin:].reshape(-1, 3),
            rgb[:, :margin].reshape(-1, 3),
            rgb[:, -margin:].reshape(-1, 3),
        ]
    ).astype(np.float32)

    mean = strips.mean(axis=0)
    print(f"corner mean RGB  ({mean[0]:.1f}, {mean[1]:.1f}, {mean[2]:.1f})")
    print(f"corner std RGB   ({strips.std(axis=0)[0]:.1f}, {strips.std(axis=0)[1]:.1f}, {strips.std(axis=0)[2]:.1f})")

    # Corners specifically: a gradient backdrop will vary top-to-bottom.
    for name, patch in (
        ("top-left", rgb[:margin, :margin]),
        ("top-right", rgb[:margin, -margin:]),
        ("bottom-left", rgb[-margin:, :margin]),
        ("bottom-right", rgb[-margin:, -margin:]),
    ):
        m = patch.reshape(-1, 3).mean(axis=0)
        print(f"  {name:<13} ({m[0]:6.1f}, {m[1]:6.1f}, {m[2]:6.1f})")


def separation(rgb: np.ndarray) -> None:
    """
    Split the frame into backdrop candidates (low saturation) and subject
    candidates (high saturation or very dark hair). Report the overlap so we
    can judge whether a matte will be clean.
    """
    floats = rgb.astype(np.float32) / 255.0
    mx = floats.max(axis=2)
    mn = floats.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
    val = mx

    print(f"sat  p50={np.percentile(sat, 50):.3f}  p90={np.percentile(sat, 90):.3f}  p99={np.percentile(sat, 99):.3f}")
    print(f"val  p05={np.percentile(val, 5):.3f}  p50={np.percentile(val, 50):.3f}  p95={np.percentile(val, 95):.3f}")

    # Backdrop is desaturated: saturation below 0.10 catches the grey studio wall.
    desat = sat < 0.10
    print(f"desaturated px   {desat.mean() * 100:.1f}%   (backdrop share)")
    print(f"very dark px     {(val < 0.22).mean() * 100:.1f}%   (hair/glasses share)")

    # Row profile of desaturated pixels: the head should break the clean backdrop.
    rows = desat.mean(axis=1)
    head_band = np.argmin(rows[len(rows) // 5 : 3 * len(rows) // 5]) + len(rows) // 5
    print(f"backdrop row profile: min at y={head_band} ({rows[head_band] * 100:.1f}% desaturated)")

    sample = rgb[head_band, rgb.shape[1] // 2]
    print(f"  centre pixel at that row: RGB({sample[0]}, {sample[1]}, {sample[2]})")


def palette(rgb: np.ndarray) -> None:
    """Top colours, so the grading targets real data rather than guesses."""
    small = np.asarray(Image.fromarray(rgb).resize((160, 209), Image.LANCZOS))
    quant = small.reshape(-1, 3)
    buckets: dict[tuple[int, int, int], int] = {}
    for pixel in quant:
        key = (int(pixel[0]) // 16 * 16, int(pixel[1]) // 16 * 16, int(pixel[2]) // 16 * 16)
        buckets[key] = buckets.get(key, 0) + 1

    print("dominant colours (bucketed, 16-level):")
    for key, count in sorted(buckets.items(), key=lambda kv: -kv[1])[:8]:
        h, s, v = colorsys.rgb_to_hsv(key[0] / 255, key[1] / 255, key[2] / 255)
        print(f"  #{key[0]:02x}{key[1]:02x}{key[2]:02x}  {count / len(quant) * 100:5.1f}%   H={h * 360:5.1f} S={s:.2f} V={v:.2f}")


def main() -> int:
    rgb = load()
    print()
    detect_border(rgb)
    print()
    background_stats(rgb)
    print()
    separation(rgb)
    print()
    palette(rgb)
    return 0


if __name__ == "__main__":
    sys.exit(main())
