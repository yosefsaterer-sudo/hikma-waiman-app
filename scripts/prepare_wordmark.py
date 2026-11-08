from PIL import Image

path = "/home/ubuntu/arabic-secure-messenger/assets/images/hekma-iman-wordmark.png"
im = Image.open(path).convert("RGBA")
# Remove the generated light checkerboard while preserving saturated green/blue strokes.
pixels = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, _ = pixels[x, y]
        if max(r, g, b) - min(r, g, b) < 18 and r > 175 and g > 175 and b > 175:
            pixels[x, y] = (r, g, b, 0)
alpha = im.getchannel("A")
bbox = alpha.getbbox()
if bbox:
    im = im.crop(bbox)
im.thumbnail((900, 900), Image.Resampling.LANCZOS)
im.save(path, optimize=True)
print(f"{im.mode} {im.size} {__import__('os').path.getsize(path)}")
