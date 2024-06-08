const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPathStatic = require('ffmpeg-static');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Importar los binarios instalados
ffmpeg.setFfmpegPath(ffmpegPathStatic);

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

app.get("/", (req, res) => {
    res.send("Hello World");
});

//https://fluent-ffmpeg.github.io/

const upload = multer({ dest: 'uploads/' });

app.post("/upload", upload.single('file'), async (req, res) => {
    const file = req.file;
    const filePath = file.path;
    const thumbnailsPath = path.join(__dirname, 'thumbnails');
    const thumbnailsPathRelative = '/thumbnails';
    const imageCombination = [];
    let isGenerating = false;
    
    if (!fs.existsSync(thumbnailsPath)) {
        fs.mkdirSync(thumbnailsPath);
    }

    try{
        fs.readdirSync(thumbnailsPath)
        .filter(file => file.startsWith('output-'))
        .map(file => path.join(thumbnailsPath, file))
        .sort()
        .forEach(file => {
            fs.unlinkSync(file);
            console.log("Deleted file: ", file);
        });
    
        fs.readdirSync(thumbnailsPath)
        .filter(file => file.startsWith('thumbnail-'))
        .map(file => path.join(thumbnailsPath, file))
        .sort()
        .forEach(file => {
            fs.unlinkSync(file);
            console.log("Deleted file: ", file);
        });
    }catch(error){
        console.log("Ha ocurrido un error. ", error);
        return res.status(500).json({ error: 'Error processing request' });
    }

    try {

        const duration =  Math.ceil(req.body.duration);
        const intervalsDuration = Math.ceil(duration / 25);
        console.log('Video duration:', duration);
        console.log('Intervals duration:', intervalsDuration);

        const thumbnailPromises = [];
        const thumbnailOutput = [];

        console.log("Generating thumbnails...");

        for (let i = 0; i < duration; i++) {
            const outputPath = path.join(thumbnailsPath, `thumbnail-${i}.png`);
            thumbnailPromises.push(
                new Promise((resolve, reject) => {
                    ffmpeg(filePath)
                        .seekInput(i)
                        .frames(1)
                        .output(outputPath)
                        .on('start', () => {
                            console.log(`Generating thumbnail for second ${i}...`);
                        })
                        .on('end', () => {
                            imageCombination.push(outputPath.replace(/\\/g, '/'));
                            resolve(outputPath.replace(/\\/g, '/'));
                        })
                        .on('error', (err) => {
                            console.error(`Error generating thumbnail for second ${i}:`, err.message);
                            reject(err);
                        })
                        .run();
                })
            );
        }

        const thumbnails = await Promise.all(thumbnailPromises);
        
        const cmd = `${ffmpegPathStatic} -i thumbnails/thumbnail-%d.png -filter_complex "[0:v]scale=200:125[tiled];[tiled]tile=5x5" thumbnails/output-%d.png`;

        exec(cmd, (error, stdout, stderr) => {
            if(error){
                console.log("Ha ocurrido un error. ", error);
                return res.status(500).json({ error: 'Error processing request' });
            }
        })
        .on('spawn', () => {
            console.log("Generating thumbnails father...");
            isGenerating = true;
        })
        .on('exit', () => {
            if(!isGenerating){
                console.log("Error generating thumbnails");
                return res.status(500).json({ error: 'Error processing request' });
            }

            isGenerating = false;

            const thumbnailFiles = fs.readdirSync(thumbnailsPath)
            .filter(file => file.startsWith('thumbnail-'))
            .map(file => path.join(thumbnailsPath, file))
            .sort();

            try{
                thumbnailFiles.forEach(file => fs.unlinkSync(file))
                console.log("Thumbnails generated successfully");
            }catch(error){
                console.log("Ha ocurrido un error. ", error);
                return res.status(500).json({ error: 'Error processing request' });
            }

            for(let i = 1; i <= intervalsDuration; i++){
                const outputImagePath = path.join(thumbnailsPathRelative, `output-${i}.png`);
                thumbnailOutput.push(outputImagePath.replace(/\\/g, '/'));
            }

            return res.json({ message: "Thumbnails generated successfully", images: thumbnailOutput });
        })
        .on('error', (error) => {
            console.log("Ha ocurrido un error. ", error);
            return res.status(500).json({ error: 'Error processing request' });
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Error processing request' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});