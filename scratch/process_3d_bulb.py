from PIL import Image
import numpy as np

src_path = r'C:\Users\prane\.gemini\antigravity-ide\brain\02cb5677-c4d9-493a-8312-f7ac2ca865e5\spark_hero_bulb_3d_1791617362255.jpg'
im = Image.open(src_path)
w, h = im.size
print('Generated image size:', w, h)

arr = np.array(im).astype(np.float32)

# The background is solid pure white (255, 255, 255)
# Let's inspect corner pixels:
print('Top left pixel:', arr[0, 0])
print('Top right pixel:', arr[0, -1])
print('Bottom left pixel:', arr[-1, 0])
print('Bottom right pixel:', arr[-1, -1])

# For white background:
# Observed = Alpha * Foreground + (1 - Alpha) * [255, 255, 255]
# Distance from pure white:
# Luminance / brightness difference or color difference from (255, 255, 255)
# A pixel that is pure white [255, 255, 255] should have Alpha = 0.
# A pixel that is colored or dark has Alpha > 0.
# Specifically, for white background unmixing:
# Alpha = max(1 - R/255, 1 - G/255, 1 - B/255)
# Wait, for a glowing object, the glow is additive light!
# If the glow is pink/yellow, e.g. [255, 230, 240], the difference from white is [0, 25, 15].
# Let's compute color distance from white:
dist_from_white = np.sqrt(np.sum((255.0 - arr[:, :, :3]) ** 2, axis=2))
print('Min dist from white:', dist_from_white.min(), 'Max dist:', dist_from_white.max())

# Background threshold:
# Pure white background has dist < 3
# Soft glow has dist between 5 and 35
# Solid object has dist > 40

alpha = np.zeros((h, w), dtype=np.float32)
low_th = 3.0
high_th = 22.0

val = np.clip((dist_from_white - low_th) / (high_th - low_th), 0.0, 1.0)
alpha = val * val * (3.0 - 2.0 * val)

# Inside the bulb and crystals, alpha is 1.0
alpha[dist_from_white > 30.0] = 1.0

# Zero out borders strictly
alpha[0:5, :] = 0.0
alpha[-5:, :] = 0.0
alpha[:, 0:5] = 0.0
alpha[:, -5:] = 0.0

# Unmix foreground color against white [255, 255, 255]:
# fg = (observed - (1 - alpha) * 255) / alpha
fg_rgb = np.zeros_like(arr[:, :, :3])
for c in range(3):
    fg_rgb[:, :, c] = np.where(
        alpha > 0.01,
        np.clip((arr[:, :, c] - (1.0 - alpha) * 255.0) / np.maximum(alpha, 0.01), 0, 255),
        arr[:, :, c]
    )

rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, :3] = fg_rgb.astype(np.uint8)
rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)

res_im = Image.fromarray(rgba, 'RGBA')

# Crop to content with padding
bbox = res_im.getbbox()
print('Bounding box:', bbox)
cropped_res = res_im.crop((bbox[0] - 10, bbox[1] - 10, bbox[2] + 10, bbox[3] + 10))

# Save transparent PNG
out_path = 'public/assets/hero_bulb_only_transparent.png'
cropped_res.save(out_path)
print('Saved clean transparent bulb to:', out_path, 'size:', cropped_res.size)

# Also test on contrasting backgrounds:
# 1. Dark
black_bg = np.zeros((cropped_res.height, cropped_res.width, 3), dtype=np.float32)
c_arr = np.array(cropped_res).astype(np.float32)
comp_black = (c_arr[:, :, :3] * (c_arr[:, :, 3:4] / 255.0) +
              black_bg * (1.0 - c_arr[:, :, 3:4] / 255.0))
Image.fromarray(comp_black.astype(np.uint8)).save('scratch/test_bulb_on_black.png')

# 2. Lavender card background:
card_bg = np.zeros((cropped_res.height, cropped_res.width, 3), dtype=np.float32)
for x in range(cropped_res.width):
    t = x / float(cropped_res.width)
    card_bg[:, x, 0] = 240.0 * (1 - t) + 222.0 * t
    card_bg[:, x, 1] = 230.0 * (1 - t) + 206.0 * t
    card_bg[:, x, 2] = 253.0 * (1 - t) + 252.0 * t
comp_card = (c_arr[:, :, :3] * (c_arr[:, :, 3:4] / 255.0) +
             card_bg * (1.0 - c_arr[:, :, 3:4] / 255.0))
Image.fromarray(comp_card.astype(np.uint8)).save('scratch/test_bulb_on_card.png')
print('Tests saved.')
