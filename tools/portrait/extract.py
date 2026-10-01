"""
Turn the source headshot into the two assets the cursor-tracking hero needs:

  public/portrait/subject.webp   RGBA cutout, frame trimmed, edges decontaminated
  public/portrait/depth.webp     matching greyscale depth field (for parallax)

No OpenCV and no rembg — PIL + numpy + scipy only, so the pipeline is
reproducible on a machine that only has the scientific stack.

The matte is a background-subtraction solve rather than a colour key: the studio
backdrop is estimated as a smooth field behind the subject (iteratively, so the
head can occlude it), then alpha comes from RGB distance to that field. Edge
pixels are un-composited against the same field to remove grey fringing, which
is what "pasted on" cutouts always get wrong.

Run:  python tools/portrait/extract.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path(r"C:\Users\Sushanth Reddy\Downloads\Passportsize_updated(1).jpeg")
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "portrait"

TARGET_H = 1400
FRAME_INSET = 4


def load() -> np.ndarray:
    return np.asarray(Image.open(SRC).convert("RGB"))


def band(hits: np.ndarray, start_from_high: bool) -> tuple[int, int]:
    """Collapse a set of indices into the contiguous rule band at either end."""
    ordered = np.sort(hits)
    edge = ordered[0] if start_from_high else ordered[-1]
    run = [int(edge)]
    step = 1 if start_from_high else -1
    probe = int(edge) + step
    while probe in set(int(v) for v in ordered):
        run.append(probe)
        probe += step
    return min(run), max(run)


def frame_box(rgb: np.ndarray) -> tuple[int, int, int, int]:
    """
    The file is a white margin, then a ~9px pure-black frame, then the photo.
    Strict black keeps dark hair from ever qualifying as a rule.
    """
    dark = rgb.max(axis=2) < 80
    height, width = dark.shape

    # A rule row is >50% black; a row of hair peaks well below that.
    row_hits = np.flatnonzero(dark.mean(axis=1) > 0.5)
    if not row_hits.size:
        raise SystemExit("could not locate the black frame's horizontal rules")
    top_band = band(row_hits, True)
    bottom_band = band(row_hits, False)

    # Columns are measured between the rules so only the vertical rules qualify.
    inner = dark[top_band[1] + 40 : bottom_band[0] - 40]
    col_hits = np.flatnonzero(inner.mean(axis=0) > 0.5)
    if not col_hits.size:
        raise SystemExit("could not locate the black frame's vertical rules")
    left_band = band(col_hits, True)
    right_band = band(col_hits, False)

    print(f"frame            x {left_band[0]}..{left_band[1]} / {right_band[0]}..{right_band[1]}   y {top_band[0]}..{top_band[1]} / {bottom_band[0]}..{bottom_band[1]}")

    y0, y1 = top_band[1] + 1 + FRAME_INSET, bottom_band[0] - FRAME_INSET
    x0, x1 = left_band[1] + 1 + FRAME_INSET, right_band[0] - FRAME_INSET
    print(f"content box      {x1 - x0} x {y1 - y0}  (inset {FRAME_INSET}px)")

    ring = np.concatenate(
        [
            rgb[y0 : y0 + 2, x0:x1].reshape(-1, 3),
            rgb[y1 - 2 : y1, x0:x1].reshape(-1, 3),
            rgb[y0:y1, x0 : x0 + 2].reshape(-1, 3),
            rgb[y0:y1, x1 - 2 : x1].reshape(-1, 3),
        ]
    ).astype(np.float32)
    print(f"edge ring mean   ({ring.mean(axis=0)[0]:.1f}, {ring.mean(axis=0)[1]:.1f}, {ring.mean(axis=0)[2]:.1f})  max={ring.max():.0f}")
    return y0, y1, x0, x1


def backdrop_field(px: np.ndarray, passes: int = 3) -> np.ndarray:
    """Smooth estimate of the wall behind the subject, occluded by the subject."""
    floats = px.astype(np.float32)
    height, width = floats.shape[:2]

    mx = floats.max(axis=2) / 255.0
    mn = floats.min(axis=2) / 255.0
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0.0)

    # Seed from confidently-desaturated, mid-brightness pixels: the wall only.
    seed = (sat < 0.12) & (mx > 0.32) & (mx < 0.82)
    if seed.sum() < 1000:
        raise SystemExit("not enough desaturated pixels to seed the backdrop")
    bg0 = np.median(floats[seed], axis=0)

    sigma = min(height, width) * 0.09
    field = np.broadcast_to(bg0, floats.shape).astype(np.float32).copy()
    mask = np.linalg.norm(floats - bg0, axis=2) < 35.0
    coverage = 0.0

    for _ in range(passes):
        weights = ndimage.gaussian_filter(mask.astype(np.float32), sigma)
        weights = np.maximum(weights, 1e-4)
        for channel in range(3):
            blurred = ndimage.gaussian_filter(floats[..., channel] * mask, sigma)
            field[..., channel] = blurred / weights
        dist = np.linalg.norm(floats - field, axis=2)
        keep = dist < 30.0
        # Never let the field collapse: if a pass loses the wall, stop.
        if keep.mean() < 0.05:
            break
        mask = keep
        coverage = float(dist[mask].mean())

    residual = np.linalg.norm(floats - field, axis=2)
    print(f"backdrop seed    RGB({bg0[0]:.0f}, {bg0[1]:.0f}, {bg0[2]:.0f})   wall px {mask.mean() * 100:.1f}%   mean residual {coverage:.1f}")
    return field


def matte(px: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    floats = px.astype(np.float32)
    height, width = floats.shape[:2]
    field = backdrop_field(px)

    dist = np.linalg.norm(floats - field, axis=2)
    t0, t1 = 17.0, 44.0
    alpha = np.clip((dist - t0) / (t1 - t0), 0.0, 1.0)

    # Keep the subject only: fill hair highlights, drop speckle and stray dust.
    present = alpha > 0.06
    labels, count = ndimage.label(present)
    if count > 1:
        sizes = ndimage.sum(present, labels, index=np.arange(1, count + 1))
        present = labels == (int(np.argmax(sizes)) + 1)
    alpha = np.where(present, alpha, 0.0)

    solid = ndimage.binary_fill_holes(alpha > 0.5)
    alpha = np.where(solid & (alpha > 0.5), np.maximum(alpha, 0.92), alpha)
    alpha = np.where(ndimage.binary_fill_holes(alpha > 0.35), np.maximum(alpha, 0.55), alpha)
    alpha = ndimage.gaussian_filter(alpha, 1.15)
    alpha = np.clip((alpha - 0.2) / 0.58, 0.0, 1.0)

    # Holes inside the silhouette (e.g. background seen through the arms) stay.
    print(f"matte            coverage {solid.mean() * 100:.1f}%   bbox {bbox_of(alpha)}")
    verify(alpha)

    # Un-composite the edge: observed = a*F + (1-a)*B, so F = (obs - (1-a)*B)/a.
    # Without this the cutout keeps a pale ring of studio wall around the shirt.
    corrected = floats.copy()
    edge = (alpha > 0.22) & (alpha < 0.995)
    a = alpha[..., None]
    corrected = np.where(edge[..., None], (floats - (1.0 - a) * field) / np.maximum(a, 0.22), floats)
    corrected = np.clip(corrected, 0.0, 255.0)

    before = floats[edge].mean(axis=0)
    after = corrected[edge].mean(axis=0)
    print(f"edge fringe      RGB({before[0]:.0f}, {before[1]:.0f}, {before[2]:.0f}) -> RGB({after[0]:.0f}, {after[1]:.0f}, {after[2]:.0f})")
    return corrected, alpha


def verify(alpha: np.ndarray) -> None:
    """Spot-check the wall, the face and the hairline, where mattes fail."""
    height, width = alpha.shape

    def region(label: str, y0f: float, y1f: float, x0f: float, x1f: float) -> None:
        patch = alpha[int(height * y0f) : int(height * y1f), int(width * x0f) : int(width * x1f)]
        print(f"  {label:<16} mean {patch.mean():.3f}  max {patch.max():.2f}")

    print("matte checks:")
    region("wall top-left", 0.0, 0.03, 0.0, 0.05)
    region("wall top-right", 0.0, 0.03, 0.95, 1.0)
    region("wall left of ear", 0.16, 0.24, 0.015, 0.07)
    region("wall right of ear", 0.16, 0.24, 0.93, 0.985)
    region("face centre", 0.30, 0.36, 0.45, 0.55)
    region("hair crown", 0.03, 0.09, 0.42, 0.58)
    region("shirt hem", 0.96, 1.0, 0.3, 0.7)
    print(f"  edge pixels      {(np.logical_and(alpha > 0.05, alpha < 0.95)).mean() * 100:.2f}% of frame")


def bbox_of(alpha: np.ndarray, pad: int = 0) -> tuple[int, int, int, int]:
    ys, xs = np.where(alpha > 0.02)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1 + pad, int(ys.max()) + 1 + pad


def face_anchor(px: np.ndarray, alpha: np.ndarray) -> dict[str, float]:
    """Locate the eye line: the widest row of skin in the upper half of the head."""
    floats = px.astype(np.float32)
    red, green, blue = floats[..., 0], floats[..., 1], floats[..., 2]
    mx = floats.max(axis=2) / 255.0
    mn = floats.min(axis=2) / 255.0
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0.0)

    skin = (alpha > 0.85) & (red > green) & (green > blue) & (red > 95) & ((red - blue) > 28) & (sat > 0.12) & (sat < 0.72)
    x0, y0, x1, y1 = bbox_of(alpha)
    head_h = y1 - y0

    rows = skin[y0 : y0 + int(head_h * 0.6)].sum(axis=1)
    widest = int(np.argmax(rows)) + y0
    cols = np.where(skin[widest])[0]
    centre_x = float((cols.min() + cols.max()) / 2) if cols.size else float((x0 + x1) / 2)

    height, width = alpha.shape
    anchor = {
        "eyeY": round((widest - head_h * 0.055) / height, 4),
        "faceX": round(centre_x / width, 4),
        "headTop": round(y0 / height, 4),
        "headBottom": round(y1 / height, 4),
        "skinRows": int(rows.sum()),
    }
    print(f"face anchor      eyeY={anchor['eyeY']}  faceX={anchor['faceX']}  head {anchor['headTop']}..{anchor['headBottom']}")
    return anchor


def depth_map(px: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """
    A single still has no depth, so it is inferred. The signed distance from
    the silhouette inflates the bust the way a real one turns — flat at the
    outline, deepest through the skull — and the low-passed studio light (lit
    face forward, hair and jaw back) supplies the rest.
    """
    height = alpha.shape[0]
    solid = alpha > 0.5
    inside = ndimage.distance_transform_edt(solid)
    outside = ndimage.distance_transform_edt(~solid)
    signed = np.where(solid, inside, -outside)

    reach = height * 0.05
    volume = np.clip(signed / reach, 0.0, 1.0)

    floats = px.astype(np.float32)
    lum = (0.299 * floats[..., 0] + 0.587 * floats[..., 1] + 0.114 * floats[..., 2]) / 255.0
    weights = np.maximum(ndimage.gaussian_filter(alpha, height * 0.03), 1e-4)
    lum = ndimage.gaussian_filter(lum * alpha, height * 0.03) / weights
    lo, hi = float(lum.min()), float(lum.max())
    lum = (lum - lo) / max(hi - lo, 1e-6)

    depth = 0.62 * volume + 0.38 * lum
    depth = np.clip(depth, 0.0, 1.0)
    depth = ndimage.gaussian_filter(depth, height * 0.012)
    # Push the near plane away from the far one so the parallax has contrast.
    depth = np.clip(depth, 0.0, 1.0) ** 0.88
    depth = np.where(solid, depth, 0.0)
    print(f"depth field      volume reach {reach:.0f}px   range {depth.min():.2f}..{depth.max():.2f}")
    return depth


def chin_row(px: np.ndarray) -> int:
    """Bottom of the beard: the last strongly dark row through the face centre."""
    height, width = px.shape[:2]
    dark = px.max(axis=2) < 90
    central = dark[:, int(width * 0.38) : int(width * 0.62)].mean(axis=1)
    rows = np.flatnonzero(central > 0.25)
    if not rows.size:
        raise SystemExit("could not locate the jaw line")
    return int(rows.max())


def plate_box(px: np.ndarray, alpha: np.ndarray, eye_y: float, face_x: float) -> tuple[int, int, int, int, float, float]:
    """
    The full crop is a passport frame; the hero needs a tighter bust. Framed so
    the head keeps margin for the parallax to shift into, ending just below the
    jaw rather than at the collar.
    """
    height, width = alpha.shape[:2]
    head_top = int(np.flatnonzero((alpha > 0.5).any(axis=1))[0])
    chin = chin_row(px)

    half_w = int(round(width * 0.284))
    x0 = int(round(face_x * width)) - half_w
    y0 = head_top - int(round(height * 0.027))
    y1 = chin + int(round(height * 0.098))
    x1 = x0 + half_w * 2

    x0, x1 = max(0, x0), min(width, x1)
    y0, y1 = max(0, y0), min(height, y1)
    print(f"plate box        {x1 - x0} x {y1 - y0}   head top {head_top}  chin {chin}  aspect {(x1 - x0) / (y1 - y0):.3f}")

    return (
        x0,
        y0,
        x1,
        y1,
        (face_x * width - x0) / (x1 - x0),
        (eye_y * height - y0) / (y1 - y0),
    )


def save(name: str, image: Image.Image, **kwargs: object) -> None:
    path = OUT / name
    image.save(path, **kwargs)
    print(f"wrote            {path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} kB  {image.size[0]}x{image.size[1]}")


def main() -> int:
    rgb = load()
    print(f"source           {rgb.shape[1]} x {rgb.shape[0]}\n")

    fy0, fy1, fx0, fx1 = frame_box(rgb)
    px = rgb[fy0:fy1, fx0:fx1]

    print()
    corrected, alpha = matte(px)
    print()
    anchor = face_anchor(corrected, alpha)
    print()
    depth = depth_map(corrected, alpha)
    print()
    px0, py0, px1, py1, face_x, eye_y = plate_box(corrected, alpha, anchor["eyeY"], anchor["faceX"])

    rgba = np.dstack([corrected.astype(np.uint8), (alpha * 255).round().astype(np.uint8)])[py0:py1, px0:px1]
    depth_rgb = np.repeat((depth[py0:py1, px0:px1, None] * 255).round().astype(np.uint8), 3, axis=2)

    subject = Image.fromarray(rgba, "RGBA")
    width = max(1, round(subject.size[0] * TARGET_H / subject.size[1]))
    subject = subject.resize((width, TARGET_H), Image.LANCZOS)
    # The depth field is smooth by construction, so half resolution carries it.
    depth_image = Image.fromarray(depth_rgb, "RGB").resize((max(1, width // 2), TARGET_H // 2), Image.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    print()
    save("subject.webp", subject, format="WEBP", quality=88, method=6)
    save("depth.webp", depth_image, format="WEBP", lossless=True, method=6)

    meta = {
        "subject": {"width": subject.size[0], "height": subject.size[1]},
        # Anchor the tracking at the eye line, not the centre of the plate: the
        # angle the head turns through has to originate where the gaze does.
        "anchorY": round(eye_y, 4),
        "anchorX": round(face_x, 4),
        "aspect": round(subject.size[0] / subject.size[1], 4),
        "analysis": anchor,
        "crop": {"x": fx0, "y": fy0, "width": fx1 - fx0, "height": fy1 - fy0},
        "plate": {"x": px0, "y": py0, "width": px1 - px0, "height": py1 - py0},
        "source": SRC.name,
    }
    (OUT / "portrait.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"wrote            public/portrait/portrait.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
