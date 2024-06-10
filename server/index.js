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
import * as utils from "./utils.js";

const ffmpegPathRoute = path.join('node_modules', 'ffmpeg-static', 'ffmpeg.exe');
ffmpeg.setFfmpegPath(ffmpegPathRoute);

const includeTmp = "";
const ceiling = 12;
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

app.post("/upload", upload.single('file'), async (req, res) => {
    const clientId = req.headers['client-id'];

    let client = null;

    if (clients.has(clientId)) {
        client = clients.get(clientId);
    }

    const file = req.file;
    const filePath = file.path;
    console.log('File uploaded:', filePath);
    const thumbnailsPath = path.join('thumbnails');
    const videosPath = path.join('videos');
    const thumbnailsPathRelative = '/thumbnails';
    const imageCombination = [];

    if (!fs.existsSync(thumbnailsPath)) {
        fs.mkdirSync(thumbnailsPath, { recursive: true });
    }

    if (!fs.existsSync(videosPath)) {
        fs.mkdirSync(videosPath, { recursive: true });
    }

    //delete file start with 'output' and 'thumbnail'
    fs.readdirSync(thumbnailsPath).forEach(file => {
        if (file.startsWith('output') || file.startsWith('thumbnail')) {
            fs.unlinkSync(path.join(thumbnailsPath, file));
        }
    });

    if(client){
        client.send(JSON.stringify({ message: 'Generating thumbnails...' }));
    }
    const videoPath = await utils.generateVideo(filePath, 175, 100, ceiling, 1080);
    fs.unlinkSync(path.join(includeTmp + 'videos/', videoPath[videoPath.length - 1]));
    return res.json({ message: "Thumbnails generated successfully", images: videoPath });
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

    const outputPath = path.join('videos', `output_${resolution}.mp4`);
    console.log("output path: " + outputPath);

    // verify if the file exists
    if (!fs.existsSync(outputPath)) {
        console.log('File not found:', outputPath);
        return res.send("File not found");
    }

    client.send(JSON.stringify({ message: 'Conversion started in quality ' + resolution + '...'}));

    try {
        // await convertResolution(inputPath, outputPath, scaleFilter, client);

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