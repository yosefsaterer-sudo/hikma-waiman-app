from PIL import Image

src = "/home/ubuntu/arabic-secure-messenger/assets/images/hekma-iman-wordmark.png"
im = Image.open(src).convert("RGBA")
pixels = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = pixels[x, y]
        # Remove the generated white/light checkerboard only; preserve saturated green/blue lettering.
        if max(r, g, b) - min(r, g, b) < 12 and r > 180 and g > 180 and b > 180:
            pixels[x, y] = (r, g, b, 0)
im.save(src, optimize=True)
print(im.size)
print(src)
