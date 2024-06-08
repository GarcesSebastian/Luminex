const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const ffmpegPath = path.join(__dirname, 'node_modules' , 'ffmpeg-static', 'ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 4000;
  
app.use(cors());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const upload = multer({dest: 'uploads/'});
  
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

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
        const intervalsDuration = Math.ceil(duration / 25);
        console.log('Video duration:', duration);
        console.log('Intervals duration:', intervalsDuration);

        const thumbnailPromises = [];
        const thumbnailOutput = [];

        console.log("Generating thumbnails...");

        for(let i = 0; i < intervalsDuration; i++) {
            for(let x = 0; x < 25; x++) {
                const outputPath = path.join(thumbnailsPath, `thumbnail-${x + (25 * i)}.png`);
                thumbnailPromises.push(
                    new Promise((resolve, reject) => {
                        ffmpeg(filePath)
                            .seekInput(x + (25 * i))
                            .frames(1)
                            .output(outputPath)
                            .on('start', () => {
                                console.log(`Generating thumbnail for second ${x + (25 * i)}...`);
                            })
                            .on('end', () => {
                                imageCombination.push(outputPath.replace(/\\/g, '/'));
                                resolve(outputPath.replace(/\\/g, '/'));
                            })
                            .on('error', (err) => {
                                console.error(`Error generating thumbnail for second ${x + (25 * i)}:`, err.message);
                                reject(err);
                            })
                            .run();
                    })
                );
            }

        }

        await Promise.all(thumbnailPromises);

        const cmd = `${ffmpegPath} -i thumbnails/thumbnail-%d.png -vf "scale=200:125, tile=5x5" thumbnails/output-%d.png`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log("Error generating combined thumbnails: ", error);
                return res.status(500).json({ error: 'Error processing request' });
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
                return res.status(500).json({ error: 'Error processing request' });
            }

            for (let i = 1; i <= intervalsDuration; i++) {
                const outputImagePath = path.join(thumbnailsPathRelative, `output-${i}.png`);
                thumbnailOutput.push(outputImagePath.replace(/\\/g, '/'));
            }

            return res.json({ message: "Thumbnails generated successfully", images: thumbnailOutput });
        })
        .on('spawn', () => {
            console.log('Generate Thumbnails Father');
        })

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Error processing request' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
