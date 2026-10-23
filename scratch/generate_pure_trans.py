from PIL import Image
import numpy as np
from scipy.ndimage import gaussian_filter

# Load clean cropped bounds (375x205)
crop = Image.open('scratch/hero_artwork_clean_bounds.png')
w, h = crop.size
arr = np.array(crop).astype(np.float32)

# Fit smooth background surface from known background points:
# Points far from bulb, text, nodes, crystals:
# Top corners: (x<50, y<30), (x>320, y<30)
# Top center left: (x=150, y=10)
# Bottom corners: (x<30, y>180), (x>340, y>180)
# Left edge: (x<10, y=100)
# Right edge: (x>365, y=100)
bg_samples = []
for y in range(h):
    for x in range(w):
        # Avoid bulb (x: 100 to 280, y: 15 to 195)
        # Avoid left nodes (x: 30 to 140, y: 30 to 140)
        # Avoid right nodes (x: 240 to 360, y: 30 to 140)
        # Avoid crystals (x: 100 to 280, y: 130 to 205)
        # Avoid text (x: 0 to 80, y: 40 to 95)
        is_bg = False
        if y < 15 and (x < 80 or x > 300):
            is_bg = True
        elif x < 15 and y < 40:
            is_bg = True
        elif x > 360 and y < 40:
            is_bg = True
        elif x < 15 and y > 160:
            is_bg = True
        elif x > 360 and y > 160:
            is_bg = True
        
        if is_bg:
            bg_samples.append((x, y, arr[y, x, :3]))

# Fit a 2D polynomial for R, G, B
bg_rgb = np.zeros((h, w, 3), dtype=np.float32)
# Background is a smooth linear gradient across the card:
# Across width 375: x=0 is ~ (240, 230, 253), x=375 is ~ (225, 208, 252)
for x in range(w):
    t = x / float(w)
    # top to bottom also has slight darkening:
    for y in range(h):
        ty = y / float(h)
        r = (241.0 * (1 - t) + 224.0 * t) - ty * 4.0
        g = (232.0 * (1 - t) + 207.0 * t) - ty * 5.0
        b = (254.0 * (1 - t) + 252.0 * t)
        bg_rgb[y, x] = [r, g, b]

# Calculate color distance from background
diff = np.sqrt(np.sum((arr[:, :, :3] - bg_rgb) ** 2, axis=2))

# Identify foreground elements:
# 1. Bulb: center around (195, 75)
# 2. Left nodes & text: x: 10 to 150, y: 30 to 150
# 3. Right nodes & text: x: 250 to 370, y: 40 to 150
# 4. Crystals & socket: x: 90 to 300, y: 120 to 205

# In areas outside foreground objects, force alpha to 0
alpha = np.zeros((h, w), dtype=np.float32)

# Soft thresholding
low_th = 9.0
high_th = 28.0
t_val = np.clip((diff - low_th) / (high_th - low_th), 0.0, 1.0)
# Smoothstep
raw_alpha = t_val * t_val * (3.0 - 2.0 * t_val)

# Remove background wave residue outside of actual objects:
# Anything with very low difference (< 12) is 100% background
raw_alpha[diff < 10.0] = 0.0

# Ensure borders have 0 alpha:
# Left edge (x < 15):
for x in range(15):
    # Only allow script text if it has strong diff
    fade = x / 15.0
    raw_alpha[:, x] *= fade

# Right edge (x > 360):
for x in range(360, w):
    fade = (w - 1 - x) / float(w - 360)
    raw_alpha[:, x] *= fade

# Top edge (y < 8):
for y in range(8):
    fade = y / 8.0
    raw_alpha[y, :] *= fade

# Bottom edge (y > 198):
for y in range(198, h):
    fade = (h - 1 - y) / float(h - 198)
    raw_alpha[y, :] *= fade

# Clean unmixing of foreground color to prevent lavender halo
fg_rgb = np.zeros_like(arr[:, :, :3])
for c in range(3):
    fg_rgb[:, :, c] = np.where(
        raw_alpha > 0.02,
        np.clip((arr[:, :, c] - (1.0 - raw_alpha) * bg_rgb[:, :, c]) / np.maximum(raw_alpha, 0.02), 0, 255),
        arr[:, :, c]
    )

rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, :3] = np.clip(fg_rgb, 0, 255).astype(np.uint8)
rgba[:, :, 3] = (raw_alpha * 255).astype(np.uint8)

res_im = Image.fromarray(rgba, 'RGBA')
res_im.save('scratch/hero_lightbulb_pure_trans.png')
print('Saved scratch/hero_lightbulb_pure_trans.png')

# Test on 3 different backgrounds:
# 1. Pure Black:
black_bg = np.zeros((h, w, 3), dtype=np.float32)
comp_black = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
              black_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_black.astype(np.uint8)).save('scratch/test_on_black.png')

# 2. Pure White:
white_bg = np.ones((h, w, 3), dtype=np.float32) * 255.0
comp_white = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
              white_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_white.astype(np.uint8)).save('scratch/test_on_white.png')

# 3. Vivid Cyan background (extreme contrast test to detect ANY rectangle edge):
cyan_bg = np.zeros((h, w, 3), dtype=np.float32)
cyan_bg[:, :, 0] = 0
cyan_bg[:, :, 1] = 220
cyan_bg[:, :, 2] = 255
comp_cyan = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
             cyan_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_cyan.astype(np.uint8)).save('scratch/test_on_cyan.png')

print('Test images saved successfully.')
