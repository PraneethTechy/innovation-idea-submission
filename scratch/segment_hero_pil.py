from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# Load clean cropped image (375 x 205)
crop = Image.open('scratch/hero_artwork_clean_bounds.png')
w, h = crop.size
arr = np.array(crop).astype(np.float32)

# Create an object-inclusion mask using Pillow ImageDraw
mask_img = Image.new('L', (w, h), 0)
draw = ImageDraw.Draw(mask_img)

# 1. Bulb body & aura: center (197, 72)
draw.ellipse((197 - 60, 72 - 60, 197 + 60, 72 + 60), fill=255)
# Neck:
draw.polygon([(168, 70), (226, 70), (218, 142), (176, 142)], fill=255)
# Socket:
draw.rectangle((175, 135, 220, 163), fill=255)

# 2. Crystals (polygonal region below bulb):
crystal_pts = [
    (100, 160), (130, 138), (165, 138), (197, 155), (230, 138), (265, 135), (295, 155),
    (310, 185), (310, 205), (90, 205), (90, 185)
]
draw.polygon(crystal_pts, fill=255)

# 3. Four nodes & labels:
# Node 1 (Innovate):
draw.ellipse((95 - 24, 52 - 24, 95 + 24, 52 + 24), fill=255)
draw.rectangle((68, 70, 126, 90), fill=255) # text "Innovate"

# Node 2 (Collaborate):
draw.ellipse((95 - 24, 118 - 24, 95 + 24, 118 + 24), fill=255)
draw.rectangle((58, 136, 132, 156), fill=255) # text "Collaborate"

# Node 3 (Improve):
draw.ellipse((300 - 24, 62 - 24, 300 + 24, 62 + 24), fill=255)
draw.rectangle((272, 80, 332, 100), fill=255) # text "Improve"

# Node 4 (Create value):
draw.ellipse((302 - 24, 130 - 24, 302 + 24, 130 + 24), fill=255)
draw.rectangle((268, 146, 372, 170), fill=255) # text "Create value"

# 4. Script text: "Your idea can make a difference"
text_pts = [(10, 38), (82, 18), (86, 95), (8, 105)]
draw.polygon(text_pts, fill=255)

# 5. Dotted curves connecting nodes to bulb:
draw.line([(95, 52), (160, 72)], fill=255, width=14)
draw.line([(95, 118), (170, 115)], fill=255, width=14)
draw.line([(300, 62), (235, 75)], fill=255, width=14)
draw.line([(302, 130), (225, 118)], fill=255, width=14)

# 6. Sparkles:
stars = [(30, 28), (138, 38), (138, 122), (265, 44), (345, 68), (225, 30), (165, 18), (245, 65)]
for sx, sy in stars:
    draw.ellipse((sx - 16, sy - 16, sx + 16, sy + 16), fill=255)

# Blur the inclusion mask for a smooth edge
mask_blurred = mask_img.filter(ImageFilter.GaussianBlur(radius=3))
obj_mask = np.array(mask_blurred).astype(np.float32) / 255.0

# Calculate background gradient
bg_rgb = np.zeros((h, w, 3), dtype=np.float32)
for x in range(w):
    t = x / float(w)
    for y in range(h):
        ty = y / float(h)
        r = (241.0 * (1 - t) + 224.0 * t) - ty * 4.0
        g = (232.0 * (1 - t) + 207.0 * t) - ty * 5.0
        b = (254.0 * (1 - t) + 252.0 * t)
        bg_rgb[y, x] = [r, g, b]

diff = np.sqrt(np.sum((arr[:, :, :3] - bg_rgb) ** 2, axis=2))

# Outside obj_mask, alpha is strictly 0.0!
low_th = 8.0
high_th = 22.0
val = np.clip((diff - low_th) / (high_th - low_th), 0.0, 1.0)
smooth_alpha = val * val * (3.0 - 2.0 * val) * obj_mask

# Set core foreground elements to solid alpha
solid_img = Image.new('L', (w, h), 0)
s_draw = ImageDraw.Draw(solid_img)
s_draw.ellipse((197 - 48, 72 - 48, 197 + 48, 72 + 48), fill=255) # bulb core
s_draw.ellipse((95 - 16, 52 - 16, 95 + 16, 52 + 16), fill=255) # node 1
s_draw.ellipse((95 - 16, 118 - 16, 95 + 16, 118 + 16), fill=255) # node 2
s_draw.ellipse((300 - 16, 62 - 16, 300 + 16, 62 + 16), fill=255) # node 3
s_draw.ellipse((302 - 16, 130 - 16, 302 + 16, 130 + 16), fill=255) # node 4
s_draw.rectangle((178, 136, 217, 160), fill=255) # socket

solid_arr = np.array(solid_img).astype(np.float32) / 255.0
smooth_alpha = np.maximum(smooth_alpha, solid_arr)

# Ensure edges are 0.0 alpha
smooth_alpha[0:3, :] = 0.0
smooth_alpha[-3:, :] = 0.0
smooth_alpha[:, 0:3] = 0.0
smooth_alpha[:, -3:] = 0.0

# Smooth alpha filter
smooth_alpha_img = Image.fromarray((smooth_alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.0))
smooth_alpha = np.array(smooth_alpha_img).astype(np.float32) / 255.0

# Zero out edges again after blur
smooth_alpha[0:2, :] = 0.0
smooth_alpha[-2:, :] = 0.0
smooth_alpha[:, 0:2] = 0.0
smooth_alpha[:, -2:] = 0.0

# Unmix foreground color to avoid lavender halo
fg_rgb = np.zeros_like(arr[:, :, :3])
for c in range(3):
    fg_rgb[:, :, c] = np.where(
        smooth_alpha > 0.01,
        np.clip((arr[:, :, c] - (1.0 - smooth_alpha) * bg_rgb[:, :, c]) / np.maximum(smooth_alpha, 0.01), 0, 255),
        arr[:, :, c]
    )

rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, :3] = np.clip(fg_rgb, 0, 255).astype(np.uint8)
rgba[:, :, 3] = (smooth_alpha * 255).astype(np.uint8)

res_im = Image.fromarray(rgba, 'RGBA')
res_im.save('scratch/hero_lightbulb_pure_trans_segmented.png')
print('Saved scratch/hero_lightbulb_pure_trans_segmented.png')

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
print('All test images generated.')
