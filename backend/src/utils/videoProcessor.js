import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Video from '../models/Video.js';
import { uploadVideoToCloudinary, uploadImageToCloudinary, getCloudinaryVideoUrl } from './cloudinaryUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set FFmpeg paths if specified in environment
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const videoDir = path.join(__dirname, '../../videos');
const thumbnailDir = path.join(__dirname, '../../thumbnails');

// Ensure directories exist
[videoDir, thumbnailDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const processVideo = async (videoId, inputPath, useCloudinary = false) => {
  try {
    console.log(`Processing video ${videoId}...`);

    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Get video metadata
    const metadata = await getVideoMetadata(inputPath);
    console.log('Video metadata:', metadata);

    // Update video duration
    video.duration = Math.floor(metadata.duration);

    // If using Cloudinary, upload and let it handle transformations
    if (useCloudinary) {
      console.log('Uploading to Cloudinary...');

      // Generate and upload thumbnail if not already uploaded
      if (!video.thumbnail || video.thumbnail === 'default-thumbnail.jpg') {
        const thumbnailPath = await generateThumbnail(inputPath, videoId);
        try {
          const thumbnailResult = await uploadImageToCloudinary(thumbnailPath, 'sectube/thumbnails');
          video.thumbnail = thumbnailResult.url;
          video.thumbnailPublicId = thumbnailResult.publicId;
        } catch (error) {
          console.error('Thumbnail upload to Cloudinary failed:', error);
        }
      }

      // Upload video to Cloudinary
      const videoResult = await uploadVideoToCloudinary(inputPath, 'sectube/videos');

      // Store Cloudinary info
      video.videoFile.cloudinaryPublicId = videoResult.publicId;
      video.videoFile.cloudinary = true;

      // Generate URLs for different qualities using Cloudinary transformations
      video.videoFile.processedPaths = {
        'original': videoResult.url,
        '360p': getCloudinaryVideoUrl(videoResult.publicId, '360p'),
        '480p': getCloudinaryVideoUrl(videoResult.publicId, '480p'),
        '720p': getCloudinaryVideoUrl(videoResult.publicId, '720p'),
        '1080p': getCloudinaryVideoUrl(videoResult.publicId, '1080p')
      };

      video.processingStatus = 'ready';
      await video.save();

      console.log(`Video ${videoId} uploaded to Cloudinary successfully`);
      return video;
    }

    // Generate thumbnail only if user didn't upload a custom one
    if (!video.thumbnail || video.thumbnail === 'default-thumbnail.jpg') {
      const thumbnailPath = await generateThumbnail(inputPath, videoId);
      video.thumbnail = path.basename(thumbnailPath);
    }
    // If user uploaded a custom thumbnail, keep it as is

    // Process video to different qualities
    const qualitySettings = [
      { name: '360p', width: 640, height: 360, bitrate: '500k' },
      { name: '480p', width: 854, height: 480, bitrate: '1000k' },
      { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
      { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
    ];

    const processedPaths = {};

    // Filter qualities based on original video resolution
    const validQualities = qualitySettings.filter(
      q => q.height <= metadata.height
    );

    // Process each quality
    for (const quality of validQualities) {
      try {
        const outputPath = await transcodeVideo(
          inputPath,
          videoId,
          quality.name,
          quality.width,
          quality.height,
          quality.bitrate
        );
        processedPaths[quality.name] = path.basename(outputPath);
        console.log(`Processed ${quality.name} successfully`);
      } catch (error) {
        console.error(`Error processing ${quality.name}:`, error);
      }
    }

    // If no qualities were processed successfully, use original
    if (Object.keys(processedPaths).length === 0) {
      const originalOutputPath = path.join(
        videoDir,
        `${videoId}-original${path.extname(inputPath)}`
      );
      fs.copyFileSync(inputPath, originalOutputPath);
      processedPaths['original'] = path.basename(originalOutputPath);
    }

    // Update video document
    video.videoFile.processedPaths = processedPaths;
    video.processingStatus = 'ready';
    await video.save();

    // Delete original upload file
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    console.log(`Video ${videoId} processed successfully`);
    return video;
  } catch (error) {
    console.error('Video processing error:', error);

    // Update video status to failed
    try {
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'failed',
        processingError: error.message
      });
    } catch (updateError) {
      console.error('Error updating video status:', updateError);
    }

    throw error;
  }
};

// Get video metadata using ffprobe
const getVideoMetadata = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        resolve({
          duration: metadata.format.duration,
          width: videoStream ? videoStream.width : 0,
          height: videoStream ? videoStream.height : 0,
          codec: videoStream ? videoStream.codec_name : 'unknown'
        });
      }
    });
  });
};

// Generate thumbnail from video
const generateThumbnail = (inputPath, videoId) => {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join(thumbnailDir, `${videoId}.jpg`);

    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['10%'],
        filename: `${videoId}.jpg`,
        folder: thumbnailDir,
        size: '1280x720'
      })
      .on('end', () => {
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

// Transcode video to specific quality
const transcodeVideo = (inputPath, videoId, qualityName, width, height, bitrate) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      videoDir,
      `${videoId}-${qualityName}.mp4`
    );

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${width}x${height}`)
      .videoBitrate(bitrate)
      .audioBitrate('128k')
      .format('mp4')
      .outputOptions([
        '-preset fast',
        '-movflags +faststart', // Enable progressive streaming
        '-pix_fmt yuv420p'
      ])
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing ${qualityName}: ${Math.floor(progress.percent)}%`);
        }
      })
      .run();
  });
};
