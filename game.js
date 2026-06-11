// Global data storage
let gameData = {
    careers: {},
    activities: {},
    events: [],
    names: {}
};

// Load all JSON data files
async function loadGameData() {
    try {
        const [careersRes, activitiesRes, eventsRes, namesRes] = await Promise.all([
            fetch('data/careers.json'),
            fetch('data/activities.json'),
            fetch('data/events.json'),
            fetch('data/names.json')
        ]);

        gameData.careers = await careersRes.json();
        gameData.activities = await activitiesRes.json();
        gameData.events = await eventsRes.json();
        gameData.names = await namesRes.json();

        console.log('Game data loaded successfully');
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', loadGameData);

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
        
        // Relationships
        this.relationshipStatus = 'single';
        this.education = 'none';
        
        // Life events
        this.events = ['Welcome to LifeSim! Start your adventure.'];
        this.lifeSpan = 80 + Math.floor(Math.random() * 10);
    }
    
    getLifeExpectancy() {
        return this.lifeSpan;
    }
}

// Generate random name
function generateRandomName(gender) {
    if (!gameData.names.names) return 'John Doe';
    
    const nameList = gameData.names.names[gender];
    const lastNameList = gameData.names.lastNames;
    
    const firstName = nameList[Math.floor(Math.random() * nameList.length)];
    const lastName = lastNameList[Math.floor(Math.random() * lastNameList.length)];
    
    return `${firstName} ${lastName}`;
}

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
    document.getElementById('char-name').value = generateRandomName('male');
}

function createCharacter() {
    const name = document.getElementById('char-name').value || 'John Doe';
    const gender = document.getElementById('char-gender').value;
    const appearance = document.getElementById('char-appearance').value;
    
    gameState.player = new Player(name, gender, appearance);
    gameState.isPlaying = true;
    
    showScreen('game-screen');
    updateCareerButtons();
    updateActivityButtons();
    updateUI();
}

function updateCareerButtons() {
    const careerSection = document.getElementById('career-section');
    careerSection.innerHTML = '<p>Choose a career path:</p>';
    
    Object.entries(gameData.careers.careers || {}).forEach(([key, career]) => {
        const button = document.createElement('button');
        button.className = 'career-btn';
        button.onclick = () => chooseCareer(key);
        button.innerHTML = `
            <div style="font-weight: bold;">${career.name}</div>
            <div style="font-size: 0.8rem; color: #10b981;">$${career.salary.toLocaleString()}</div>
        `;
        careerSection.appendChild(button);
    });
}

function updateActivityButtons() {
    const activityGrid = document.querySelector('.activity-grid');
    activityGrid.innerHTML = '';
    
    Object.entries(gameData.activities.activities || {}).forEach(([key, activity]) => {
        const button = document.createElement('button');
        button.className = 'activity-btn';
        button.onclick = () => performActivity(key);
        button.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-name">${activity.name}</div>
        `;
        activityGrid.appendChild(button);
    });
}

function chooseCareer(careerKey) {
    const career = gameData.careers.careers[careerKey];
    if (!career) return;
    
    gameState.player.career = careerKey;
    
    // Apply career stats
    if (career.intelligence) gameState.player.intelligence = Math.min(100, gameState.player.intelligence + career.intelligence);
    if (career.happiness) gameState.player.happiness = Math.max(0, Math.min(100, gameState.player.happiness + career.happiness));
    if (career.attractiveness) gameState.player.attractiveness = Math.min(100, gameState.player.attractiveness + career.attractiveness);
    if (career.health) gameState.player.health = Math.max(0, Math.min(100, gameState.player.health + career.health));
    
    gameState.player.salary = career.salary;
    
    addEvent(`You became a ${career.name}!`, 'positive');
    updateUI();
    
    // Hide career selection after choosing
    document.getElementById('career-section').style.display = 'none';
}

function performActivity(activityKey) {
    const activity = gameData.activities.activities[activityKey];
    if (!activity) return;
    
    const player = gameState.player;
    
    // Check if player can afford the activity
    if (activity.cost && player.bank < activity.cost) {
        addEvent(`You can't afford to ${activity.name.toLowerCase()}. Need $${activity.cost}`, 'negative');
        return;
    }
    
    // Apply effects
    if (activity.intelligence) player.intelligence = Math.max(0, Math.min(100, player.intelligence + activity.intelligence));
    if (activity.health) player.health = Math.max(0, Math.min(100, player.health + activity.health));
    if (activity.happiness) player.happiness = Math.max(0, Math.min(100, player.happiness + activity.happiness));
    if (activity.attractiveness) player.attractiveness = Math.max(0, Math.min(100, player.attractiveness + activity.attractiveness));
    
    // Handle costs
    if (activity.cost) player.bank -= activity.cost;
    
    // Handle work bonus
    if (activityKey === 'work' && player.salary > 0) {
        const dailyBonus = Math.floor(player.salary / 365);
        player.bank += dailyBonus;
    }
    
    addEvent(`${activity.name}: ${activity.description}`, 'neutral');
    updateUI();
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
    
    // Check structured life events
    const eventArray = gameData.events.events || [];
    eventArray.forEach(event => {
        if (evaluateEventCondition(event.condition, player)) {
            addEvent(event.message, event.type);
            if (event.effects) {
                applyEffects(player, event.effects);
            }
        }
    });
    
    // Add random life event
    if (Math.random() < 0.3) {
        const randomEvent = generateRandomEvent(player);
        addEvent(randomEvent.message, randomEvent.type);
        if (randomEvent.effects) {
            applyEffects(player, randomEvent.effects);
        }
    }
    
    // Check if game over
    if (player.age >= player.getLifeExpectancy() || player.health <= 0) {
        endGame();
        return;
    }
    
    updateUI();
}

function evaluateEventCondition(condition, player) {
    // Simple condition parser for events
    if (condition.includes('age ===')) {
        const age = parseInt(condition.match(/\d+/)[0]);
        return player.age === age;
    }
    if (condition.includes('health <')) {
        const health = parseInt(condition.match(/\d+/)[0]);
        return player.health < health;
    }
    if (condition.includes('happiness <')) {
        const happiness = parseInt(condition.match(/\d+/)[0]);
        return player.happiness < happiness;
    }
    if (condition.includes('salary > 0')) {
        return player.salary > 0;
    }
    if (condition.includes('bank <')) {
        const bank = parseInt(condition.match(/\d+/)[0]);
        return player.bank < bank;
    }
    if (condition.includes('random')) {
        const chance = parseFloat(condition.match(/[\d.]+/)[0]);
        return Math.random() < chance;
    }
    return false;
}

function applyEffects(player, effects) {
    if (effects.health) player.health = Math.max(0, Math.min(100, player.health + effects.health));
    if (effects.happiness) player.happiness = Math.max(0, Math.min(100, player.happiness + effects.happiness));
    if (effects.intelligence) player.intelligence = Math.max(0, Math.min(100, player.intelligence + effects.intelligence));
    if (effects.attractiveness) player.attractiveness = Math.max(0, Math.min(100, player.attractiveness + effects.attractiveness));
    if (effects.bank) player.bank = Math.max(0, player.bank + effects.bank);
    if (effects.salary) player.salary += effects.salary;
}

function generateRandomEvent(player) {
    const randomEvents = [
        { message: '🎰 You won the lottery!', type: 'positive', effects: { bank: 25000, happiness: 20 } },
        { message: '👋 A friend surprised you with a visit!', type: 'positive', effects: { happiness: 10 } },
        { message: '🎉 You got a promotion at work!', type: 'positive', effects: { salary: 5000, happiness: 15 } },
        { message: '🚗 Your car broke down. Expensive repair.', type: 'negative', effects: { bank: -3000, happiness: -10 } },
        { message: '🤒 You caught a cold.', type: 'negative', effects: { health: -20 } },
        { message: '☎️ A family member called. Nice chat!', type: 'positive', effects: { happiness: 8 } },
        { message: '🤝 You made a new friend!', type: 'positive', effects: { happiness: 12, intelligence: 2 } },
        { message: '😠 You had a terrible argument with someone.', type: 'negative', effects: { happiness: -15 } },
        { message: '🏆 You won an award!', type: 'positive', effects: { happiness: 15, salary: 3000 } },
        { message: '💵 You found money on the street!', type: 'positive', effects: { bank: 500 } }
    ];
    
    return randomEvents[Math.floor(Math.random() * randomEvents.length)];
}

function addEvent(message, type = 'neutral') {
    const eventLog = document.getElementById('event-log');
    const eventElement = document.createElement('p');
    eventElement.className = `event ${type}`;
    eventElement.textContent = message;
    eventLog.appendChild(eventElement);
    eventLog.scrollTop = eventLog.scrollHeight;
    gameState.player.events.push(message);
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
    
    document.getElementById('bank-value').textContent = '$' + player.bank.toLocaleString();
    
    // Update career
    if (player.career && gameData.careers.careers) {
        const jobInfo = gameData.careers.careers[player.career].name;
        document.getElementById('job-info').textContent = jobInfo;
    } else {
        document.getElementById('job-info').textContent = 'Unemployed';
    }
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
    document.getElementById('final-wealth').textContent = '$' + player.bank.toLocaleString();
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
