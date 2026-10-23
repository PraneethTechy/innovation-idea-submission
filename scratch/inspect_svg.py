import re, base64, io
from PIL import Image
import numpy as np

with open('public/assets/hero_lightbulb.svg', 'r') as f:
    c = f.read()

match = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', c)
if match:
    data = base64.b64decode(match.group(1))
    im = Image.open(io.BytesIO(data))
    arr = np.array(im)
    print('Embedded image size:', im.size, 'mode:', im.mode)
    alpha = arr[:, :, 3]
    print('Embedded min alpha:', alpha.min(), 'max alpha:', alpha.max())
    print('Corner (5, 5) alpha:', alpha[5, 5], 'rgb:', arr[5, 5, :3])
    print('Corner (5, 375) alpha:', alpha[5, 375], 'rgb:', arr[5, 375, :3])
    print('Point (50, 50) alpha:', alpha[50, 50])
    print('Distribution: zero:', (alpha == 0).sum(), 'partial:', ((alpha > 0) & (alpha < 255)).sum(), 'solid:', (alpha == 255).sum())

    # Let's save a visualization of the alpha mask
    alpha_im = Image.fromarray(alpha)
    alpha_im.save('scratch/alpha_mask.png')
    print('Saved scratch/alpha_mask.png')
