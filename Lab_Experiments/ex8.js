const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // For handling POST data
app.use(express.urlencoded({ extended: true }));

// GET request handling with fs and path
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('File read error');
        }
        res.send(data);
    });
});

// POST request handling
app.post('/submit', (req, res) => {
    const { name } = req.body;
    console.log(`Hello ${name}, this is Experiment 8 using Express POST method!`);

    // Save submitted data to data.json
    const dataFile = path.join(__dirname, 'data.json');
    let existingData = [];
    try {
        const fileContent = fs.readFileSync(dataFile, 'utf8');
        existingData = JSON.parse(fileContent);
    } catch (err) {
        existingData = [];
    }

    existingData.push({ name, submittedAt: new Date().toLocaleString() });
    fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

    res.send(`<h1>Hello ${name}, this is Experiment 8 using Express POST method!</h1><p>Data saved to data.json</p>`);
});

// Handling a normal API GET route
app.get('/api/data', (req, res) => {
    res.json({ title: "Experiment 8 Data", success: true });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Experiment 8 (Express.js) running on http://localhost:${PORT}`);
});
