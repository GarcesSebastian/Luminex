const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4000;

// Aumentar el límite de tamaño de carga en body-parser
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

// Configuración de Multer para almacenamiento de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Aumentar el límite de tamaño de archivo en multer
const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

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

    // Crear el directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Número de thumbnails
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