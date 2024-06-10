import path from 'path';
import fs from 'fs';
import { spawn } from "child_process";
import concat from "concat-stream";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import sharp from "sharp";
import { splitEvery } from "ramda";
import * as globals from "./globals.js";

const ffmpegPathResolved = ffmpegPath.path || ffmpegPath;
const ffprobePathResolved = ffprobePath.path || ffprobePath;

const mapToArrayChunks = (map, chunkSize) => {
  const array = [...map.values()];
  return splitEvery(chunkSize, array);
};

const splitBuffer = (buffer, startMarker, endMarker) => {
  let buffers = [];
  let start = buffer.indexOf(startMarker);
  let end = buffer.indexOf(endMarker, start) + endMarker.length;

  while (start !== -1 && end !== -1) {
    const bufferedImage = buffer.slice(start, end);
    buffers.push(bufferedImage);
    start = buffer.indexOf(startMarker, end);
    end = buffer.indexOf(endMarker, start) + endMarker.length;
  }

  return buffers;
};

export const generateSprite = async (path, width, height, ceils) => {
  let data_path = path;

  let thumbWidth = width;
  let thumbHeight = height;

  try {
    if (ffmpegPath === null) {
      throw new Error("ffmpegPath is null");
    }

    const ffmpeg = spawn(ffmpegPath, [
      "-i",
      data_path,
      "-r",
      "1",
      "-s",
      `${width}x${height}`,
      "-f",
      "image2pipe",
      "-",
    ]);

    const imageFiles = await new Promise((resolve, reject) => {
      ffmpeg.stdout.pipe(
        concat((allImagesBuffer) => {
          const imageBuffers = splitBuffer(
            allImagesBuffer,
            Buffer.from([0xff, 0xd8]),
            Buffer.from([0xff, 0xd9])
          );

          if (imageBuffers.length === 0) {
            reject("No images found");
          }

          resolve(imageBuffers);
        })
      );
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        console.error(`ffmpeg exited with code ${code}`);
        return;
      }
    });

    let spriteWidth = thumbWidth * ceils;
    let spriteHeight = thumbHeight * ceils;

    const spriteConfig = {
      create: {
        width: spriteWidth,
        height: spriteHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    };

    let png = sharp(spriteConfig);

    const imageFilesChunked = mapToArrayChunks(imageFiles, ceils * ceils);
    const pathFilesRoutes = [];

    for (let i = 0; i < imageFilesChunked.length; i++) {
      console.log("Generating sprite chunk: ", i + 1, "/", imageFilesChunked.length);
      const imageFilesChunk = imageFilesChunked[i];
      const spriteFile = "./thumbnails/output-" + (i + 1) + ".png";
      const spriteFileAbsolute = "/thumbnails/output-" + (i + 1) + ".png";
      pathFilesRoutes.push(spriteFileAbsolute);
      console.log("Sprite file: ", spriteFile);
      const compositeOptions = [];
      let dst_x = 0;
      let dst_y = 0;

      for (let j = 0; j < imageFilesChunk.length; j++) {
        const file = imageFilesChunk[j];

        compositeOptions.push({
          input: file,
          top: dst_y,
          left: dst_x,
          ...spriteConfig,
        });

        if ((j + 1) % ceils === 0) {
          dst_x = 0;
          dst_y += thumbHeight;
        } else {
          dst_x += thumbWidth;
        }
      }

      png = sharp(spriteConfig);
      png.composite(compositeOptions).toFile(spriteFile);
    }

    return pathFilesRoutes;
  } catch (error) {
    console.error("Error generating sprite: ", error);
  }
};

export const generateVideo = async (filePath, width, height, ceiling, quality) => {
  const fileName = "output.mp4";
  const outputVideoPath = path.join("videos", fileName);

  return new Promise(async (resolve, reject) => {
    if (!await fileExists(filePath)) {
      return reject(new Error(`El archivo ${filePath} no existe.`));
    }

    fs.copyFile(filePath, outputVideoPath, async (err) => {
      if (err) {
        console.error("Error al copiar el archivo:", err);
        reject(err);
      } else {
        console.log("Video guardado exitosamente:", outputVideoPath);

        try {
          const { width: originalWidth, height: originalHeight } = await getVideoResolution(outputVideoPath);
          console.log(`Resolución actual del video: ${originalWidth}x${originalHeight}`);

          const resolutions = [];
          if (originalHeight >= 1080) resolutions.push(720);
          if (originalHeight >= 720) resolutions.push(480);
          if (originalHeight >= 480) resolutions.push(360);

          if(globals.IS_QUALITY_MAX){
            console.log("Quality max");
            const promises = resolutions.map((res) => {
              const scaledOutputVideoPath = path.join("videos", `output_${res}p.mp4`);
              return generateCloneQuality(res, outputVideoPath, scaledOutputVideoPath);
            });
  
            await Promise.all(promises);
          }

          const outputRoutes = await generateSprite(outputVideoPath, width, height, ceiling);
          outputRoutes.push(fileName);
          resolve(outputRoutes);
        } catch (error) {
          console.error("Error al generar el video:", error);
          reject(error);
        }
      }
    });
  });
};

export const getVideoResolution = (filePath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn(ffprobePathResolved, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "json",
      filePath,
    ]);

    let output = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const resolution = JSON.parse(output).streams[0];
          resolve({ width: resolution.width, height: resolution.height });
        } catch (error) {
          reject(new Error(`Error parsing ffprobe output: ${error.message}`));
        }
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });

    ffprobe.on('error', (err) => {
      console.error('Error during ffprobe execution:', err.message);
      reject(err);
    });
  });
};

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn(ffprobePathResolved, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      filePath,
    ]);

    let output = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      console.error(`ffprobe stderr: ${data.toString()}`);
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const duration = parseFloat(JSON.parse(output).format.duration);
          resolve(duration);
        } catch (error) {
          reject(new Error(`Error parsing ffprobe output: ${error.message}`));
        }
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });

    ffprobe.on('error', (err) => {
      console.error('Error during ffprobe execution:', err.message);
      reject(err);
    });
  });
};

const fileExists = (filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
};

const convertResolution = async (inputPath, outputPath, scaleFilter) => {
  const duration = await getVideoDuration(inputPath);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let lastTime = startTime;
    let lastSize = 0;

    const ffmpeg = spawn(ffmpegPathResolved, [
      "-i",
      inputPath,
      "-vf",
      scaleFilter,
      "-c:v",
      "libx264",
      "-crf",
      "23",
      "-preset",
      "veryfast",
      "-y",
      outputPath,
      "-progress", 
      "pipe:1"
    ]);

    ffmpeg.stdout.on('data', (data) => {
      const output = data.toString();
      const timeMatch = output.match(/out_time_ms=(\d+)/);
      const fileSize = fs.statSync(outputPath).size;

      if (timeMatch) {
        const time = parseInt(timeMatch[1], 10) / 1000000;
        const currentTime = Date.now();
        const elapsedTime = (currentTime - lastTime) / 1000;
        const dataProcessed = fileSize - lastSize;

        if (elapsedTime > 0) {
          const speed = dataProcessed / elapsedTime / (1024 * 1024);
          console.log(`Velocidad de descarga: ${speed.toFixed(2)} MB/s`);
        }

        const progress = (time / duration) * 100;
        console.log(`Progreso: ${progress.toFixed(2)}%`);

        lastTime = currentTime;
        lastSize = fileSize;
      }
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      console.error("Error during ffmpeg execution:", err.message);
      reject(err);
    });
  });
};

const generateCloneQuality = async (quality, outputVideoPath, scaledOutputVideoPath) => {
  try {
    const scaleFilter = `scale=-2:${quality}`;
    await convertResolution(outputVideoPath, scaledOutputVideoPath, scaleFilter);
  } catch (error) {
    console.error("Error al generar el video:", error);
  }
};