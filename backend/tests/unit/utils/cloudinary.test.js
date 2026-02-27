import test from 'node:test';
import assert from 'node:assert';
import cloudinary from '../../../src/config/cloudinary.js';
import { getCloudinaryVideoUrl } from '../../../src/utils/cloudinaryUpload.js';

test('Cloudinary Utility Logic', async (t) => {
  const publicId = 'test-video-id';

  // Mock cloudinary.url to avoid configuration errors and track calls
  t.mock.method(cloudinary, 'url', (id, options) => {
    // Return a dummy URL based on the options
    let url = `https://res.cloudinary.com/test-cloud/video/upload/`;
    
    if (options.transformation) {
      const t = options.transformation[0];
      url += `w_${t.width},h_${t.height},c_${t.crop},q_${t.quality}/`;
    }
    
    url += `${id}.${options.format || 'mp4'}`;
    return url;
  });

  await t.test('should return null if no publicId is provided', () => {
    assert.strictEqual(getCloudinaryVideoUrl(null), null);
    assert.strictEqual(getCloudinaryVideoUrl(''), null);
  });

  await t.test('should generate original video URL correctly', () => {
    const url = getCloudinaryVideoUrl(publicId, 'original');
    assert.ok(url.includes(publicId), 'URL should include publicId');
    assert.ok(url.endsWith('.mp4'), 'URL should end with .mp4');
    assert.strictEqual(cloudinary.url.mock.calls.length, 1);
  });

  await t.test('should generate 360p quality URL correctly', () => {
    const url = getCloudinaryVideoUrl(publicId, '360p');
    assert.ok(url.includes(publicId));
    assert.ok(url.includes('w_640,h_360'), 'URL should include width and height for 360p');
    assert.ok(url.includes('c_limit'), 'URL should include crop limit');
  });

  await t.test('should generate 1080p quality URL correctly', () => {
    const url = getCloudinaryVideoUrl(publicId, '1080p');
    assert.ok(url.includes(publicId));
    assert.ok(url.includes('w_1920,h_1080'), 'URL should include width and height for 1080p');
  });

  await t.test('should return null for invalid quality', () => {
    assert.strictEqual(getCloudinaryVideoUrl(publicId, 'invalid-quality'), null);
  });
});
