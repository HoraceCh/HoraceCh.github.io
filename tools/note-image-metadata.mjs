import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultProjectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const metadataCache = new Map();

export function clearNoteImageMetadataCache() {
  metadataCache.clear();
}

export function readNoteImageMetadata(publicUrl, options = {}) {
  const assetRoot = path.resolve(options.assetRoot ?? path.join(defaultProjectRoot, 'astro-public/notes-assets'));
  const resolvedPath = resolveNoteAssetPath(publicUrl, assetRoot);
  const cacheKey = path.normalize(resolvedPath);
  if (metadataCache.has(cacheKey)) return metadataCache.get(cacheKey);

  try {
    assertRealPathContained(resolvedPath, assetRoot);
    const extension = path.extname(resolvedPath).toLowerCase();
    if (extension === '.avif' || extension === '.bmp') {
      throw new Error(`${extension.slice(1).toUpperCase()} dimensions are not supported; convert the asset to PNG, JPEG, WebP, GIF, or SVG`);
    }

    const buffer = readFileSync(resolvedPath);
    const metadata = dimensionsForBuffer(buffer, extension);
    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    if (error instanceof NoteImageMetadataError) throw error;
    throw metadataError(publicUrl, resolvedPath, error.message);
  }
}

export function resolveNoteAssetPath(publicUrl, assetRoot) {
  const root = path.resolve(assetRoot);
  let pathname;
  try {
    pathname = decodeURIComponent(String(publicUrl).split(/[?#]/, 1)[0]);
  } catch {
    throw metadataError(publicUrl, root, 'the URL contains invalid percent encoding');
  }

  if (!pathname.startsWith('/notes-assets/')) {
    throw metadataError(publicUrl, root, 'expected a URL beginning with /notes-assets/');
  }
  if (pathname.includes('\\')) {
    throw metadataError(publicUrl, root, 'backslashes are not allowed in Note asset URLs');
  }

  const relativePath = pathname.slice('/notes-assets/'.length);
  const resolvedPath = path.resolve(root, relativePath);
  if (!relativePath || !isContained(resolvedPath, root)) {
    throw metadataError(publicUrl, resolvedPath, 'path traversal outside the configured Note asset root is not allowed');
  }
  return resolvedPath;
}

export function dimensionsForBuffer(buffer, extension) {
  let dimensions;
  switch (extension.toLowerCase()) {
    case '.png': dimensions = readPng(buffer); break;
    case '.jpg':
    case '.jpeg': dimensions = readJpeg(buffer); break;
    case '.webp': dimensions = readWebp(buffer); break;
    case '.gif': dimensions = readGif(buffer); break;
    case '.svg': dimensions = readSvg(buffer); break;
    default: throw new Error(`unsupported image format ${extension || '(no extension)'}`);
  }
  return validateDimensions(dimensions, extension || 'unknown');
}

export function addNoteImageGeometryToHtml(html, options = {}) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = htmlAttribute(tag, 'src');
    if (!src?.startsWith('/notes-assets/')) return tag;
    const { width, height } = readNoteImageMetadata(src, options);
    let updated = setHtmlAttribute(tag, 'width', String(width));
    updated = setHtmlAttribute(updated, 'height', String(height));
    updated = setHtmlAttribute(updated, 'loading', 'lazy');
    return setHtmlAttribute(updated, 'decoding', 'async');
  });
}

function htmlAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match?.[1] ?? match?.[2];
}

function setHtmlAttribute(tag, name, value) {
  const expression = new RegExp(`(\\s${name}\\s*=\\s*)(?:"[^"]*"|'[^']*')`, 'i');
  if (expression.test(tag)) return tag.replace(expression, `$1"${value}"`);
  return tag.replace(/\s*\/?\s*>$/, (ending) => ` ${name}="${value}"${ending}`);
}

function assertRealPathContained(filePath, assetRoot) {
  const realRoot = realpathSync(assetRoot);
  const realFile = realpathSync(filePath);
  if (!isContained(realFile, realRoot)) {
    throw new Error('resolved symlink escapes the configured Note asset root');
  }
}

function isContained(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function readPng(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (
    buffer.length < 33 ||
    !buffer.subarray(0, 8).equals(signature) ||
    buffer.readUInt32BE(8) !== 13 ||
    buffer.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    throw new Error('corrupt or truncated PNG header');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readGif(buffer) {
  const header = buffer.toString('ascii', 0, 6);
  if (buffer.length < 13 || (header !== 'GIF87a' && header !== 'GIF89a')) {
    throw new Error('corrupt or truncated GIF header');
  }
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function readJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error('corrupt or truncated JPEG header');
  }

  let offset = 2;
  let orientation = 1;
  let dimensions;
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) break;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) throw new Error('truncated JPEG segment length');
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) throw new Error('invalid or truncated JPEG segment');

    const dataStart = offset + 2;
    const dataEnd = offset + segmentLength;
    if (marker === 0xe1) orientation = readExifOrientation(buffer.subarray(dataStart, dataEnd)) ?? orientation;
    if (isStartOfFrame(marker)) {
      if (segmentLength < 7) throw new Error('truncated JPEG start-of-frame segment');
      dimensions = { width: buffer.readUInt16BE(dataStart + 3), height: buffer.readUInt16BE(dataStart + 1) };
    }
    offset += segmentLength;
  }

  if (!dimensions) throw new Error('JPEG has no supported start-of-frame dimensions');
  return orientation >= 5 && orientation <= 8
    ? { width: dimensions.height, height: dimensions.width }
    : dimensions;
}

function isStartOfFrame(marker) {
  return new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]).has(marker);
}

function readExifOrientation(segment) {
  if (segment.length < 14 || segment.toString('ascii', 0, 6) !== 'Exif\0\0') return null;
  const tiff = segment.subarray(6);
  const byteOrder = tiff.toString('ascii', 0, 2);
  const littleEndian = byteOrder === 'II';
  if (!littleEndian && byteOrder !== 'MM') return null;
  const read16 = (offset) => littleEndian ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset);
  const read32 = (offset) => littleEndian ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset);
  if (tiff.length < 8 || read16(2) !== 42) return null;
  const ifdOffset = read32(4);
  if (ifdOffset + 2 > tiff.length) return null;
  const count = read16(ifdOffset);
  for (let index = 0; index < count; index += 1) {
    const entry = ifdOffset + 2 + index * 12;
    if (entry + 12 > tiff.length) return null;
    if (read16(entry) === 0x0112 && read16(entry + 2) === 3 && read32(entry + 4) >= 1) {
      return read16(entry + 8);
    }
  }
  return null;
}

function readWebp(buffer) {
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('corrupt or truncated WebP header');
  }
  if (buffer.readUInt32LE(4) + 8 > buffer.length) throw new Error('truncated WebP RIFF container');
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > buffer.length) throw new Error(`truncated WebP ${type.trim()} chunk`);
    const data = buffer.subarray(start, end);
    if (type === 'VP8X') {
      if (data.length < 10) throw new Error('truncated WebP VP8X chunk');
      return { width: 1 + data.readUIntLE(4, 3), height: 1 + data.readUIntLE(7, 3) };
    }
    if (type === 'VP8L') {
      if (data.length < 5 || data[0] !== 0x2f) throw new Error('invalid WebP VP8L header');
      return {
        width: 1 + data[1] + ((data[2] & 0x3f) << 8),
        height: 1 + (data[2] >> 6) + (data[3] << 2) + ((data[4] & 0x0f) << 10),
      };
    }
    if (type === 'VP8 ') {
      if (data.length < 10 || data[3] !== 0x9d || data[4] !== 0x01 || data[5] !== 0x2a) {
        throw new Error('invalid WebP VP8 frame header');
      }
      return { width: data.readUInt16LE(6) & 0x3fff, height: data.readUInt16LE(8) & 0x3fff };
    }
    offset = end + (length % 2);
  }
  throw new Error('WebP has no supported VP8, VP8L, or VP8X dimension chunk');
}

function readSvg(buffer) {
  const source = buffer.toString('utf8');
  const tag = source.match(/<svg\b[^>]*>/i)?.[0];
  if (!tag) throw new Error('corrupt SVG: missing <svg> root element');

  const widthValue = attribute(tag, 'width');
  const heightValue = attribute(tag, 'height');
  const width = parseSvgLength(widthValue, 'width');
  const height = parseSvgLength(heightValue, 'height');
  const viewBox = parseViewBox(attribute(tag, 'viewBox'));

  if (width && height) return { width, height };
  if (viewBox) {
    if (width) return { width, height: Math.round(width * viewBox.height / viewBox.width) };
    if (height) return { width: Math.round(height * viewBox.width / viewBox.height), height };
    return { width: Math.round(viewBox.width), height: Math.round(viewBox.height) };
  }
  const detail = widthValue?.includes('%') || heightValue?.includes('%')
    ? 'percentage-only SVG dimensions require a usable viewBox'
    : 'dimensionless SVG requires numeric width and height or a usable viewBox';
  throw new Error(detail);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];
}

function parseSvgLength(value, name) {
  if (value == null) return null;
  const match = value.trim().match(/^([+]?(?:\d+(?:\.\d*)?|\.\d+))(?:px)?$/i);
  if (!match) return null;
  const number = Number(match[1]);
  const rounded = Math.round(number);
  if (!Number.isFinite(number) || number <= 0 || rounded <= 0) {
    throw new Error(`SVG has invalid ${name} ${JSON.stringify(value)}; expected a positive numeric or px length`);
  }
  return rounded;
}

function parseViewBox(value) {
  if (!value) return null;
  const values = value.trim().split(/[\s,]+/).map(Number);
  if (values.length !== 4 || !values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0) return null;
  return { width: values[2], height: values[3] };
}

function validateDimensions(dimensions, format) {
  for (const key of ['width', 'height']) {
    if (!Number.isFinite(dimensions[key]) || !Number.isInteger(dimensions[key]) || dimensions[key] <= 0) {
      throw new Error(`${format.toUpperCase()} has invalid ${key} ${String(dimensions[key])}; expected a positive integer`);
    }
  }
  return Object.freeze({ width: dimensions.width, height: dimensions.height });
}

function metadataError(publicUrl, resolvedPath, reason) {
  return new NoteImageMetadataError(
    `Cannot determine generated Note image geometry for ${JSON.stringify(String(publicUrl))} ` +
    `(resolved path: ${resolvedPath}): ${reason}`,
  );
}

export class NoteImageMetadataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoteImageMetadataError';
  }
}
