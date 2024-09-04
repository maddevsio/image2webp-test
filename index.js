const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv')

dotenv.config()

const app = express();
const port = process.env.PORT;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/convert', upload.single('image'), (req, res) => {
    const inputFilePath = req.file.path;
    const outputFilePath = path.join('uploads', `${Date.now()}.webp`);

    ffmpeg(inputFilePath)
        .output(outputFilePath)
        .outputOptions([
            '-c:v libwebp',
            '-lossless 1',
            '-q:v 100',
            '-compression_level 6'
        ])
        .on('end', () => {
            fs.unlinkSync(inputFilePath);

            res.json({
                imageUrl: `/uploads/${path.basename(outputFilePath)}`,
                downloadUrl: `/uploads/${path.basename(outputFilePath)}`
            });
        })
        .on('error', err => {
            console.error('Error during conversion:', err);
            res.status(500).send('Error during conversion');
        })
        .run();
});

app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
