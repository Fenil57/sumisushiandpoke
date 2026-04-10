/**
 * Extract video frames as individual JPEG images for scroll animation.
 * Uses ffmpeg via @ffmpeg-installer/ffmpeg npm package.
 * 
 * Usage: node scripts/extract-frames.cjs
 */

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');

const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const INPUT_VIDEO = path.join(__dirname, '..', 'src', 'assets', 'videos', 'ramen-video.mp4');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'frames');
const FRAME_COUNT = 60; // 60 frames = optimal balance of smoothness and size
const OUTPUT_WIDTH = 960; // downscaled for fast loading, still sharp at screen size

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Clean old frames
const existing = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('frame-'));
existing.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
console.log(`Cleaned ${existing.length} old frames`);

// First, get video duration
ffmpeg.ffprobe(INPUT_VIDEO, (err, metadata) => {
  if (err) {
    console.error('Error probing video:', err);
    process.exit(1);
  }

  const duration = metadata.format.duration;
  const fps = FRAME_COUNT / duration;

  console.log(`Video duration: ${duration}s`);
  console.log(`Extracting ${FRAME_COUNT} frames at ${fps.toFixed(2)} fps`);
  console.log(`Output width: ${OUTPUT_WIDTH}px`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('');

  ffmpeg(INPUT_VIDEO)
    .outputOptions([
      `-vf`, `fps=${fps},scale=${OUTPUT_WIDTH}:-1`,
      `-qscale`, `75`,  // WebP quality (0-100, higher is better) — 75 is great balance
    ])
    .output(path.join(OUTPUT_DIR, 'frame-%04d.webp'))
    .on('progress', (progress) => {
      if (progress.percent) {
        process.stdout.write(`\rExtracting: ${Math.round(progress.percent)}%`);
      }
    })
    .on('end', () => {
      // Count actual extracted frames
      const frames = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('frame-') && f.endsWith('.webp'));
      console.log(`\n\nDone! Extracted ${frames.length} frames`);
      
      // Calculate total size
      let totalSize = 0;
      frames.forEach(f => {
        totalSize += fs.statSync(path.join(OUTPUT_DIR, f)).size;
      });
      console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Average frame size: ${(totalSize / frames.length / 1024).toFixed(1)} KB`);
    })
    .on('error', (err) => {
      console.error('Error extracting frames:', err);
      process.exit(1);
    })
    .run();
});
