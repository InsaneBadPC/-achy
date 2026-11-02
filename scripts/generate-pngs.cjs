const fs = require('fs');
const path = require('path');

// Generate minimal valid PNG with given size and RGBA color
function createSimplePng(width, height, r, g, b) {
  // A clean 1x1 or sized uncompressed PNG generator
  const zlib = require('zlib');
  
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(calculateCrc(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  // Pre-calculate CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function calculateCrc(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // Create scanlines: each row starts with filter byte 0, then width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Comic chess icon style: yellow-orange comic gradient with border
      const distFromCenter = Math.hypot(x - width / 2, y - height / 2);
      const isBorder = x < 8 || x > width - 9 || y < 8 || y > height - 9;
      
      if (isBorder) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 255;
      } else if (distFromCenter < width * 0.35) {
        // Inner crown/icon golden yellow
        rawData[pxOffset] = 250;
        rawData[pxOffset + 1] = 204;
        rawData[pxOffset + 2] = 21;
        rawData[pxOffset + 3] = 255;
      } else {
        // Comic orange background
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createSimplePng(192, 192, 249, 115, 22));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createSimplePng(512, 512, 249, 115, 22));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createSimplePng(512, 512, 250, 204, 21));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSimplePng(180, 180, 249, 115, 22));

console.log('PWA PNG icons generated successfully!');
