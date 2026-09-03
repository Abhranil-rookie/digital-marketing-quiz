const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const questions = require('./questions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'teams.json');

if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
}

const readTeams = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeTeams = (teams) => fs.writeFileSync(DATA_FILE, JSON.stringify(teams, null, 2));

// Get random questions
app.get('/api/questions', (req, res) => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    res.json(shuffled);
});

// Register team
app.post('/api/register', (req, res) => {
    const { teamName, members, email, phone } = req.body;
    if (!teamName || !members) {
        return res.status(400).json({ error: 'Team name and members are required' });
    }
    const teams = readTeams();
    const newTeam = {
        id: Date.now(),
        teamName,
        members,
        email,
        phone,
        registeredAt: new Date().toISOString(),
        status: 'Registered',
        quiz: null
    };
    teams.push(newTeam);
    writeTeams(teams);
    res.status(201).json(newTeam);
});

// Submit quiz
app.post('/api/submit', (req, res) => {
    const { teamId, answers, timeTaken, suspiciousActivity } = req.body;
    const teams = readTeams();
    const teamIndex = teams.findIndex(t => t.id == teamId);
    if (teamIndex === -1) {
        return res.status(404).json({ error: 'Team not found' });
    }

    let correct = 0;
    answers.forEach((ans, idx) => {
        if (ans !== null && ans === questions[idx].correct) correct++;
    });
    const wrong = answers.length - correct;
    const score = correct * 2;

    teams[teamIndex].quiz = {
        answers,
        score,
        correct,
        wrong,
        timeTaken,
        suspiciousActivity,
        completedAt: new Date().toISOString(),
        status: 'Completed'
    };
    writeTeams(teams);
    res.json(teams[teamIndex]);
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    if (req.body.passcode === 'nothing can beat the power of money') {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid passcode' });
    }
});

// Admin get teams
app.get('/api/admin/teams', (req, res) => {
    res.json(readTeams());
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});