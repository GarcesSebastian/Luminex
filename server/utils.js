import path from 'path';
import fs from 'fs';
import { spawn } from "child_process";
import concat from "concat-stream";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { splitEvery } from "ramda";

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
  const scaledOutputVideoPath = path.join("videos", `output_${quality}p.mp4`);

  return new Promise((resolve, reject) => {
    fs.copyFile(filePath, outputVideoPath, async (err) => {
      if (err) {
        console.error("Error al copiar el archivo:", err);
        reject(err);
      } else {
        console.log("Video guardado exitosamente:", outputVideoPath);
        const outputRoutes = await generateSprite(outputVideoPath, width, height, ceiling);
        outputRoutes.push(fileName);
        resolve(outputRoutes);
      }
    });
  });
};

const generateCloneQuality = async () => {
    try {
      const scaleFilter = `scale=-2:${quality}p`;
      await convertResolution(outputVideoPath, scaledOutputVideoPath, scaleFilter);

      console.log(`Video convertido a ${quality} exitosamente:`, scaledOutputVideoPath);

      const outputRoutes = await generateSprite(scaledOutputVideoPath, width, height, ceiling);
      outputRoutes.push(fileName);
      resolve(outputRoutes);
    } catch (error) {
      console.error("Error al generar el video:", error);
      reject(error);
    }
}

const convertResolution = async (inputPath, outputPath, scaleFilter) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
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
      outputPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      console.error("Error durante la conversión:", err.message);
      reject(err);
    });
  });
};