const express = require('express');
const bodyParser = require('body-parser');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 4000;

const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!',
    });
});

app.post('/generate-thumbnails', upload.single('video'), (req, res) => {
    const { rows, columns, interval } = req.body;
    const videoPath = req.file.path;

    if (!videoPath || !rows || !columns || !interval) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const outputDir = 'output_thumbnails';
    const outputImagePath = path.join(outputDir, 'combined_thumbnails.jpg');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const thumbnailsPerImage = rows * columns;

    ffmpeg(videoPath)
        .screenshots({
            count: thumbnailsPerImage,
            folder: outputDir,
            filename: 'thumbnail_%i.png',
            timemarks: Array.from({ length: thumbnailsPerImage }, (_, i) => (i * interval).toString()),
        })
        .on('end', () => {
            console.log('Thumbnails generated successfully');
            combineThumbnails(outputDir, outputImagePath, rows, columns, res);
        })
        .on('error', (err) => {
            console.error('Error generating thumbnails:', err);
            res.status(500).json({ error: 'Error generating thumbnails' });
        });
});

function combineThumbnails(inputDir, outputFile, rows, columns, res) {
    const inputs = [];
    for (let i = 1; i <= rows * columns; i++) {
        inputs.push(path.join(inputDir, `thumbnail_${i}.png`));
    }

    const filter = [];
    let concatStr = "";

    inputs.forEach((input, index) => {
        filter.push(`[${index}:v]scale=160:90[t${index}]`);
        concatStr += `[t${index}]`;
        if ((index + 1) % columns === 0) {
            concatStr += `hstack=inputs=${columns}[row${Math.floor(index / columns)}];`;
        }
    });

    let rowInputs = "";
    for (let i = 0; i < rows; i++) {
        rowInputs += `[row${i}]`;
    }

    filter.push(`${rowInputs}vstack=inputs=${rows}[v]`);

    ffmpeg()
        .input(inputs[0])
        .inputOptions(inputs.slice(1))
        .complexFilter(filter.join('; '))
        .output(outputFile)
        .on('end', () => {
            console.log('Combined image created successfully');
            res.sendFile(outputFile, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Error sending file' });
                }
            });
        })
        .on('error', (err) => {
            console.error('Error creating combined image:', err);
            res.status(500).json({ error: 'Error creating combined image' });
        })
        .run();
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
