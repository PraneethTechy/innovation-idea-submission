from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# Load clean cropped reference
crop = Image.open('scratch/hero_artwork_clean_bounds.png')
w, h = crop.size
arr = np.array(crop).astype(np.float32)

# 1. Bulb center & geometry
cx, cy = 197, 72

# Isolate the core bulb (solid opacity)
# The bulb glass itself has bright colors: R > 200 or B > 240 or G > 180
# Socket: dark purple (R < 80, G < 60, B < 100)
# Crystals: cyan/purple (distinct from background)
# Nodes: purple (R ~ 120-150, G ~ 60-90, B ~ 230-255)

# Expected background gradient
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

# Create spatial inclusion masks for specific elements:
# Element 1: 4 Nodes
nodes_mask = np.zeros((h, w), dtype=np.float32)
n_img = Image.new('L', (w, h), 0)
n_draw = ImageDraw.Draw(n_img)
# Nodes:
n_draw.ellipse((95 - 20, 52 - 20, 95 + 20, 52 + 20), fill=255)
n_draw.rectangle((68, 70, 126, 90), fill=255) # "Innovate"
n_draw.ellipse((95 - 20, 118 - 20, 95 + 20, 118 + 20), fill=255)
n_draw.rectangle((58, 136, 132, 156), fill=255) # "Collaborate"
n_draw.ellipse((300 - 20, 62 - 20, 300 + 20, 62 + 20), fill=255)
n_draw.rectangle((272, 80, 332, 100), fill=255) # "Improve"
n_draw.ellipse((302 - 20, 130 - 20, 302 + 20, 130 + 20), fill=255)
n_draw.rectangle((268, 146, 372, 170), fill=255) # "Create value"
# Script text:
n_draw.polygon([(10, 38), (82, 18), (86, 95), (8, 105)], fill=255)
# Dotted lines:
n_draw.line([(95, 52), (160, 72)], fill=255, width=8)
n_draw.line([(95, 118), (170, 115)], fill=255, width=8)
n_draw.line([(300, 62), (235, 75)], fill=255, width=8)
n_draw.line([(302, 130), (225, 118)], fill=255, width=8)
# Sparkles:
for sx, sy in [(30, 28), (138, 38), (138, 122), (265, 44), (345, 68), (225, 30), (165, 18), (245, 65)]:
    n_draw.ellipse((sx - 12, sy - 12, sx + 12, sy + 12), fill=255)

nodes_mask = np.array(n_img).astype(np.float32) / 255.0

# Element 2: Bulb & Socket & Crystals
bulb_mask = np.zeros((h, w), dtype=np.float32)
b_img = Image.new('L', (w, h), 0)
b_draw = ImageDraw.Draw(b_img)
# Bulb body
b_draw.ellipse((197 - 52, 72 - 52, 197 + 52, 72 + 52), fill=255)
b_draw.polygon([(168, 70), (226, 70), (218, 140), (176, 140)], fill=255)
b_draw.rectangle((175, 135, 220, 163), fill=255) # socket
# Crystals:
crystal_pts = [
    (100, 160), (130, 138), (165, 138), (197, 155), (230, 138), (265, 135), (295, 155),
    (310, 185), (310, 205), (90, 205), (90, 185)
]
b_draw.polygon(crystal_pts, fill=255)
bulb_mask = np.array(b_img).astype(np.float32) / 255.0

# Calculate alpha for nodes, text, sparkles based on difference from background:
# If diff > 10 inside nodes_mask, it's foreground!
node_alpha = np.clip((diff - 8.0) / 14.0, 0.0, 1.0) * nodes_mask

# Calculate alpha for bulb & crystals:
# The bulb interior is 100% solid!
b_solid = b_img.filter(ImageFilter.GaussianBlur(radius=1.5))
bulb_alpha = np.array(b_solid).astype(np.float32) / 255.0

# Soft glow aura around bulb (generated procedurally so it has ZERO milky background color!):
# Radial glow centered at (197, 72)
Y, X = np.ogrid[:h, :w]
dist_from_bulb = np.sqrt((X - 197) ** 2 + (Y - 72) ** 2)
# Glow extends from r=50 to r=85
glow_alpha = np.clip((85.0 - dist_from_bulb) / 35.0, 0.0, 1.0)
glow_alpha = glow_alpha * glow_alpha * (3.0 - 2.0 * glow_alpha) * 0.45

# Total alpha:
total_alpha = np.maximum(bulb_alpha, node_alpha)
total_alpha = np.maximum(total_alpha, glow_alpha * (1.0 - bulb_alpha))

# Zero out strictly outside the scene:
total_alpha[0:3, :] = 0.0
total_alpha[-3:, :] = 0.0
total_alpha[:, 0:3] = 0.0
total_alpha[:, -3:] = 0.0

# Procedural glow color: soft golden peach and pink
# So the glow adds beautiful warm light onto any background without any gray/lavender haze!
glow_color = np.zeros((h, w, 3), dtype=np.float32)
glow_color[:, :, 0] = 255.0 # R
glow_color[:, :, 1] = 210.0 # G
glow_color[:, :, 2] = 240.0 # B

# Foreground RGB calculation:
# Where total_alpha is dominated by glow_alpha, blend with glow_color
fg_rgb = np.zeros_like(arr[:, :, :3])
for c in range(3):
    # Unmix observed color for solid elements:
    unmixed = np.clip((arr[:, :, c] - (1.0 - np.maximum(bulb_alpha, node_alpha)) * bg_rgb[:, :, c]) / np.maximum(np.maximum(bulb_alpha, node_alpha), 0.05), 0, 255)
    # Blend with glow color in aura region
    is_aura = glow_alpha > bulb_alpha
    fg_rgb[:, :, c] = np.where(is_aura, glow_color[:, :, c], unmixed)

rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, :3] = np.clip(fg_rgb, 0, 255).astype(np.uint8)
rgba[:, :, 3] = np.clip(total_alpha * 255, 0, 255).astype(np.uint8)

res_im = Image.fromarray(rgba, 'RGBA')
res_im.save('scratch/hero_lightbulb_pure_trans_v2.png')
print('Saved scratch/hero_lightbulb_pure_trans_v2.png')

# Extreme contrast test on vivid cyan:
cyan_bg = np.zeros((h, w, 3), dtype=np.float32)
cyan_bg[:, :, 0] = 0
cyan_bg[:, :, 1] = 220
cyan_bg[:, :, 2] = 255
comp_cyan = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
             cyan_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_cyan.astype(np.uint8)).save('scratch/test_v2_on_cyan.png')

# Test on card background:
card_bg = np.zeros((h, w, 3), dtype=np.float32)
for x in range(w):
    t = x / float(w)
    card_bg[:, x, 0] = 242.0 * (1 - t) + 222.0 * t
    card_bg[:, x, 1] = 232.0 * (1 - t) + 206.0 * t
    card_bg[:, x, 2] = 253.0 * (1 - t) + 252.0 * t
comp_card = (rgba[:, :, :3].astype(np.float32) * (rgba[:, :, 3:4] / 255.0) +
             card_bg * (1.0 - rgba[:, :, 3:4] / 255.0))
Image.fromarray(comp_card.astype(np.uint8)).save('scratch/test_v2_on_card.png')
print('V2 tests complete.')
