import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

const ffmpegPath = path.join('node_modules', 'ffmpeg-static', 'ffmpeg.exe');
ffmpeg.setFfmpegPath(ffmpegPath);

const includeTmp = "";
const ceiling = 11;
const ceilsAll = ceiling * ceiling;

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '3000mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '3000mb' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const upload = multer({ dest: includeTmp + 'uploads/' });

app.use('/thumbnails', express.static(path.join('thumbnails')));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/upload", upload.single('file'), async (req, res) => {
    const file = req.file;
    const filePath = file.path;
    const thumbnailsPath = path.join('thumbnails');
    const thumbnailsPathRelative = '/thumbnails';
    const imageCombination = [];

    if (!fs.existsSync(thumbnailsPath)) {
        fs.mkdirSync(thumbnailsPath, { recursive: true });
    }

    try {
        fs.readdirSync(thumbnailsPath)
            .filter(file => file.startsWith('output-') || file.startsWith('thumbnail-'))
            .map(file => path.join(thumbnailsPath, file))
            .forEach(file => {
                fs.unlinkSync(file);
                console.log("Deleted file: ", file);
            });

    } catch (error) {
        console.log("Error cleaning thumbnails directory: ", error);
        return res.status(500).json({ error: 'Error processing request' });
    }

    try {
        const duration = Math.ceil(req.body.duration);
        const intervalsDuration = Math.ceil(duration / ceilsAll);
        console.log('Video duration:', duration);
        console.log('Intervals duration:', intervalsDuration);

        const thumbnailPromises = [];
        let thumbnailOutput = [];

        console.log("Generating thumbnails...");

        for (let i = 0; i < intervalsDuration; i++) {
            await generateThumbnails(duration, thumbnailsPath, imageCombination, i, thumbnailPromises, filePath, thumbnailOutput, intervalsDuration, thumbnailsPathRelative);
        }

        console.log("thumbnailOutput", thumbnailOutput);
        return res.json({ message: "Thumbnails generated successfully", images: thumbnailOutput });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Error processing request' });
    }
});

app.post('/convert', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded');
    }

    const inputPath = file.path;
    const resolution = req.body.resolution;
    const index = req.body.index;

    let scaleFilter;
    switch (resolution) {
        case '1080p':
            scaleFilter = 'scale=-2:1080';
            break;
        case '720p':
            scaleFilter = 'scale=-2:720';
            break;
        case '480p':
            scaleFilter = 'scale=-2:480';
            break;
        case '360p':
            scaleFilter = 'scale=-2:360';
            break;
        default:
            return res.status(400).send('Unsupported resolution');
    }

    const outputPath = path.join('uploads', `output-${index}.mp4`);

    try {
        await convertResolution(inputPath, outputPath, scaleFilter);
        res.download(outputPath, 'output.mp4', (err) => {
            if (err) console.error(err);
            fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error('Error during conversion:', error.message);
        res.status(500).json({ error: 'Error during conversion' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

async function generateThumbnails(duration, thumbnailsPath, imageCombination, i, thumbnailPromises, filePath, thumbnailOutput, intervalsDuration, thumbnailsPathRelative) {
    for (let x = 0; x < ((duration - (ceilsAll * i)) < ceilsAll ? (duration - (ceilsAll * i)) : ceilsAll); x++) {
        const outputPath = path.join(thumbnailsPath, `thumbnail-${x}.png`);
        thumbnailPromises.push(
            new Promise((resolve, reject) => {
                ffmpeg(filePath)
                    .seekInput(x + (ceilsAll * i))
                    .frames(1)
                    .output(outputPath)
                    .on('start', () => {
                        console.log(`Generating thumbnail for second ${x}...`);
                    })
                    .on('end', () => {
                        imageCombination.push(outputPath.replace(/\\/g, '/'));
                        resolve(outputPath.replace(/\\/g, '/'));
                    })
                    .on('error', (err) => {
                        console.error(`Error generating thumbnail for second ${x}:`, err.message);
                        reject(err);
                    })
                    .run();
            })
        );
    }

    const some = await Promise.all(thumbnailPromises);
    
    const listOutput = await mergeThumbnails(thumbnailsPath, intervalsDuration, thumbnailsPathRelative, some, i);
    thumbnailOutput.push(...listOutput);
}

function mergeThumbnails(thumbnailsPath, intervalsDuration, thumbnailsPathRelative, some, i) {
    return new Promise((resolve, reject) => {
        const thumbnailOutputTest = [];
        const cmd = `${ffmpegPath} -i ${includeTmp}thumbnails/thumbnail-%d.png -vf "scale=175:100, tile=${ceiling}x${ceiling}" ${includeTmp}thumbnails/output-${i + 1}.png`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log("Error generating combined thumbnails: ", error);
                return reject(error);
            }

            console.log("Combined thumbnails generated successfully");

            const thumbnailFiles = fs.readdirSync(thumbnailsPath)
                .filter(file => file.startsWith('thumbnail-'))
                .map(file => path.join(thumbnailsPath, file))
                .sort();

            try {
                thumbnailFiles.forEach(file => fs.unlinkSync(file));
                console.log("Thumbnails cleaned up successfully");
            } catch (error) {
                console.log("Error cleaning up thumbnails: ", error);
                return reject(error);
            }

            const outputImagePath = path.join(thumbnailsPathRelative, `output-${i + 1}.png`);
            thumbnailOutputTest.push(outputImagePath.replace(/\\/g, '/'));

            resolve(thumbnailOutputTest);
        }).on('spawn', () => {
            console.log('Generate Thumbnails Father');
        });
    });
}

function convertResolution(inputPath, outputPath, scaleFilter){
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions('-c:v', 'libx264')
            .outputOptions('-crf', '23')
            .outputOptions('-preset', 'veryfast')
            .videoFilter(scaleFilter)
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('end', () => {
                console.log('Conversion finished');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error during conversion:', err.message);
                reject(err);
            })
            .run();
    });
}
