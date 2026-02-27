import { describe, it, expect } from 'vitest';
import { getAssetUrl, getAvatarUrl, getThumbnailUrl, getVideoUrl, BACKEND_URL } from './constants';

describe('Constants Config', () => {
  describe('getAssetUrl', () => {
    it('should return default avatar URL if path is null or undefined', () => {
      expect(getAssetUrl(null)).toBe(`${BACKEND_URL}/avatars/default-avatar.svg`);
      expect(getAssetUrl(undefined)).toBe(`${BACKEND_URL}/avatars/default-avatar.svg`);
    });

    it('should return the path as is if it starts with http://', () => {
      const url = 'http://example.com/image.png';
      expect(getAssetUrl(url)).toBe(url);
    });

    it('should return the path as is if it starts with https://', () => {
      const url = 'https://example.com/image.png';
      expect(getAssetUrl(url)).toBe(url);
    });

    it('should prepend BACKEND_URL if path is relative', () => {
      const path = '/images/logo.png';
      expect(getAssetUrl(path)).toBe(`${BACKEND_URL}${path}`);
    });

    it('should handle relative path without leading slash', () => {
      const path = 'images/logo.png';
      expect(getAssetUrl(path)).toBe(`${BACKEND_URL}/${path}`);
    });
  });

  describe('getAvatarUrl', () => {
    it('should return default avatar URL if path is null or undefined', () => {
      expect(getAvatarUrl(null)).toBe(`${BACKEND_URL}/avatars/default-avatar.svg`);
    });

    it('should return the path as is if it starts with http:// or https://', () => {
      const url = 'https://example.com/avatar.png';
      expect(getAvatarUrl(url)).toBe(url);
    });

    it('should return path with /avatars prefix if relative', () => {
      const filename = 'user123.png';
      expect(getAvatarUrl(filename)).toBe(`${BACKEND_URL}/avatars/${filename}`);
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return default thumbnail URL if path is null or undefined', () => {
      expect(getThumbnailUrl(null)).toBe(`${BACKEND_URL}/thumbnails/default-thumbnail.jpg`);
    });

    it('should return the path as is if it starts with http:// or https://', () => {
      const url = 'https://example.com/thumb.jpg';
      expect(getThumbnailUrl(url)).toBe(url);
    });

    it('should return path with /thumbnails prefix if relative', () => {
      const filename = 'video123.jpg';
      expect(getThumbnailUrl(filename)).toBe(`${BACKEND_URL}/thumbnails/${filename}`);
    });
  });

  describe('getVideoUrl', () => {
    it('should return default avatar URL (via getAssetUrl) if path is null', () => {
        // Based on current implementation: getAssetUrl(null)
      expect(getVideoUrl(null)).toBe(`${BACKEND_URL}/avatars/default-avatar.svg`);
    });

    it('should return the path as is if it starts with http:// or https://', () => {
      const url = 'https://example.com/video.mp4';
      expect(getVideoUrl(url)).toBe(url);
    });

    it('should return processed asset URL if relative', () => {
        const path = '/videos/test.mp4';
        expect(getVideoUrl(path)).toBe(`${BACKEND_URL}${path}`);
    });
  });
});
