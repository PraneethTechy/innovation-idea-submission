from PIL import Image

orig = Image.open(r'C:\Users\prane\.gemini\antigravity-ide\brain\02cb5677-c4d9-493a-8312-f7ac2ca865e5\.user_uploaded\media_1791613535685.png')
w, h = orig.size
print('Original size:', w, h)

center_crop = orig.crop((370, 8, 760, 205))
center_crop.save('scratch/exact_center_reference.png')
print('Saved scratch/exact_center_reference.png, size:', center_crop.size)
