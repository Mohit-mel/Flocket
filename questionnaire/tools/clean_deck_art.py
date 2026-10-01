"""Turn painted pitch-deck slides into text-free questionnaire backgrounds.

The Flocket deck slides are flattened images, so the headline text is baked in.
This masks the text (by brightness inside known boxes) and inpaints it away.
The questionnaire panel sits over the centre of each scene, so small artefacts
there are hidden behind its frosted glass.

Usage:
    pip install opencv-python-headless numpy
    python3 tools/clean_deck_art.py <folder with slide PNGs at 1920x1080>

Expected inputs: slide01-cover.png, slide04-vision.png, slide05-mission.png,
slide23-closing.png (exported from the Figma deck at 1x).
"""
import os
import sys

import cv2
import numpy as np

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")

# Each entry: output name -> (source file, list of regions).
# A region is (x0, y0, x1, y1, rule) where rule is:
#   "dark"  mask pixels darker than the sky (dark or grey text)
#   "light" mask pixels lighter than the sky (white text on blue)
#   "all"   mask the whole box (pills, buttons, hairlines)
#   "sky"   repaint the box as a smooth gradient between clean sky sampled
#           just left and right of it (for soft drop shadows on open sky)
SCENES = {
    "bg-meadow": ("slide01-cover.png", [
        (725, 455, 1185, 560, "all"),
    ]),
    "bg-bluehour": ("slide05-mission.png", [
        (780, 185, 1140, 345, "sky"),
        (390, 305, 1530, 552, "light"),
    ]),
    "bg-sunlit": ("slide23-closing.png", [
        (435, 205, 1485, 612, "dark"),
        (788, 642, 1132, 724, "all"),
        (735, 730, 1185, 766, "dark"),
        (0, 783, 1920, 792, "all"),
        (675, 800, 1245, 882, "dark"),
    ]),
}


def build_mask(img, regions):
    mask = np.zeros(img.shape[:2], np.uint8)
    lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.int16)
    for x0, y0, x1, y1, rule in regions:
        if rule == "sky":
            continue
        box = lum[y0:y1, x0:x1]
        if rule == "all":
            sel = np.ones_like(box, bool)
        else:
            # Compare each pixel to a heavily blurred local sky estimate.
            sky = cv2.medianBlur(img[y0:y1, x0:x1], 31)
            sky = cv2.cvtColor(sky, cv2.COLOR_BGR2GRAY).astype(np.int16)
            diff = box - sky
            sel = diff < -18 if rule == "dark" else diff > 18
        mask[y0:y1, x0:x1][sel] = 255
    # Grow the mask to swallow anti-aliased edges and drop shadows.
    return cv2.dilate(mask, np.ones((7, 7), np.uint8), iterations=2)


def fill_sky(img, regions, pad=60):
    """Replace each "sky" box with a row-by-row blend of the sky beside it."""
    for x0, y0, x1, y1, rule in regions:
        if rule != "sky":
            continue
        left = np.median(img[y0:y1, x0 - pad:x0 - 8].astype(np.float32), axis=1)
        right = np.median(img[y0:y1, x1 + 8:x1 + pad].astype(np.float32), axis=1)
        t = np.linspace(0, 1, x1 - x0, dtype=np.float32)[None, :, None]
        patch = left[:, None, :] * (1 - t) + right[:, None, :] * t
        patch = cv2.GaussianBlur(patch, (0, 0), 4)
        # Feather the patch edges into the original so no seam shows.
        alpha = np.zeros((y1 - y0, x1 - x0), np.float32)
        alpha[20:-20, 20:-20] = 1
        alpha = cv2.GaussianBlur(alpha, (0, 0), 10)[..., None]
        region = img[y0:y1, x0:x1].astype(np.float32)
        img[y0:y1, x0:x1] = (region * (1 - alpha) + patch * alpha).astype(np.uint8)
    return img


def main(src_dir):
    os.makedirs(OUT, exist_ok=True)
    for name, (src, regions) in SCENES.items():
        img = cv2.imread(os.path.join(src_dir, src))
        mask = build_mask(img, regions)
        clean = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
        # Soften the repaired zones slightly so brush texture reads as sky.
        soft = cv2.GaussianBlur(clean, (0, 0), 3)
        feather = cv2.GaussianBlur(mask, (0, 0), 6).astype(np.float32)[..., None] / 255
        clean = (clean * (1 - feather) + soft * feather).astype(np.uint8)
        clean = fill_sky(clean, regions)
        cv2.imwrite(os.path.join(OUT, f"{name}.webp"), clean, [cv2.IMWRITE_WEBP_QUALITY, 80])
        print(name, "ok")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "deck"))
