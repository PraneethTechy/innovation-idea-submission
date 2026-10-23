from PIL import Image
import numpy as np

orig = Image.open(r'C:\Users\prane\.gemini\antigravity-ide\brain\02cb5677-c4d9-493a-8312-f7ac2ca865e5\.user_uploaded\media_1791613535685.png')
w, h = orig.size
print('Original dimensions:', w, h)

# Let's inspect coordinates of key items in original:
# 1. Left boundary of "Your idea can make a difference": ~ x=400
# 2. Right boundary of "Create value" node: ~ x=750
# 3. Top of bulb glow: ~ y=10
# 4. Bottom of crystal pedestal: ~ y=195
# 5. Left pillars icons start at: ~ x=780
# 6. Buttons "+ Submit an idea": x=40 to 170, y=145 to 185
