import struct
import zlib
import sys

def create_solid_png(width, height, color_hex):
    # Convert hex to RGBA
    color_hex = color_hex.lstrip('#')
    r = int(color_hex[0:2], 16)
    g = int(color_hex[2:4], 16)
    b = int(color_hex[4:6], 16)
    a = 255  # opaque
    color = (r, g, b, a)

    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    # IHDR
    png += struct.pack('!I', 13)  # length
    png += b'IHDR'
    png += struct.pack('!IIBBBBB', width, height, 8, 6, 0, 0, 0)  # bit depth 8, RGBA, no compression, filter, interlace
    png += struct.pack('!I', 0xFFFFFFFF & zlib.crc32(b'IHDR' + struct.pack('!IIBBBBB', width, height, 8, 6, 0, 0, 0)))
    # IDAT
    # Create raw pixel data (RGBA bytes)
    raw = b''.join(struct.pack('BBBB', *color) for _ in range(width * height))
    # Add filter byte (0) at the start of each row
    filtered = b''.join(b'\x00' + raw[i*width*4:(i+1)*width*4] for i in range(height))
    compressed = zlib.compress(filtered)
    png += struct.pack('!I', len(compressed)) + b'IDAT' + compressed + struct.pack('!I', 0xFFFFFFFF & zlib.crc32(b'IDAT' + compressed))
    # IEND
    png += b'\x00\x00\x00\x00IEND\xae\x42\x60\x82'
    return png

if __name__ == '__main__':
    # Theme color from CSS: #4a6cf7
    color = '#4a6cf7'
    # Generate 192x192
    png192 = create_solid_png(192, 192, color)
    with open('icon-192.png', 'wb') as f:
        f.write(png192)
    # Generate 512x512
    png512 = create_solid_png(512, 512, color)
    with open('icon-512.png', 'wb') as f:
        f.write(png512)
    print('Generated icon-192.png and icon-512.png')