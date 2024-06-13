export const test = async () => {
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
}
  
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