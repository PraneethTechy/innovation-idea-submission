from PIL import Image
import numpy as np

# Load original
orig = Image.open(r'C:\Users\prane\.gemini\antigravity-ide\brain\02cb5677-c4d9-493a-8312-f7ac2ca865e5\.user_uploaded\media_1791613535685.png')
# Crop region containing the center illustration:
# From x=388 (just past "tomorrow") to x=760 (just before right pillars)
# y=0 to y=205
box = (395, 2, 755, 202)
crop = orig.crop(box)
w, h = crop.size
print('Crop size:', w, h)

# Estimate background color at each (x, y)
# The background is a smooth linear gradient across the card:
# Left of card (x=0) is ~ (242, 235, 254)
# Right of card (x=1024) is ~ (218, 198, 252)
# Inside our crop (from orig_x = 395 to 755):
orig_x_start = 395
orig_x_end = 755

arr = np.array(crop).astype(np.float32)

# Compute expected background RGB for each column x
# Let's sample actual background pixels from top and bottom areas without objects
bg_rgb = np.zeros((h, w, 3), dtype=np.float32)
for x in range(w):
    orig_x = orig_x_start + x
    t = orig_x / 1024.0
    # Gradient interpolation from card left to card right:
    # Left: [243, 235, 254], Right: [215, 195, 252]
    # Also top is slightly lighter than bottom
    r_bg = 243.0 * (1 - t) + 215.0 * t
    g_bg = 236.0 * (1 - t) + 196.0 * t
    b_bg = 254.0 * (1 - t) + 252.0 * t
    bg_rgb[:, x, 0] = r_bg
    bg_rgb[:, x, 1] = g_bg
    bg_rgb[:, x, 2] = b_bg

# Difference from background
diff = np.sqrt(np.sum((arr[:, :, :3] - bg_rgb) ** 2, axis=2))

print('Min diff:', diff.min(), 'Max diff:', diff.max(), 'Median diff:', np.median(diff))

# Thresholds:
# Background has diff < 12
# Foreground has diff > 30
# Smooth transition in between
alpha = np.zeros((h, w), dtype=np.float32)
low_th = 12.0
high_th = 32.0

# Mask for foreground
mask = (diff - low_th) / (high_th - low_th)
mask = np.clip(mask, 0.0, 1.0)

# Apply smoothstep
alpha = mask * mask * (3.0 - 2.0 * mask)

# Force border edges to be 100% transparent to prevent ANY box edges
# Fade to 0 within 15px of left/right/top/bottom edges
for y in range(h):
    for x in range(w):
        edge_dist = min(x, w - 1 - x, y, h - 1 - y)
        if edge_dist < 15:
            alpha[y, x] *= (edge_dist / 15.0)

# Unmix foreground color:
# observed = alpha * fg + (1 - alpha) * bg
# fg = (observed - (1 - alpha) * bg) / max(alpha, 0.01)
fg_rgb = np.zeros_like(arr[:, :, :3])
for c in range(3):
    fg_rgb[:, :, c] = np.where(
        alpha > 0.05,
        np.clip((arr[:, :, c] - (1.0 - alpha) * bg_rgb[:, :, c]) / np.maximum(alpha, 0.05), 0, 255),
        arr[:, :, c]
    )

rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, :3] = np.clip(fg_rgb, 0, 255).astype(np.uint8)
rgba[:, :, 3] = (alpha * 255).astype(np.uint8)

res_im = Image.fromarray(rgba, 'RGBA')
res_im.save('scratch/true_transparent_test.png')
print('Saved scratch/true_transparent_test.png')

# Composite onto a card background to test visual blend!
card_bg = np.zeros((h, w, 3), dtype=np.float32)
for x in range(w):
    t = x / float(w)
    card_bg[:, x, 0] = 240.0 * (1 - t) + 220.0 * t
    card_bg[:, x, 1] = 230.0 * (1 - t) + 205.0 * t
    card_bg[:, x, 2] = 253.0 * (1 - t) + 252.0 * t

comp = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
        card_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp.astype(np.uint8)).save('scratch/true_transparent_on_card.png')
print('Saved scratch/true_transparent_on_card.png')
