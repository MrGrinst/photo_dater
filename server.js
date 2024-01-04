const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Get root directory from command line argument
const ROOT_PATH = process.argv[2];

if (!ROOT_PATH) {
    console.error('Must pass a root path argument');
    process.exit();
}

app.use(express.static('public'));

app.post('/upload', upload.array('files'), (req, res) => {
    const date = req.body.date;
    req.files.forEach(file => {
        const filePath = path.join(ROOT_PATH, file.originalname);
        const uploadPath = file.path;
        const newDate = new Date(date + 'T12:00:00-04:00');
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileCreatedDate = new Date(stats.birthtime);

            if (newDate > fileCreatedDate) {
                const tempFilePath = path.join(ROOT_PATH, `temp_${file.originalname}`);
                fs.copyFileSync(filePath, tempFilePath);
                const timestamp = newDate.getTime() / 1000;
                execSync(`touch -a -m -t ${formatTimestamp(timestamp)} "${tempFilePath}"`);
                fs.renameSync(tempFilePath, filePath);
            } else {
                const timestamp = newDate.getTime() / 1000;
                execSync(`touch -a -m -t ${formatTimestamp(timestamp)} "${filePath}"`);
            }
            fs.unlinkSync(uploadPath);
        }
    });
    res.send('Files processed');
});

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}.${pad(date.getSeconds())}`;
}

function pad(number) {
    return number.toString().padStart(2, '0');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
