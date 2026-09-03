// Global state
let currentTeam = null;
let questions = [];
let currentQuestion = 0;
let answers = [];
let quizTimer = null;
let quizStartTime = null;
let suspiciousActivity = [];
let tabSwitchCount = 0;
let mouseLeaveCount = 0;
let isFullscreen = false;

// Initialize particles (same as original)
function initParticles() { /* ... */ }

// Tab navigation
function showTab(tab) { /* ... same as original ... */ }

// Team registration
async function registerTeam(event) {
    event.preventDefault();
    const teamName = document.getElementById('teamName').value;
    const members = document.getElementById('teamMembers').value;
    const email = document.getElementById('teamEmail').value;
    const phone = document.getElementById('teamPhone').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, members, email, phone })
    });
    if (response.ok) {
        currentTeam = await response.json();
        alert('Team registered successfully!');
        document.getElementById('registrationForm').reset();
        showTab('quiz');
        startQuiz();
    } else {
        alert('Registration failed');
    }
}

// Start quiz
async function startQuiz() {
    // Fetch 50 random questions
    const response = await fetch('/api/questions');
    questions = await response.json();
    answers = new Array(questions.length).fill(null);
    
    document.getElementById('quizTeamName').textContent = 'Team: ' + currentTeam.teamName;
    document.getElementById('timerDisplay').style.display = 'block';
    
    quizStartTime = new Date();
    currentQuestion = 0;
    renderQuestion();
    startTimer();
    enableAntiCheat();
    requestFullscreen();
}

// Render question (same logic, but using questions array)
function renderQuestion() { /* ... */ }

// Select option
function selectOption(index) { /* ... */ }

// Next / Previous navigation
function nextQuestion() { /* ... */ }
function previousQuestion() { /* ... */ }

// Timer
function startTimer() { /* ... */ }

// Anti-cheat: request fullscreen
function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
        isFullscreen = true;
    }
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            isFullscreen = false;
            document.getElementById('fullscreenWarning').style.display = 'flex';
            // Re-request after a short delay or show warning
            setTimeout(() => {
                if (!isFullscreen) {
                    document.getElementById('fullscreenWarning').style.display = 'none';
                    requestFullscreen();
                }
            }, 3000);
        } else {
            isFullscreen = true;
            document.getElementById('fullscreenWarning').style.display = 'none';
        }
    });
}

// Anti-cheat listeners
function enableAntiCheat() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            tabSwitchCount++;
            suspiciousActivity.push({ type: 'Tab Switch', time: new Date().toISOString() });
            if (tabSwitchCount >= 3) {
                alert('Warning: Multiple tab switches detected! This will be reported.');
            }
        }
    });
    document.addEventListener('mouseleave', () => {
        mouseLeaveCount++;
        suspiciousActivity.push({ type: 'Mouse Leave', time: new Date().toISOString() });
        if (mouseLeaveCount >= 5) {
            alert('Warning: Suspicious activity detected!');
        }
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('copy', (e) => e.preventDefault());
}

// Submit quiz
async function submitQuiz() {
    clearInterval(quizTimer);
    const timeTaken = Math.round((new Date() - quizStartTime) / 1000);
    
    const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            teamId: currentTeam.id,
            answers,
            timeTaken,
            suspiciousActivity
        })
    });
    
    if (response.ok) {
        const result = await response.json();
        document.getElementById('timerDisplay').style.display = 'none';
        document.exitFullscreen();
        showResults(result.quiz);
    }
}

// Show results
function showResults(result) { /* ... same as original ... */ }

// Admin functions
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'block';
}
function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}
async function adminLogin() {
    const passcode = document.getElementById('adminPasscode').value;
    const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
    });
    if (response.ok) {
        closeAdminModal();
        showTab('admin');
        loadAdminData();
    } else {
        alert('Invalid passcode');
    }
}
async function loadAdminData() {
    const response = await fetch('/api/admin/teams');
    const teams = await response.json();
    renderAdminPanel(teams);
}
function renderAdminPanel(teams) { /* ... same as original ... */ }

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    // Check if team already registered (for refresh)
    const savedTeam = localStorage.getItem('currentTeam');
    if (savedTeam) currentTeam = JSON.parse(savedTeam);
});