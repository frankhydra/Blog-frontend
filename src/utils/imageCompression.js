// Downscales and re-encodes an image file in the browser before it's
// uploaded, so a multi-megabyte phone photo doesn't have to travel over
// the wire at full size just to end up displayed as a small avatar or
// cover thumbnail. This matters most on a slow connection - a 3-4MB
// photo straight off a phone commonly shrinks to a few hundred KB with
// no visible quality loss at the sizes this site actually displays
// images at (avatars, cover thumbnails, inline post images), cutting
// upload time roughly proportionally to the size reduction.
//
// Always re-encodes to JPEG, even for a PNG/WebP input - a photographic
// image saved as PNG is typically many times larger than the same image
// as a good-quality JPEG, since PNG is lossless and photos don't compress
// well losslessly. The one real tradeoff: a PNG with actual transparency
// (a logo, a screenshot with a transparent background) would lose that
// transparency, flattened onto white. That's an acceptable tradeoff for
// what this is used for (avatar/cover photos, inline blog images) - none
// of those call sites expect transparency - but would NOT be appropriate
// for a general-purpose "resize any image" utility.
//
// Falls back to returning the original, untouched file if: it isn't a
// browser-decodable raster image, decoding fails for any reason, or the
// re-encoded result somehow came out larger than the original (can
// happen with an already-small, already-optimized image) - so this can
// only ever help, never hurt.
export async function compressImage(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    // Flatten onto white first - otherwise a transparent PNG's transparent
    // areas would render as solid black once forced into JPEG (which has
    // no alpha channel), which looks like a much worse bug than the
    // flattening-to-white tradeoff already documented above.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
