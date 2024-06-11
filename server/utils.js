import path from 'path';
import fs from 'fs';
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import sharp from "sharp";
import * as globals from "./globals.js";

const ffprobePathResolved = ffprobePath.path || ffprobePath;

export const generateThumbnails = async (path, width, height, ceils, client) => {
  try {
      if (!ffmpegPath) throw new Error("ffmpegPath is null");

      const startTime = Date.now(); // Definir el tiempo de inicio

      const args = [
          "-i",
          path,
          "-r",
          "1",
          "-s",
          `${width}x${height}`,
          "-f",
          "image2pipe",
          "-"
      ];
      
      const ffmpeg = spawn(ffmpegPath, args);

      const imageBuffers = await new Promise((resolve, reject) => {
          const buffers = [];
          ffmpeg.stdout.on("data", (data) => buffers.push(data));
          ffmpeg.stdout.on("end", () => resolve(buffers));
          ffmpeg.on("error", (err) => reject(err));
      });

      const totalImages = Math.ceil(imageBuffers.length / (ceils * ceils));
      const spriteConfig = {
          create: {
              width: width * ceils,
              height: height * ceils,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 1 }
          }
      };

      // Enviar el estado al cliente antes de comenzar la generación de thumbnails
      client.send(JSON.stringify({ message: 'Generating thumbnails...', progress: 0, estimatedTime: 'Calculating...' }));

      let pathFilesRoutes = [];
      let processedImages = 0;

      for (let i = 0; i < totalImages; i++) {
          const startIndex = i * ceils * ceils;
          const endIndex = Math.min((i + 1) * ceils * ceils, imageBuffers.length);
          const chunkBuffers = imageBuffers.slice(startIndex, endIndex);

          const spriteFile = `./thumbnails/output-${i + 1}.png`;
          const spriteFileAbsolute = `/thumbnails/output-${i + 1}.png`;

          const compositeOptions = chunkBuffers.map((buffer, index) => ({
              input: buffer,
              top: Math.floor(index / ceils) * height,
              left: (index % ceils) * width,
              ...spriteConfig
          }));

          await sharp(spriteConfig).composite(compositeOptions).toFile(spriteFile);
          pathFilesRoutes.push(spriteFileAbsolute);
          processedImages++;

          const progress = (processedImages / totalImages) * 100;
          const elapsedTime = (Date.now() - startTime) / 1000;
          const estimatedTotalTime = (elapsedTime / processedImages) * totalImages;
          const estimatedRemainingTime = estimatedTotalTime - elapsedTime;

          client.send(JSON.stringify({ message: 'Generating thumbnails...', progress: progress.toFixed(2), estimatedTime: formatTime(estimatedRemainingTime) }));
      }

      return pathFilesRoutes;
  } catch (error) {
      console.error("Error generating sprite: ", error);
      throw error;
  }
};

export const generateVideo = async (filePath, width, height, ceiling, client) => {
  const fileName = "output.mp4";
  const outputVideoPath = path.join("videos", fileName);

  return new Promise(async (resolve, reject) => {
      if (!await fileExists(filePath)) {
          return reject(new Error(`El archivo ${filePath} no existe.`));
      }

      const fileSize = fs.statSync(filePath).size;
      let copiedBytes = 0;

      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(outputVideoPath);

      readStream.on('data', (chunk) => {
          copiedBytes += chunk.length;
          const progress = (copiedBytes / fileSize) * 100;
          client.send(JSON.stringify({ message: 'Copying video...', progress: progress.toFixed(2), estimatedTime: 'Calculating...' }));
      });

      readStream.on('error', (err) => {
          console.error("Error al leer el archivo:", err);
          reject(err);
      });

      writeStream.on('error', (err) => {
          console.error("Error al escribir el archivo:", err);
          reject(err);
      });

      writeStream.on('finish', async () => {
          try {
              const { height: originalHeight } = await getVideoResolution(outputVideoPath);

              const resolutions = [];
              if (originalHeight >= 1080) resolutions.push(720);
              if (originalHeight >= 720) resolutions.push(480);
              if (originalHeight >= 480) resolutions.push(360);

              if (globals.IS_QUALITY_MAX) {
                  const promises = resolutions.map((res) => {
                      const scaledOutputVideoPath = path.join("videos", `output_${res}p.mp4`);
                      return generateCloneQuality(res, outputVideoPath, scaledOutputVideoPath, client);
                  });

                  await Promise.all(promises);
              }

              if (resolutions.length <= 0) {
                  client.send(JSON.stringify({ message: 'Generating thumbnails...', progress: 90, estimatedTime: '10 seconds' }));
              }

              const outputRoutes = await generateThumbnails(outputVideoPath, width, height, ceiling, client);
              outputRoutes.push(fileName);
              resolve(outputRoutes);
          } catch (error) {
              console.error("Error al generar el video:", error);
              reject(error);
          }
      });

      readStream.pipe(writeStream);
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

const fileExists = (filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
};

const generateCloneQuality = async (quality, outputVideoPath, scaledOutputVideoPath, client) => {
  try {
    await generateQuality(outputVideoPath, scaledOutputVideoPath, quality, client);
  } catch (error) {
    console.error("Error al generar el video:", error);
  }
};

export const generateQuality = (filePath, outputPath, resolution, client) => {
  return new Promise((resolve, reject) => {
      const args = [
          '-y',
          '-i', filePath,
          '-vf', `scale=-2:${resolution}` || 'scale=-2:360',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-threads', '8',
          '-c:a', 'copy',
          outputPath
      ];

      const ffmpeg = spawn(ffmpegPath, args);

      let duration = 0;
      let startTime = Date.now();
      let processedSize = 0;
      let speedSum = 0;
      let speedCount = 0;

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      ffmpeg.stderr.on('data', (data) => {
          const dataStr = data.toString();

          const durationMatch = dataStr.match(/Duration: (\d+):(\d+):(\d+.\d+)/);
          if (durationMatch) {
              const hours = parseInt(durationMatch[1]);
              const minutes = parseInt(durationMatch[2]);
              const seconds = parseFloat(durationMatch[3]);
              duration = hours * 3600 + minutes * 60 + seconds;
          }

          const timeMatch = dataStr.match(/time=(\d+):(\d+):(\d+.\d+)/);
          if (timeMatch) {
              const elapsedTime = (Date.now() - startTime) / 1000;

              const hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const seconds = parseFloat(timeMatch[3]);
              const processedDuration = hours * 3600 + minutes * 60 + seconds;

              const percentage = (processedDuration / duration) * 100;

              processedSize = (processedDuration / duration) * fileSize;

              const speedMBps = processedSize / elapsedTime / (1024 * 1024);
              speedSum += speedMBps;
              speedCount++;

              const averageSpeed = speedSum / speedCount;
              const remainingSize = fileSize - processedSize;
              const estimatedTimeRemaining = remainingSize / (averageSpeed * 1024 * 1024);
              const estimatedTotalTime = elapsedTime + estimatedTimeRemaining;

              const hoursEst = Math.floor(estimatedTotalTime / 3600);
              const minutesEst = Math.floor((estimatedTotalTime % 3600) / 60);
              const secondsEst = Math.floor(estimatedTotalTime % 60);
              
              let estimatedTimeStr = '';
              if (hoursEst > 0) {
                  estimatedTimeStr += `${hoursEst} hour${hoursEst > 1 ? 's' : ''} `;
              }
              if (minutesEst > 0) {
                  estimatedTimeStr += `${minutesEst} minute${minutesEst > 1 ? 's' : ''} `;
              }
              if (secondsEst > 0) {
                  estimatedTimeStr += `${secondsEst} second${secondsEst > 1 ? 's' : ''}`;
              }

              client.send(JSON.stringify({ message: 'Generating videos...', progress: percentage.toFixed(2), estimatedTime: estimatedTimeStr }));
          }
      });

      ffmpeg.on('close', (code) => {
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.floor((totalTime % 3600) / 60);
        const seconds = Math.floor(totalTime % 60);
        
        let formattedTime = '';
        if (hours > 0) {
            formattedTime += `${hours} hour${hours > 1 ? 's' : ''} `;
        }
        if (minutes > 0) {
            formattedTime += `${minutes} minute${minutes > 1 ? 's' : ''} `;
        }
        if (seconds > 0) {
            formattedTime += `${seconds} second${seconds > 1 ? 's' : ''}`;
        }
    
        if (code === 0) {
            client.send(JSON.stringify({ message: 'Conversion Completed', progress: 100, estimatedTime: formattedTime }));
            resolve();
        } else {
            reject(new Error(`FFmpeg process exited with code ${code}`));
        }
    });
  });
};

const formatTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  let formattedTime = '';
  if (hours > 0) formattedTime += `${hours} hour${hours > 1 ? 's' : ''} `;
  if (minutes > 0) formattedTime += `${minutes} minute${minutes > 1 ? 's' : ''} `;
  formattedTime += `${seconds} second${seconds > 1 ? 's' : ''}`;

  return formattedTime;
};