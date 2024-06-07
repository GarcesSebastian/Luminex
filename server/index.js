const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require("fluent-ffmpeg");
const cors = require('cors');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

app.get("/", (req, res) => {
    res.send("Hello World");
});

const upload = multer({ dest: 'uploads/' });

// Separar las iteraciones por longitudes de 100
// Verificar porque los thumbnailsFather no aparecen despues de 50 segundos

app.post("/upload", upload.single('file'), async (req, res) => {
    const file = req.file;
    const filePath = file.path;
    const thumbnailsPath = 'thumbnails/';
    const thumbnailSize = { width: 150, height: 100 };
    const thumbnailsPerImage = 5 * 5;
    const gridSize = 5;

    try {
        const videoInfo = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(metadata);
                }
            });
        });
        const duration = videoInfo.format.duration;
        const thumbnailsCount = 1;

        console.log(thumbnailsCount);

        await new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .on('filenames', (filenames) => {
                    console.log('Generated thumbnails:', filenames);
                })
                .on('end', () => {
                    console.log('Thumbnails generation complete');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error generating thumbnails:', err);
                    reject(err);
                })
                .screenshots({
                    count: thumbnailsCount,
                    folder: thumbnailsPath,
                    size: `${thumbnailSize.width}x${thumbnailSize.height}`,
                    filename: 'th%b.png'
                });
        });

        const thumbnailFiles = fs.readdirSync(thumbnailsPath)
            .filter(file => file.startsWith('th'))
            .map(file => path.join(thumbnailsPath, file))
            .sort();

        let combinedImages = [];
        for (let i = 0; i < thumbnailFiles.length; i += thumbnailsPerImage) {
            const batch = thumbnailFiles.slice(i, i + thumbnailsPerImage);
            const compositeImages = batch.map((file, index) => ({
                input: file,
                top: Math.floor(index / gridSize) * thumbnailSize.height,
                left: (index % gridSize) * thumbnailSize.width
            }));

            const outputImagePath = path.join(thumbnailsPath, `t-${Math.floor(i / thumbnailsPerImage) + 1}.png`);

            await sharp({
                create: {
                    width: thumbnailSize.width * gridSize,
                    height: thumbnailSize.height * gridSize,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            })
            .composite(compositeImages)
            .toFile(outputImagePath);

            combinedImages.push(outputImagePath.replace(/\\/g, '/'));
            console.log('Combined thumbnails image created:', outputImagePath);
        }

        thumbnailFiles.forEach(file => fs.unlinkSync(file));

        return res.json({ message: "Thumbnails generated and combined successfully", images: combinedImages });
    } catch (error) {
        console.error('Error processing thumbnails:', error);
        return res.status(500).json({ error: 'Error processing thumbnails' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
