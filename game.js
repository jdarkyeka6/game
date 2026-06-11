// Game State
const gameState = {
    player: null,
    year: 1,
    isPlaying: false
};

// Player Template
class Player {
    constructor(name, gender, appearance) {
        this.name = name;
        this.gender = gender;
        this.appearance = appearance;
        this.age = 18;
        this.year = 0;
        
        // Stats
        this.health = 100;
        this.happiness = 100;
        this.intelligence = 50;
        this.attractiveness = appearance === 'attractive' ? 75 : appearance === 'average' ? 50 : 25;
        
        // Career & Money
        this.career = null;
        this.salary = 0;
        this.bank = 5000;
        
        // Life events
        this.events = ['Welcome to LifeSim! Start your adventure.'];
        this.lifeSpan = 80 + Math.floor(Math.random() * 10);
    }
    
    getLifeExpectancy() {
        return this.lifeSpan;
    }
}

// Career Data
const careers = {
    student: {
        name: 'Student',
        salary: 0,
        intelligence: 5,
        happiness: -2
    },
    office: {
        name: 'Office Worker',
        salary: 50000,
        intelligence: 2,
        happiness: -1,
        health: -1
    },
    doctor: {
        name: 'Doctor',
        salary: 120000,
        intelligence: 10,
        happiness: 2,
        requires: 'intelligence >= 80'
    },
    engineer: {
        name: 'Engineer',
        salary: 100000,
        intelligence: 8,
        happiness: 1,
        requires: 'intelligence >= 75'
    },
    artist: {
        name: 'Artist',
        salary: 40000,
        happiness: 5,
        intelligence: 1,
        attractiveness: 2
    }
};

// Activities and their effects
const activities = {
    school: {
        name: 'Study',
        intelligence: 10,
        happiness: -5,
        health: -2
    },
    work: {
        name: 'Work',
        happiness: -3,
        health: -2,
        salary: 'bonus'
    },
    exercise: {
        name: 'Exercise',
        health: 15,
        attractiveness: 5,
        happiness: 8
    },
    social: {
        name: 'Socialize',
        happiness: 15,
        health: 3
    },
    party: {
        name: 'Party',
        happiness: 20,
        health: -10,
        intelligence: -2
    },
    rest: {
        name: 'Rest',
        health: 20,
        happiness: 5
    },
    medical: {
        name: 'Doctor Visit',
        health: 30,
        bank: -500
    },
    travel: {
        name: 'Travel',
        happiness: 25,
        bank: -2000,
        health: -5
    }
};

// Life Events
const lifeEvents = [
    {
        condition: (p) => p.age === 25,
        event: 'You\'ve just turned 25! Time to plan your future.',
        type: 'neutral'
    },
    {
        condition: (p) => p.happiness < 20 && Math.random() < 0.3,
        event: 'Depression hits you. Visit a doctor!',
        type: 'negative',
        effect: { health: -5 }
    },
    {
        condition: (p) => p.health < 30 && Math.random() < 0.3,
        event: 'You\'ve gotten sick! Rest and recover.',
        type: 'negative',
        effect: { health: -10 }
    },
    {
        condition: (p) => p.age === 30,
        event: 'You\'ve reached 30! Reflection time.',
        type: 'positive'
    },
    {
        condition: (p) => p.health > 80 && p.happiness > 80 && Math.random() < 0.2,
        event: 'Life is great! You feel fortunate.',
        type: 'positive',
        effect: { happiness: 10 }
    },
    {
        condition: (p) => p.bank > 50000 && Math.random() < 0.1,
        event: 'You received an inheritance!',
        type: 'positive',
        effect: { bank: 10000 }
    },
    {
        condition: (p) => p.bank < 0,
        event: 'You\'re in debt! Time to work harder.',
        type: 'negative',
        effect: { health: -5, happiness: -15 }
    }
];

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Game Flow Functions
function startNewGame() {
    showScreen('character-creation');
}

function createCharacter() {
    const name = document.getElementById('char-name').value || 'John Doe';
    const gender = document.getElementById('char-gender').value;
    const appearance = document.getElementById('char-appearance').value;
    
    gameState.player = new Player(name, gender, appearance);
    gameState.isPlaying = true;
    
    showScreen('game-screen');
    updateUI();
}

function chooseCareer(careerKey) {
    const career = careers[careerKey];
    gameState.player.career = careerKey;
    
    // Apply career stats
    if (career.intelligence) gameState.player.intelligence += career.intelligence;
    if (career.happiness) gameState.player.happiness += career.happiness;
    if (career.salary) gameState.player.salary = career.salary;
    
    addEvent(`You became a ${career.name}!`, 'positive');
    updateUI();
    
    // Hide career selection after choosing
    document.getElementById('career-section').style.display = 'none';
}

function performActivity(activityKey) {
    const activity = activities[activityKey];
    const player = gameState.player;
    
    // Apply effects
    if (activity.intelligence) player.intelligence = Math.max(0, Math.min(100, player.intelligence + activity.intelligence));
    if (activity.health) player.health = Math.max(0, Math.min(100, player.health + activity.health));
    if (activity.happiness) player.happiness = Math.max(0, Math.min(100, player.happiness + activity.happiness));
    if (activity.attractiveness) player.attractiveness = Math.max(0, Math.min(100, player.attractiveness + activity.attractiveness));
    
    // Handle salary bonus for work
    if (activityKey === 'work' && player.salary > 0) {
        const dailyBonus = Math.floor(player.salary / 365);
        player.bank += dailyBonus;
    }
    
    // Medical costs
    if (activity.bank) player.bank += activity.bank;
    
    addEvent(`${activity.name}: ${getActivityMessage(activityKey)}`, 'neutral');
    updateUI();
}

function getActivityMessage(activityKey) {
    const messages = {
        school: 'You learned something new today.',
        work: 'You worked hard and earned some money.',
        exercise: 'You feel stronger and healthier.',
        social: 'You had a great time with friends.',
        party: 'What a night! Time to recover.',
        rest: 'You feel refreshed after a good sleep.',
        medical: 'The doctor checked you out.',
        travel: 'You had an amazing journey.'
    };
    return messages[activityKey] || 'You did something.';
}

function nextYear() {
    const player = gameState.player;
    player.year++;
    player.age++;
    gameState.year++;
    
    // Natural stat decay
    player.health = Math.max(0, player.health - 2);
    player.happiness = Math.max(0, player.happiness - 3);
    
    // Income if employed
    if (player.salary > 0) {
        player.bank += player.salary;
    }
    
    // Check life events
    lifeEvents.forEach(event => {
        if (event.condition(player)) {
            addEvent(event.event, event.type);
            if (event.effect) {
                Object.keys(event.effect).forEach(key => {
                    player[key] = Math.max(0, Math.min(100, (player[key] || 0) + event.effect[key]));
                });
            }
        }
    });
    
    // Add random event
    if (Math.random() < 0.3) {
        const randomEvent = generateRandomEvent(player);
        addEvent(randomEvent.message, randomEvent.type);
        if (randomEvent.effect) {
            Object.keys(randomEvent.effect).forEach(key => {
                player[key] = Math.max(0, Math.min(100, (player[key] || 0) + randomEvent.effect[key]));
            });
        }
    }
    
    // Check if game over
    if (player.age >= player.getLifeExpectancy() || player.health <= 0) {
        endGame();
        return;
    }
    
    updateUI();
}

function generateRandomEvent(player) {
    const events = [
        { message: 'You won the lottery!', type: 'positive', effect: { bank: 25000, happiness: 20 } },
        { message: 'A friend surprised you with a visit!', type: 'positive', effect: { happiness: 10 } },
        { message: 'You got a promotion at work!', type: 'positive', effect: { salary: 5000, happiness: 15 } },
        { message: 'Your car broke down. Expensive repair.', type: 'negative', effect: { bank: -3000, happiness: -10 } },
        { message: 'You caught a cold.', type: 'negative', effect: { health: -20 } },
        { message: 'A family member called. Nice chat!', type: 'positive', effect: { happiness: 8 } },
        { message: 'You made a new friend!', type: 'positive', effect: { happiness: 12, intelligence: 2 } },
        { message: 'Your internet went down. Frustrating day.', type: 'negative', effect: { happiness: -5 } }
    ];
    
    return events[Math.floor(Math.random() * events.length)];
}

function addEvent(message, type = 'neutral') {
    const eventLog = document.getElementById('event-log');
    const eventElement = document.createElement('p');
    eventElement.className = `event ${type}`;
    eventElement.textContent = message;
    eventLog.appendChild(eventElement);
    eventLog.scrollTop = eventLog.scrollHeight;
}

function updateUI() {
    const player = gameState.player;
    
    // Update header
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-age').textContent = player.age;
    document.getElementById('player-year').textContent = player.year;
    
    // Update stats
    updateStatBar('health', player.health);
    updateStatBar('happiness', player.happiness);
    updateStatBar('intelligence', player.intelligence);
    updateStatBar('attractiveness', player.attractiveness);
    
    document.getElementById('bank-value').textContent = player.bank.toLocaleString();
    
    // Update career
    const jobInfo = player.career ? careers[player.career].name : 'Unemployed';
    document.getElementById('job-info').textContent = jobInfo;
}

function updateStatBar(statName, value) {
    document.getElementById(`${statName}-bar`).style.width = value + '%';
    document.getElementById(`${statName}-value`).textContent = value;
}

function endGame() {
    gameState.isPlaying = false;
    
    const player = gameState.player;
    document.getElementById('final-name').textContent = player.name;
    document.getElementById('final-age').textContent = player.age;
    document.getElementById('final-wealth').textContent = player.bank.toLocaleString();
    document.getElementById('final-happiness').textContent = player.happiness;
    
    showScreen('game-over');
}

function returnToMenu() {
    gameState.player = null;
    gameState.year = 1;
    showScreen('main-menu');
}

function loadGame() {
    alert('Load Game feature coming soon!');
}
