import test from 'node:test';
import assert from 'node:assert';
import * as constants from '../../../src/config/constants.js';

test('Frontend Constants Utility Logic', async (t) => {
  // Since we're in Node and not Vite, import.meta.env won't exist.
  // The module uses it on load to define API_BASE_URL and BACKEND_URL.
  // In our test, BACKEND_URL will default to 'http://localhost:5000' (replacing '/api' in the fallback)
  
  const expectedBackendUrl = 'http://localhost:5000';

  await t.test('getAssetUrl should handle empty path', () => {
    const url = constants.getAssetUrl(null);
    assert.strictEqual(url, `${expectedBackendUrl}/avatars/default-avatar.svg`);
  });

  await t.test('getAssetUrl should handle absolute URLs', () => {
    const absUrl = 'https://cloudinary.com/video.mp4';
    const url = constants.getAssetUrl(absUrl);
    assert.strictEqual(url, absUrl);
  });

  await t.test('getAssetUrl should handle relative local paths', () => {
    const path = '/some/path.jpg';
    const url = constants.getAssetUrl(path);
    assert.strictEqual(url, `${expectedBackendUrl}${path}`);
  });

  await t.test('getAvatarUrl should provide default avatar when no path', () => {
    const url = constants.getAvatarUrl(null);
    assert.strictEqual(url, `${expectedBackendUrl}/avatars/default-avatar.svg`);
  });

  await t.test('getAvatarUrl should handle specific avatar path', () => {
    const avatar = 'user123.png';
    const url = constants.getAvatarUrl(avatar);
    assert.strictEqual(url, `${expectedBackendUrl}/avatars/${avatar}`);
  });

  await t.test('getThumbnailUrl should handle absolute URLs', () => {
    const thumb = 'https://some-cdn.com/thumb.jpg';
    const url = constants.getThumbnailUrl(thumb);
    assert.strictEqual(url, thumb);
  });

  await t.test('getThumbnailUrl should handle relative paths', () => {
    const thumb = 'video123.jpg';
    const url = constants.getThumbnailUrl(thumb);
    assert.strictEqual(url, `${expectedBackendUrl}/thumbnails/${thumb}`);
  });
});
