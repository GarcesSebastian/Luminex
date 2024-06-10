import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const ffmpegPath = path.join('node_modules', 'ffmpeg-static', 'ffmpeg.exe');
ffmpeg.setFfmpegPath(ffmpegPath);

const includeTmp = "/tmp/";
const ceiling = 11;
const ceilsAll = ceiling * ceiling;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const port = 4000;


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'client-id']
}));

app.use(bodyParser.json({ limit: '3000mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '3000mb' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const upload = multer({ dest: includeTmp + 'uploads/' });
const clients = new Map();

app.use('/thumbnails', express.static(path.join('thumbnails')));

app.get("/", (req, res) => {
    res.send({
        message: "Hello World!",
        clients: clients
    });
});

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);
        if (data.type === 'clientId') {
            clients.set(data.id, ws);
            console.log('Identificador de cliente recibido:', data.id);
        }
    });

    ws.send('¡Conexión establecida con el servidor!');

    ws.on('close', function() {
        clients.forEach((client, clientId) => {
            if (client === ws) {
                clients.delete(clientId);
                console.log('Instancia de cliente eliminada:', clientId);
            }
        });
    });
});

//send message all clients
// clients.forEach((client, clientId) => {
//     client.send('Mensaje para todos los clientes');
// });

app.post("/upload", upload.single('file'), async (req, res) => {
    const clientId = req.headers['client-id'];

    let client = null;

    if (clients.has(clientId)) {
        client = clients.get(clientId);
    }

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

        client.send(JSON.stringify({ message: 'Generating thumbnails...' }));

        for (let i = 0; i < intervalsDuration; i++) {
            await generateThumbnails(duration, thumbnailsPath, imageCombination, i, thumbnailPromises, filePath, thumbnailOutput, intervalsDuration, thumbnailsPathRelative, client);
        }

        const files = fs.readdirSync(includeTmp + 'uploads/');
        for (const file of files) {
            fs.unlinkSync(path.join(includeTmp + 'uploads/', file));
        }
        client.send(JSON.stringify({ message: 'Thumbnails generated successfully'}));
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

    const clientId = req.headers['client-id'];

    let client = null;

    if (clients.has(clientId)) {
        client = clients.get(clientId);
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

    client.send(JSON.stringify({ message: 'Conversion started in quality ' + resolution + '...'}));

    try {
        await convertResolution(inputPath, outputPath, scaleFilter, client);

        res.download(outputPath, 'output.mp4', (err) => {
            if (err) {
                console.error('Error during download:', err);
                return res.status(500).send('Error during download');
            }

            fs.unlink(outputPath, (err) => {
                if (err) console.error('Error deleting output file:', err);
            });
        })
    } catch (error) {
        console.error('Error during conversion:', error.message);
        res.status(500).json({ error: 'Error during conversion' });
    }

    client.send(JSON.stringify({ message: 'Conversion finished'}));
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

async function generateThumbnails(duration, thumbnailsPath, imageCombination, i, thumbnailPromises, filePath, thumbnailOutput, intervalsDuration, thumbnailsPathRelative, client) {
    for (let x = 0; x < ((duration - (ceilsAll * i)) < ceilsAll ? (duration - (ceilsAll * i)) : ceilsAll); x++) {
        const outputPath = path.join(thumbnailsPath, `thumbnail-${x}.png`);
        thumbnailPromises.push(
            new Promise((resolve, reject) => {
                ffmpeg(filePath)
                    .seekInput(x + (ceilsAll * i))
                    .frames(1)
                    .output(outputPath)
                    .on('start', () => {
                        client.send(JSON.stringify({ message: `Generating thumbnail for second ${x}...` }));
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

    await Promise.all(thumbnailPromises);
    
    const listOutput = await mergeThumbnails(thumbnailsPath, thumbnailsPathRelative, i);
    thumbnailOutput.push(...listOutput);
}

function mergeThumbnails(thumbnailsPath, thumbnailsPathRelative, i) {
    return new Promise((resolve, reject) => {
        const thumbnailOutputTest = [];
        const cmd = `${ffmpegPath} -i ${includeTmp}thumbnails/thumbnail-%d.png -vf "scale=175:100, tile=${ceiling}x${ceiling}" ${includeTmp}thumbnails/output-${i + 1}.png`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log("Error generating combined thumbnails: ", error);
                return reject(error);
            }

            const thumbnailFiles = fs.readdirSync(thumbnailsPath)
                .filter(file => file.startsWith('thumbnail-'))
                .map(file => path.join(thumbnailsPath, file))
                .sort();

            try {
                thumbnailFiles.forEach(file => fs.unlinkSync(file));
            } catch (error) {
                console.log("Error cleaning up thumbnails: ", error);
                return reject(error);
            }

            const outputImagePath = path.join(thumbnailsPathRelative, `output-${i + 1}.png`);
            thumbnailOutputTest.push(outputImagePath.replace(/\\/g, '/'));

            resolve(thumbnailOutputTest);
        })
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
            .on('end', () => {
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error during conversion:', err.message);
                reject(err);
            })
            .run();
    });
}