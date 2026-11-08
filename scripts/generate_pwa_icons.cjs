/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Icon Generator (icon-512.png & icon-192.png)
 * Generates minimalist eight-pointed geometric star (Rub el Hizb) in deep teal #0E5C4D
 * on white background #FFFFFF, with a small four-point sparkle in the center in cool blue #4A90D9.
 * Flat design, anti-aliased with 3x3 supersampling, works crisply down to 16px.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

function createPng(width, height, getPixel) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLen);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, ihdr, idat, iend]);
}

function samplePoint(nx, ny) {
  // Center 4-point sparkle in cool blue #4A90D9
  const sparkleSize = 0.17;
  const p = 0.55;
  const sparkleDist = Math.pow(Math.abs(nx) / sparkleSize, p) + Math.pow(Math.abs(ny) / sparkleSize, p);
  if (sparkleDist <= 1.0) {
    return [74, 144, 217, 255]; // #4A90D9
  }

  // Eight-pointed geometric star (Rub el Hizb) in deep teal #0E5C4D
  const S = 0.62; // Outer half-size
  const W = 0.082; // Bold stroke width for 16px legibility
  const S_inner = S - W;

  // Square 1: axis-aligned
  const max1 = Math.max(Math.abs(nx), Math.abs(ny));
  const inBorder1 = max1 <= S && max1 >= S_inner;

  // Square 2: rotated 45 degrees
  const SQRT2 = Math.SQRT2;
  const rx = Math.abs(nx - ny) / SQRT2;
  const ry = Math.abs(nx + ny) / SQRT2;
  const max2 = Math.max(rx, ry);
  const inBorder2 = max2 <= S && max2 >= S_inner;

  if (inBorder1 || inBorder2) {
    return [14, 92, 77, 255]; // #0E5C4D
  }

  // Background: white #FFFFFF
  return [255, 255, 255, 255];
}

function getAntiAliasedPixel(x, y, w, h) {
  // 3x3 supersampling for anti-aliasing
  const subOffsets = [-0.33, 0, 0.33];
  let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
  for (const ox of subOffsets) {
    for (const oy of subOffsets) {
      const nx = ((x + 0.5 + ox) / w) * 2 - 1;
      const ny = ((y + 0.5 + oy) / h) * 2 - 1;
      const [r, g, b, a] = samplePoint(nx, ny);
      rSum += r; gSum += g; bSum += b; aSum += a;
    }
  }
  return [
    Math.round(rSum / 9),
    Math.round(gSum / 9),
    Math.round(bSum / 9),
    Math.round(aSum / 9)
  ];
}

const p512 = path.resolve('public', 'icon-512.png');
const p192 = path.resolve('public', 'icon-192.png');
const pApple = path.resolve('public', 'apple-touch-icon.png');

fs.writeFileSync(p512, createPng(512, 512, getAntiAliasedPixel));
fs.writeFileSync(p192, createPng(192, 192, getAntiAliasedPixel));
fs.writeFileSync(pApple, createPng(192, 192, getAntiAliasedPixel));

console.log('Successfully rendered icon-512.png, icon-192.png, and apple-touch-icon.png');
