import cv2
import numpy as np
from PIL import Image

# Load clean cropped image (375 x 205)
crop = cv2.imread('scratch/hero_artwork_clean_bounds.png', cv2.IMREAD_UNCHANGED)
h, w = crop.shape[:2]

# Create an object-inclusion mask
# We will create a binary mask of where foreground elements are, then feather it gently
obj_mask = np.zeros((h, w), dtype=np.float32)

# 1. Bulb body & aura
# Center around (197, 72)
cv2.circle(obj_mask, (197, 72), 58, 1.0, -1)
# Bulb neck:
neck_pts = np.array([[170, 70], [225, 70], [218, 140], [176, 140]], np.int32)
cv2.fillPoly(obj_mask, [neck_pts], 1.0)
# Socket:
cv2.rectangle(obj_mask, (175, 135), (220, 162), 1.0, -1)

# 2. Crystals (polygonal region below bulb):
crystal_pts = np.array([
    [105, 160], [130, 140], [165, 140], [197, 155], [230, 140], [265, 135], [290, 155],
    [305, 185], [305, 205], [95, 205], [95, 185]
], np.int32)
cv2.fillPoly(obj_mask, [crystal_pts], 1.0)

# 3. Four nodes & labels:
# Node 1 (Innovate):
cv2.circle(obj_mask, (95, 52), 24, 1.0, -1)
cv2.rectangle(obj_mask, (70, 72), (125, 88), 1.0, -1) # text

# Node 2 (Collaborate):
cv2.circle(obj_mask, (95, 118), 24, 1.0, -1)
cv2.rectangle(obj_mask, (60, 138), (130, 155), 1.0, -1) # text

# Node 3 (Improve):
cv2.circle(obj_mask, (300, 62), 24, 1.0, -1)
cv2.rectangle(obj_mask, (275, 82), (330, 98), 1.0, -1) # text

# Node 4 (Create value):
cv2.circle(obj_mask, (302, 130), 24, 1.0, -1)
cv2.rectangle(obj_mask, (270, 148), (370, 168), 1.0, -1) # text

# 4. Script text: "Your idea can make a difference"
text_pts = np.array([[10, 40], [80, 20], [85, 95], [10, 105]], np.int32)
cv2.fillPoly(obj_mask, [text_pts], 1.0)

# 5. Dotted curves connecting nodes to bulb:
cv2.line(obj_mask, (95, 52), (160, 72), 1.0, 12)
cv2.line(obj_mask, (95, 118), (170, 115), 1.0, 12)
cv2.line(obj_mask, (300, 62), (235, 75), 1.0, 12)
cv2.line(obj_mask, (302, 130), (225, 118), 1.0, 12)

# 6. Sparkles:
stars = [(30, 28), (138, 38), (138, 122), (265, 44), (345, 68), (225, 30), (165, 18), (245, 65)]
for sx, sy in stars:
    cv2.circle(obj_mask, (sx, sy), 16, 1.0, -1)

# Smooth the object inclusion mask
# Dilate slightly then blur
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
obj_mask = cv2.dilate(obj_mask, kernel)

# Color distance from expected background
arr = crop[:, :, :3].astype(np.float32)
bg_rgb = np.zeros((h, w, 3), dtype=np.float32)
for x in range(w):
    t = x / float(w)
    for y in range(h):
        ty = y / float(h)
        r = (241.0 * (1 - t) + 224.0 * t) - ty * 4.0
        g = (232.0 * (1 - t) + 207.0 * t) - ty * 5.0
        b = (254.0 * (1 - t) + 252.0 * t)
        bg_rgb[y, x] = [b, g, r] # BGR in cv2

diff = np.sqrt(np.sum((arr - bg_rgb) ** 2, axis=2))

# Outside obj_mask, alpha is 0!
# Inside obj_mask, alpha is proportional to diff!
low_th = 8.0
high_th = 24.0
val = np.clip((diff - low_th) / (high_th - low_th), 0.0, 1.0)
smooth_alpha = val * val * (3.0 - 2.0 * val) * obj_mask

# In solid areas of the bulb, nodes, crystals, socket, ensure alpha is 1.0
cv2.circle(smooth_alpha, (197, 72), 48, 1.0, -1)
cv2.circle(smooth_alpha, (95, 52), 16, 1.0, -1)
cv2.circle(smooth_alpha, (95, 118), 16, 1.0, -1)
cv2.circle(smooth_alpha, (300, 62), 16, 1.0, -1)
cv2.circle(smooth_alpha, (302, 130), 16, 1.0, -1)
cv2.rectangle(smooth_alpha, (180, 135), (215, 160), 1.0, -1) # socket

# Blur alpha slightly for ultra-smooth edges
smooth_alpha = cv2.GaussianBlur(smooth_alpha, (5, 5), 1.0)

# Zero out edges
smooth_alpha[0:3, :] = 0
smooth_alpha[-3:, :] = 0
smooth_alpha[:, 0:3] = 0
smooth_alpha[:, -3:] = 0

# Unmix foreground color
fg_bgr = np.zeros_like(arr)
for c in range(3):
    fg_bgr[:, :, c] = np.where(
        smooth_alpha > 0.01,
        np.clip((arr[:, :, c] - (1.0 - smooth_alpha) * bg_rgb[:, :, c]) / np.maximum(smooth_alpha, 0.01), 0, 255),
        arr[:, :, c]
    )

rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, 0] = fg_bgr[:, :, 2].astype(np.uint8) # R
rgba[:, :, 1] = fg_bgr[:, :, 1].astype(np.uint8) # G
rgba[:, :, 2] = fg_bgr[:, :, 0].astype(np.uint8) # B
rgba[:, :, 3] = (smooth_alpha * 255).astype(np.uint8)

res_im = Image.fromarray(rgba, 'RGBA')
res_im.save('scratch/hero_lightbulb_clean_segmented.png')
print('Saved scratch/hero_lightbulb_clean_segmented.png')

# Extreme contrast test on vivid cyan:
cyan_bg = np.zeros((h, w, 3), dtype=np.float32)
cyan_bg[:, :, 0] = 0
cyan_bg[:, :, 1] = 220
cyan_bg[:, :, 2] = 255
comp_cyan = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
             cyan_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_cyan.astype(np.uint8)).save('scratch/test_segmented_on_cyan.png')

# Extreme test on white:
white_bg = np.ones((h, w, 3), dtype=np.float32) * 255.0
comp_white = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
              white_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_white.astype(np.uint8)).save('scratch/test_segmented_on_white.png')

# Test on card background:
card_bg = np.zeros((h, w, 3), dtype=np.float32)
for x in range(w):
    t = x / float(w)
    card_bg[:, x, 0] = 242.0 * (1 - t) + 222.0 * t
    card_bg[:, x, 1] = 232.0 * (1 - t) + 206.0 * t
    card_bg[:, x, 2] = 253.0 * (1 - t) + 252.0 * t
comp_card = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
             card_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_card.astype(np.uint8)).save('scratch/test_segmented_on_card.png')
