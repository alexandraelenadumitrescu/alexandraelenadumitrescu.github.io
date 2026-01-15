var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');
var canvasWidth = 800; 
var canvasHeight = 600; 

canvas.width = canvasWidth;
canvas.height = canvasHeight;

var gameRunning = false;
var score = 0;
var lives = 3;
var pointsForExtraLife = 100;
var lastExtraLifeScore = 0;

var ship = {
    x: 0,
    y: 0,
    angle: -Math.PI / 2,
    speed: 5,
    rotationSpeed: 0.1,
    size: 15,
    velocityX: 0,
    velocityY: 0,
    acceleration: 0.3,
    friction: 0.98
};

var asteroids = [];
var numberOfAsteroids = 5;
var missiles = [];

var keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    z: false,
    c: false,
    x: false
};

document.addEventListener('keydown', function(event) {
    var playerNameInput = document.getElementById('player-name');
    if (document.activeElement === playerNameInput) {
        return;
    }
    
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
        event.preventDefault();
    }
    
    if (event.key === ' ' && !gameRunning) {
        startGame();
        event.preventDefault();
    }
});

let divStartScreen = document.getElementById('start-screen');

divStartScreen.addEventListener('click', function(event) {
    if (!gameRunning) {
        startGame();
    }
});

document.addEventListener('keyup', function(event) {
    var playerNameInput = document.getElementById('player-name');
    if (document.activeElement === playerNameInput) {
        return;
    }
    
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
        event.preventDefault();
    }
});

function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(ship.size / 2, ship.size / 2);
    ctx.closePath();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.fill();
    ctx.restore();
}

function drawAsteroid(asteroid) {
    ctx.beginPath();
    ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
    ctx.strokeStyle = asteroid.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = asteroid.color + '33';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = asteroid.size / 2 + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(asteroid.hp, asteroid.x, asteroid.y);
}

function drawAsteroids() {
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid = asteroids[i];
        drawAsteroid(asteroid);
    }
}

function clearCanvas() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function getAsteroidColor(hp) {
    if (hp === 1) {
        return '#ffff00';
    } else if (hp === 2) {
        return '#ff9900';
    } else if (hp === 3) {
        return '#ff3300';
    } else if (hp === 4) {
        return '#ff00ff';
    }
}

function getAsteroidSize(hp) {
    var baseSize = 15;
    var sizeIncrement = 10;
    return baseSize + (hp * sizeIncrement);
}

function createAsteroid() {
    var asteroid = {};
    asteroid.hp = Math.floor(Math.random() * 4) + 1;
    asteroid.size = getAsteroidSize(asteroid.hp);
    asteroid.color = getAsteroidColor(asteroid.hp);
    var margin = 50;
    asteroid.x = margin + Math.random() * (canvasWidth - 2 * margin);
    asteroid.y = margin + Math.random() * (canvasHeight - 2 * margin);
    asteroid.velocityX = (Math.random() - 0.5) * 4;
    asteroid.velocityY = (Math.random() - 0.5) * 4;
    
    if (Math.abs(asteroid.velocityX) < 0.5 && Math.abs(asteroid.velocityY) < 0.5) {
        asteroid.velocityX = 1.5;
        asteroid.velocityY = 1.5;
    }
    
    return asteroid;
}

function createInitialAsteroids() {
    asteroids = [];
    
    for (var i = 0; i < numberOfAsteroids; i++) {
        var newAsteroid = createAsteroid();
        var distanceX = newAsteroid.x - ship.x;
        var distanceY = newAsteroid.y - ship.y;
        var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        var safeDistance = 100;
        
        if (distance < safeDistance) {
            newAsteroid.x = canvasWidth / 4;
            newAsteroid.y = canvasHeight / 4;
        }
        
        asteroids.push(newAsteroid);
    }
    
    console.log('Au fost creati', asteroids.length, 'asteroizi');
}

function updateShip() {
    if (keys.z || touchControls.rotateLeft) {
        ship.angle = ship.angle - ship.rotationSpeed;
    }
    
    if (keys.c || touchControls.rotateRight) {
        ship.angle = ship.angle + ship.rotationSpeed;
    }
    
    if (keys.ArrowLeft || touchControls.moveLeft) {
        ship.velocityX -= ship.acceleration;
    }
    
    if (keys.ArrowRight || touchControls.moveRight) {
        ship.velocityX += ship.acceleration;
    }
    
    if (keys.ArrowUp || touchControls.moveUp) {
        ship.velocityY -= ship.acceleration;
    }
    
    if (keys.ArrowDown || touchControls.moveDown) {
        ship.velocityY += ship.acceleration;
    }
    
    ship.velocityX *= ship.friction;
    ship.velocityY *= ship.friction;
    
    if (Math.abs(ship.velocityX) < 0.01) {
        ship.velocityX = 0;
    }
    if (Math.abs(ship.velocityY) < 0.01) {
        ship.velocityY = 0;
    }
    
    var maxSpeed = ship.speed;
    if (Math.abs(ship.velocityX) > maxSpeed) {
        ship.velocityX = ship.velocityX > 0 ? maxSpeed : -maxSpeed;
    }
    if (Math.abs(ship.velocityY) > maxSpeed) {
        ship.velocityY = ship.velocityY > 0 ? maxSpeed : -maxSpeed;
    }
    
    ship.x = ship.x + ship.velocityX;
    ship.y = ship.y + ship.velocityY;
    
    if (ship.x > canvasWidth) {
        ship.x = 0;
    }
    if (ship.x < 0) {
        ship.x = canvasWidth;
    }
    if (ship.y > canvasHeight) {
        ship.y = 0;
    }
    if (ship.y < 0) {
        ship.y = canvasHeight;
    }
}

function updateAsteroids() {
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid = asteroids[i];
        asteroid.x = asteroid.x + asteroid.velocityX;
        asteroid.y = asteroid.y + asteroid.velocityY;
        
        if (asteroid.x > canvasWidth + asteroid.size) {
            asteroid.x = -asteroid.size;
        }
        
        if (asteroid.x < -asteroid.size) {
            asteroid.x = canvasWidth + asteroid.size;
        }
        
        if (asteroid.y > canvasHeight + asteroid.size) {
            asteroid.y = -asteroid.size;
        }
        
        if (asteroid.y < -asteroid.size) {
            asteroid.y = canvasHeight + asteroid.size;
        }
    }
}

function updateScoreDisplay() {
    var scoreElement = document.getElementById('score');
    scoreElement.textContent = score;
}

function updateLivesDisplay() {
    var livesElement = document.getElementById('lives');
    livesElement.textContent = lives;
}

function gameLoop() {
    if (!gameRunning) {
        return;
    }
    
    clearCanvas();
    updateShip();
    handleShooting();
    updateMissiles();
    updateAsteroids();
    checkMissileAsteroidCollisions();
    checkAsteroidAsteroidCollisions();
    checkShipAsteroidCollisions();
    drawAsteroids();
    drawMissiles();
    drawShip();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    console.log('Jocul a fost pornit!');
    gameRunning = true;
    var startScreen = document.getElementById('start-screen');
    startScreen.style.display = 'none';
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    ship.angle = -Math.PI / 2;
    createInitialAsteroids();
    gameLoop();
}

function initGame() {
    console.log('Jocul a fost initializat!');
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    updateScoreDisplay();
    updateLivesDisplay();
    updateHighScoreDisplay();
    displayHighScores();
    
    if (isMobileDevice()) {
        console.log('✅ Este mobil - cream butoane touch');
        createTouchButtons();
    } else {
        console.log('✅ Este desktop - NU cream butoane touch');
    }
    
    adaptInterfaceForDevice();
    ctx.fillStyle = '#00ff00';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Apasa SPACE pentru a incepe', canvasWidth / 2, canvasHeight / 2);
    console.log('Canvas width:', canvasWidth);
    console.log('Canvas height:', canvasHeight);
    console.log('Ship pozitie initiala:', ship.x, ship.y);
}

window.addEventListener('load', function() {
    console.log('Pagina s-a incarcat complet');
    initGame();
});

var missileSpeed = 7;
var missileSize = 3;
var maxMissiles = 3;
var canShoot = true;

function createMissile() {
    if (missiles.length >= maxMissiles) {
        console.log('Nu poti lansa mai mult de', maxMissiles, 'rachete simultan');
        return;
    }
    
    var missile = {};
    var tipDistance = ship.size;
    const OFFSET = Math.PI / 2;
    
    missile.x = ship.x + Math.cos(ship.angle - OFFSET) * tipDistance;
    missile.y = ship.y + Math.sin(ship.angle - OFFSET) * tipDistance;
    missile.velocityX = Math.cos(ship.angle - OFFSET) * missileSpeed;
    missile.velocityY = Math.sin(ship.angle - OFFSET) * missileSpeed;
    missile.size = missileSize;
    missiles.push(missile);
    console.log('Racheta lansata! Total rachete active:', missiles.length);
}

function drawMissile(missile) {
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, missile.size, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawMissiles() {
    for (var i = 0; i < missiles.length; i++) {
        var missile = missiles[i];
        drawMissile(missile);
    }
}

function updateMissiles() {
    for (var i = missiles.length - 1; i >= 0; i--) {
        var missile = missiles[i];
        missile.x = missile.x + missile.velocityX;
        missile.y = missile.y + missile.velocityY;
        var outOfBounds = false;
        
        if (missile.x < 0 || missile.x > canvasWidth) {
            outOfBounds = true;
        }
        
        if (missile.y < 0 || missile.y > canvasHeight) {
            outOfBounds = true;
        }
        
        if (outOfBounds) {
            missiles.splice(i, 1);
            console.log('Racheta a iesit din ecran. Rachete ramase:', missiles.length);
        }
    }
}

function handleShooting() {
    if (keys.x || touchControls.shoot) {
        if (canShoot) {
            createMissile();
            canShoot = false;
        }
    } else {
        canShoot = true;
    }
}

function getDistance(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var distance = Math.sqrt(dx * dx + dy * dy);
    return distance;
}

function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    var distance = getDistance(x1, y1, x2, y2);
    
    if (distance < r1 + r2) {
        return true;
    }
    
    return false;
}

function checkMissileAsteroidCollisions() {
    for (var i = missiles.length - 1; i >= 0; i--) {
        var missile = missiles[i];
        
        for (var j = asteroids.length - 1; j >= 0; j--) {
            var asteroid = asteroids[j];
            var collision = checkCircleCollision(
                missile.x, missile.y, missile.size,
                asteroid.x, asteroid.y, asteroid.size
            );
            
            if (collision) {
                console.log('Racheta a lovit un asteroid!');
                asteroid.hp = asteroid.hp - 1;
                
                if (asteroid.hp <= 0) {
                    console.log('Asteroid distrus!');
                    score = score + 10;
                    updateScoreDisplay();
                    checkExtraLife();
                    asteroids.splice(j, 1);
                    
                    if (asteroids.length === 0) {
                        console.log('Toti asteroizii au fost distrusi! Se creeaza altii noi...');
                        createInitialAsteroids();
                    }
                } else {
                    asteroid.color = getAsteroidColor(asteroid.hp);
                    asteroid.size = getAsteroidSize(asteroid.hp);
                    console.log('Asteroidului ii mai raman', asteroid.hp, 'HP');
                }
                
                missiles.splice(i, 1);
                break;
            }
        }
    }
}

function checkAsteroidAsteroidCollisions() {
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid1 = asteroids[i];
        
        for (var j = i + 1; j < asteroids.length; j++) {
            var asteroid2 = asteroids[j];
            var collision = checkCircleCollision(
                asteroid1.x, asteroid1.y, asteroid1.size,
                asteroid2.x, asteroid2.y, asteroid2.size
            );
            
            if (collision) {
                console.log('Doi asteroizi s-au ciocnit!');
                var tempVx = asteroid1.velocityX;
                var tempVy = asteroid1.velocityY;
                asteroid1.velocityX = asteroid2.velocityX;
                asteroid1.velocityY = asteroid2.velocityY;
                asteroid2.velocityX = tempVx;
                asteroid2.velocityY = tempVy;
                asteroid1.velocityX = asteroid1.velocityX * 0.9;
                asteroid1.velocityY = asteroid1.velocityY * 0.9;
                asteroid2.velocityX = asteroid2.velocityX * 0.9;
                asteroid2.velocityY = asteroid2.velocityY * 0.9;
                var dx = asteroid2.x - asteroid1.x;
                var dy = asteroid2.y - asteroid1.y;
                var distance = getDistance(asteroid1.x, asteroid1.y, asteroid2.x, asteroid2.y);
                
                if (distance > 0) {
                    dx = dx / distance;
                    dy = dy / distance;
                }
                
                var pushDistance = (asteroid1.size + asteroid2.size - distance) / 2;
                asteroid1.x = asteroid1.x - dx * pushDistance;
                asteroid1.y = asteroid1.y - dy * pushDistance;
                asteroid2.x = asteroid2.x + dx * pushDistance;
                asteroid2.y = asteroid2.y + dy * pushDistance;
            }
        }
    }
}

function checkShipAsteroidCollisions() {
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid = asteroids[i];
        var collision = checkCircleCollision(
            ship.x, ship.y, ship.size,
            asteroid.x, asteroid.y, asteroid.size
        );
        
        if (collision) {
            console.log('Nava a fost lovita de un asteroid!');
            lives = lives - 1;
            updateLivesDisplay();
            console.log('Vieti ramase:', lives);
            
            if (lives <= 0) {
                gameOver();
            } else {
                resetShip();
            }
            
            return;
        }
    }
}

function checkExtraLife() {
    var extraLivesEarned = Math.floor(score / pointsForExtraLife);
    var extraLivesEarnedLastTime = Math.floor(lastExtraLifeScore / pointsForExtraLife);
    
    if (extraLivesEarned > extraLivesEarnedLastTime) {
        console.log('Ai castigat o viata suplimentara!');
        lives = lives + 1;
        updateLivesDisplay();
        lastExtraLifeScore = score;
        console.log('Vieti totale:', lives);
    }
}

function resetShip() {
    console.log('Resetare nava...');
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    ship.angle = -Math.PI / 2;
    ship.velocityX = 0;
    ship.velocityY = 0;
    missiles = [];
    createInitialAsteroids();
    gameRunning = false;
    
    setTimeout(function() {
        gameRunning = true;
        gameLoop();
    }, 1000);
}

function gameOver() {
    console.log('GAME OVER! Scor final:', score);
    gameRunning = false;
    var gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'block';
    var finalScoreElement = document.getElementById('final-score');
    finalScoreElement.textContent = score;
}

function restartGame() {
    console.log('Restart joc...');
    var gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'none';
    score = 0;
    lives = 3;
    lastExtraLifeScore = 0;
    updateScoreDisplay();
    updateLivesDisplay();
    asteroids = [];
    missiles = [];
    startGame();
}

document.getElementById('restart-btn').addEventListener('click', function() {
    restartGame();
});

function loadHighScores() {
    var savedScores = localStorage.getItem('asteroidsHighScores');
    
    if (savedScores) {
        var scoresArray = JSON.parse(savedScores);
        console.log('Scoruri incarcate din LocalStorage:', scoresArray);
        return scoresArray;
    } else {
        console.log('Nu exista scoruri salvate');
        return [];
    }
}

function saveHighScores(scoresArray) {
    var scoresJSON = JSON.stringify(scoresArray);
    localStorage.setItem('asteroidsHighScores', scoresJSON);
    console.log('Scoruri salvate in LocalStorage:', scoresArray);
}

function addHighScore(playerName, playerScore) {
    if (!playerName || playerName.trim() === '') {
        alert('Te rog introdu un nume!');
        return false;
    }
    
    var highScores = loadHighScores();
    var newScore = {
        name: playerName.trim(),
        score: playerScore
    };
    
    highScores.push(newScore);
    highScores.sort(function(a, b) {
        return b.score - a.score;
    });
    
    highScores = highScores.slice(0, 5);
    saveHighScores(highScores);
    displayHighScores();
    console.log('Scor adaugat:', newScore);
    return true;
}

function displayHighScores() {
    var highScores = loadHighScores();
    var scoresList = document.getElementById('scores-list');
    scoresList.innerHTML = '';
    
    if (highScores.length === 0) {
        var emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Niciun scor înregistrat încă';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.fontStyle = 'italic';
        scoresList.appendChild(emptyMessage);
        return;
    }
    
    for (var i = 0; i < highScores.length; i++) {
        var scoreData = highScores[i];
        var listItem = document.createElement('li');
        listItem.textContent = scoreData.name + ' - ' + scoreData.score + ' puncte';
        scoresList.appendChild(listItem);
    }
}

function updateHighScoreDisplay() {
    var highScores = loadHighScores();
    var highScoreElement = document.getElementById('high-score');
    
    if (highScores.length > 0) {
        highScoreElement.textContent = highScores[0].score;
    } else {
        highScoreElement.textContent = '0';
    }
}

document.getElementById('save-score-btn').addEventListener('click', function() {
    var playerNameInput = document.getElementById('player-name');
    var playerName = playerNameInput.value;
    if(addHighScore(playerName, score)) {
        playerNameInput.value = '';
        alert('Scor salvat cu succes!');
    }
});

var touchControls = {
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false,
    rotateLeft: false,
    rotateRight: false,
    shoot: false
};

function createTouchButtons() {
    var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var isSmallScreen = window.innerWidth <= 768;
    
    if (!isMobile && !isSmallScreen) {
        console.log('Dispozitiv desktop detectat - nu cream butoane touch');
        return;
    }
    
    if (!isTouchDevice) {
        console.log('Dispozitiv fara touchscreen - nu cream butoane');
        return;
    }
    
    console.log('Dispozitiv mobil detectat - cream butoane virtuale');
    
    var touchButtonsContainer = document.createElement('div');
    touchButtonsContainer.id = 'touch-controls';
    touchButtonsContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0 20px;
        z-index: 100;
    `;
    
    var moveButtons = document.createElement('div');
    moveButtons.style.cssText = `
        display: grid;
        grid-template-columns: repeat(3, 60px);
        grid-template-rows: repeat(3, 60px);
        gap: 5px;
    `;
    
    function createButton(text, gridArea) {
        var button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background-color: rgba(0, 255, 0, 0.3);
            border: 2px solid #00ff00;
            color: #00ff00;
            font-size: 20px;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
            grid-area: ${gridArea};
        `;
        return button;
    }
    
    var upBtn = createButton('↑', '1 / 2 / 2 / 3');
    var leftBtn = createButton('←', '2 / 1 / 3 / 2');
    var rightBtn = createButton('→', '2 / 3 / 3 / 4');
    var downBtn = createButton('↓', '3 / 2 / 4 / 3');
    
    moveButtons.appendChild(upBtn);
    moveButtons.appendChild(leftBtn);
    moveButtons.appendChild(rightBtn);
    moveButtons.appendChild(downBtn);
    
    var actionButtons = document.createElement('div');
    actionButtons.style.cssText = `
        display: flex;
        gap: 10px;
        flex-direction: column;
    `;
    
    var rotateLeftBtn = createButton('Z', '');
    rotateLeftBtn.style.width = '60px';
    rotateLeftBtn.style.height = '60px';
    
    var rotateRightBtn = createButton('C', '');
    rotateRightBtn.style.width = '60px';
    rotateRightBtn.style.height = '60px';
    
    var shootBtn = createButton('X', '');
    shootBtn.style.width = '60px';
    shootBtn.style.height = '60px';
    shootBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    shootBtn.style.borderColor = '#ff0000';
    shootBtn.style.color = '#ff0000';
    
    actionButtons.appendChild(rotateLeftBtn);
    actionButtons.appendChild(rotateRightBtn);
    actionButtons.appendChild(shootBtn);
    
    touchButtonsContainer.appendChild(moveButtons);
    touchButtonsContainer.appendChild(actionButtons);
    document.body.appendChild(touchButtonsContainer);
    
    upBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveUp = true;
    });
    upBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveUp = false;
    });
    
    downBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveDown = true;
    });
    downBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveDown = false;
    });
    
    leftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveLeft = true;
    });
    leftBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveLeft = false;
    });
    
    rightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveRight = true;
    });
    rightBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveRight = false;
    });
    
    rotateLeftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.rotateLeft = true;
    });
    rotateLeftBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.rotateLeft = false;
    });
    
    rotateRightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.rotateRight = true;
    });
    rotateRightBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.rotateRight = false;
    });
    
    shootBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.shoot = true;
    });
    shootBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.shoot = false;
    });
    
    console.log('Butoane touch create cu succes!');
}

function isMobileDevice() {
    var checkUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var hasSmallScreen = window.innerWidth <= 768;
    
    console.log('Detectie dispozitiv:');
    console.log('  - User Agent mobil:', checkUserAgent);
    console.log('  - Are touchscreen:', hasTouchScreen);
    console.log('  - Ecran mic:', hasSmallScreen);
    console.log('  - Latime ecran:', window.innerWidth + 'px');
    
    var isMobile = checkUserAgent || (hasTouchScreen && hasSmallScreen);
    console.log('  - REZULTAT: Este mobil?', isMobile);
    
    return isMobile;
}

function adaptInterfaceForDevice() {
    var controlsDiv = document.getElementById('game-controls');
    
    if (isMobileDevice()) {
        console.log('Dispozitiv mobil detectat - afisam controale touch');
        
        controlsDiv.innerHTML = `
            <h3>Controale Touch:</h3>
            <p>Folosește butoanele virtuale de jos pentru a juca</p>
            <p>Săgeți: Mișcare | Z: Rotire stânga | C: Rotire dreapta | X: Tragere</p>
        `;
    } else {
        console.log('Dispozitiv desktop detectat - afisam instructiuni tastatura');
        
        controlsDiv.innerHTML = `
            <h3>Controale:</h3>
            <p>Săgeți: Miscare navei (Sus/Jos/Stanga/Dreapta)</p>
            <p>Z: Rotire stanga | C: Rotire dreapta | X: Lansare racheta</p>
        `;
    }
}