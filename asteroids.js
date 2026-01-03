// ============================================
// SECTIUNEA 1: INITIALIZARE CANVAS SI VARIABILE GLOBALE
// ============================================

// Obtinem elementul canvas din HTML
// Canvas este "panza" pe care vom desena jocul
var canvas = document.getElementById('game-canvas');

// Contextul 2D ne permite sa desenam forme, linii, text pe canvas
// "2d" inseamna ca desenam in 2 dimensiuni (nu 3D)
var ctx = canvas.getContext('2d');

// Setam dimensiunile canvas-ului
// Acestea determina cat de mare este zona de joc
var canvasWidth = 800;  // Latimea in pixeli
var canvasHeight = 600; // Inaltimea in pixeli

// Aplicam dimensiunile la canvas
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// ============================================
// SECTIUNEA 2: VARIABILE DE STARE A JOCULUI
// ============================================

// Variabila care indica daca jocul este activ
// true = jocul ruleaza, false = jocul este oprit
var gameRunning = false;

// Scorul curent al jucatorului
var score = 0;

// Numarul de vieti ramase
// Jucatorul incepe cu 3 vieti
var lives = 3;

// Punctele necesare pentru a castiga o viata suplimentara
var pointsForExtraLife = 100;

// Punctele la care jucatorul a primit ultima viata suplimentara
// Folosim aceasta variabila pentru a verifica cand sa dam viata noua
var lastExtraLifeScore = 0;

// ============================================
// SECTIUNEA 3: OBIECTE PENTRU ENTITATI
// ============================================

// Obiectul care reprezinta nava spatiala
var ship = {
    x: 0,               // Pozitia pe axa X (orizontal)
    y: 0,               // Pozitia pe axa Y (vertical)
    angle: -Math.PI / 2, // Unghiul de rotatie (porneste in sus: -90 grade = -PI/2 radiani)
    speed: 5,           // Viteza de deplasare (pixeli per frame)
    rotationSpeed: 0.1, // Viteza de rotatie (radiani per frame)
    size: 15,           // Dimensiunea navei (raza)
    velocityX: 0,       // Viteza curenta pe axa X
    velocityY: 0        // Viteza curenta pe axa Y
};

// Array (lista) care va contine toti asteroizii
// Initial este gol, vom adauga asteroizi in Stage 3
var asteroids = [];

// Numarul de asteroizi care vor fi creati la inceputul jocului
var numberOfAsteroids = 5;

// Array (lista) care va contine toate rachetele lansate
// Initial este gol, vom adauga rachete in Stage 4
var missiles = [];

// ============================================
// SECTIUNEA 4: TRACKING PENTRU TASTELE APASATE
// ============================================

// Obiect care tine evidenta tastelor apasate
// Folosim true/false pentru fiecare tasta
// Acest sistem permite apasarea simultana a mai multor taste
var keys = {
    ArrowUp: false,    // Sageata sus
    ArrowDown: false,  // Sageata jos
    ArrowLeft: false,  // Sageata stanga
    ArrowRight: false, // Sageata dreapta
    z: false,          // Tasta Z (rotire stanga)
    c: false,          // Tasta C (rotire dreapta)
    x: false           // Tasta X (lansare racheta)
};

// ============================================
// SECTIUNEA 5: EVENT LISTENERS PENTRU TASTATURA
// ============================================

// Functie care se apeleaza cand o tasta este apasata
// Functie care se apeleaza cand o tasta este apasata
document.addEventListener('keydown', function(event) {
    // Verificam daca utilizatorul scrie in input (pentru nume)
    // Daca da, nu procesam tastele de joc
    var playerNameInput = document.getElementById('player-name');
    if (document.activeElement === playerNameInput) {
        // Utilizatorul scrie in input, nu procesam tastele de joc
        return;
    }
    
    // event.key contine numele tastei apasate
    
    // Verificam daca tasta apasata este in obiectul nostru keys
    if (keys.hasOwnProperty(event.key)) {
        // Setam valoarea pe true pentru a marca ca tasta este apasata
        keys[event.key] = true;
        
        // Prevenim comportamentul default al browser-ului
        // (de exemplu, sagetile misca pagina in sus/jos)
        event.preventDefault();
    }
    
    // Daca se apasa SPACE si jocul nu ruleaza, pornim jocul
    if (event.key === ' ' && !gameRunning) {
        startGame();
        event.preventDefault();
    }
});

// Functie care se apeleaza cand o tasta este eliberata
// Functie care se apeleaza cand o tasta este eliberata
document.addEventListener('keyup', function(event) {
    // Verificam daca utilizatorul scrie in input (pentru nume)
    var playerNameInput = document.getElementById('player-name');
    if (document.activeElement === playerNameInput) {
        // Utilizatorul scrie in input, nu procesam tastele de joc
        return;
    }
    
    // Verificam daca tasta eliberata este in obiectul nostru keys
    if (keys.hasOwnProperty(event.key)) {
        // Setam valoarea pe false pentru a marca ca tasta nu mai este apasata
        keys[event.key] = false;
        event.preventDefault();
    }
});

// ============================================
// SECTIUNEA 6: FUNCTII PENTRU DESENARE
// ============================================

// Functie care deseneaza nava spatiala ca un triunghi
function drawShip() {
    // Salvam starea curenta a context-ului
    // Acest lucru ne permite sa facem transformari (rotatie) fara a afecta restul desenului
    ctx.save();
    
    // Mutam originea sistemului de coordonate la pozitia navei
    // Astfel, desenam nava relativ la propria pozitie
    ctx.translate(ship.x, ship.y);
    
    // Rotim context-ul cu unghiul navei
    // Astfel, nava se va desena orientata in directia corecta
    ctx.rotate(ship.angle);
    
    // Incepem sa desenam o forma noua
    ctx.beginPath();
    
    // Desenam triunghiul navei
    // Punctele sunt relative la centrul navei (0, 0) datorita translate
    
    // Punctul 1: Varful navei (in fata)
    ctx.moveTo(0, -ship.size);
    
    // Punctul 2: Coltul din stanga-spate
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    
    // Punctul 3: Coltul din dreapta-spate
    ctx.lineTo(ship.size / 2, ship.size / 2);
    
    // Inchidem triunghiul conectand ultimul punct cu primul
    ctx.closePath();
    
    // Setam culoarea de contur (linie) a navei
    ctx.strokeStyle = '#00ff00'; // Verde neon
    
    // Setam grosimea liniei
    ctx.lineWidth = 2;
    
    // Desenam conturul triunghiului
    ctx.stroke();
    
    // Optional: umplem interiorul navei cu o culoare semi-transparenta
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; // Verde transparent
    ctx.fill();
    
    // Restauram starea context-ului la cea dinainte de translate si rotate
    // Acest lucru este important pentru a nu afecta alte desenari
    ctx.restore();
}

// Functie care deseneaza un asteroid
// Parametru: asteroid - obiectul care contine proprietatile asteroidului
function drawAsteroid(asteroid) {
    // Incepem sa desenam un cerc
    ctx.beginPath();
    
    // Desenam cercul asteroidului
    // arc(x, y, raza, unghi_start, unghi_end)
    // 0 si 2*PI inseamna ca desenam un cerc complet
    ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
    
    // Setam culoarea asteroidului bazat pe HP
    ctx.strokeStyle = asteroid.color;
    
    // Setam grosimea liniei
    ctx.lineWidth = 2;
    
    // Desenam conturul cercului
    ctx.stroke();
    
    // Umplem interiorul asteroidului cu o culoare semi-transparenta
    ctx.fillStyle = asteroid.color + '33'; // Adaugam transparenta (33 in hex = 20% opacitate)
    ctx.fill();
    
    // Desenam numarul de HP in centrul asteroidului
    ctx.fillStyle = '#ffffff'; // Text alb
    ctx.font = asteroid.size / 2 + 'px Arial'; // Marimea fontului depinde de marimea asteroidului
    ctx.textAlign = 'center'; // Aliniere la centru
    ctx.textBaseline = 'middle'; // Baseline la mijloc pentru centrare verticala
    ctx.fillText(asteroid.hp, asteroid.x, asteroid.y);
}

// Functie care deseneaza toti asteroizii
function drawAsteroids() {
    // Parcurgem fiecare asteroid din array
    // Folosim un for clasic pentru claritate
    for (var i = 0; i < asteroids.length; i++) {
        // Luam asteroidul curent
        var asteroid = asteroids[i];
        
        // Desenam asteroidul
        drawAsteroid(asteroid);
    }
}

// Functie care sterge tot canvas-ul
// Aceasta functie se apeleaza inainte de fiecare frame pentru a "curata" ecranul
function clearCanvas() {
    // Setam culoarea de fundal
    ctx.fillStyle = '#0a0a0a'; // Negru inchis
    
    // Desenam un dreptunghi care acopera tot canvas-ul
    // fillRect(x, y, latime, inaltime)
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

// ============================================
// SECTIUNEA 7: FUNCTII PENTRU CREAREA ASTEROIZILOR
// ============================================

// Functie care returneaza culoarea asteroidului bazat pe HP
function getAsteroidColor(hp) {
    // Folosim un switch pentru a alege culoarea
    // Fiecare nivel de HP are o culoare diferita
    if (hp === 1) {
        return '#ffff00'; // Galben - cel mai slab
    } else if (hp === 2) {
        return '#ff9900'; // Portocaliu
    } else if (hp === 3) {
        return '#ff3300'; // Rosu
    } else if (hp === 4) {
        return '#ff00ff'; // Magenta - cel mai puternic
    }
}

// Functie care returneaza dimensiunea asteroidului bazat pe HP
function getAsteroidSize(hp) {
    // Dimensiunea creste cu HP-ul
    // HP 1 = 20px, HP 2 = 30px, HP 3 = 40px, HP 4 = 50px
    var baseSize = 15;
    var sizeIncrement = 10;
    return baseSize + (hp * sizeIncrement);
}

// Functie care creeaza un asteroid nou cu proprietati aleatoare
function createAsteroid() {
    // Cream un obiect nou pentru asteroid
    var asteroid = {};
    
    // Generam HP aleator intre 1 si 4
    // Math.random() da un numar intre 0 si 1
    // Math.random() * 4 da un numar intre 0 si 4
    // Math.floor() rotunjeste in jos la intreg
    // Adaugam 1 pentru a avea range-ul 1-4 in loc de 0-3
    asteroid.hp = Math.floor(Math.random() * 4) + 1;
    
    // Setam dimensiunea bazat pe HP
    asteroid.size = getAsteroidSize(asteroid.hp);
    
    // Setam culoarea bazat pe HP
    asteroid.color = getAsteroidColor(asteroid.hp);
    
    // Generam pozitie aleatoare pe canvas
    // Evitam sa cream asteroidul prea aproape de margini
    var margin = 50; // Spatiu de siguranta de la margini
    asteroid.x = margin + Math.random() * (canvasWidth - 2 * margin);
    asteroid.y = margin + Math.random() * (canvasHeight - 2 * margin);
    
    // Generam viteza aleatoare
    // Viteza va fi intre -2 si 2 (excluzand valorile prea mici aproape de 0)
    // Aceasta formula asigura ca asteroidul se misca vizibil
    asteroid.velocityX = (Math.random() - 0.5) * 4; // -2 la +2
    asteroid.velocityY = (Math.random() - 0.5) * 4; // -2 la +2
    
    // Daca viteza este prea mica pe ambele axe, o ajustam
    // Altfel asteroidul ar sta aproape pe loc
    if (Math.abs(asteroid.velocityX) < 0.5 && Math.abs(asteroid.velocityY) < 0.5) {
        asteroid.velocityX = 1.5;
        asteroid.velocityY = 1.5;
    }
    
    return asteroid;
}

// Functie care creeaza mai multi asteroizi la inceputul jocului
function createInitialAsteroids() {
    // Golim array-ul de asteroizi (in caz ca jocul este restartat)
    asteroids = [];
    
    // Cream numberOfAsteroids asteroizi
    for (var i = 0; i < numberOfAsteroids; i++) {
        // Cream un asteroid nou
        var newAsteroid = createAsteroid();
        
        // Verificam ca asteroidul nu este prea aproape de nava
        // Calculam distanta dintre asteroid si nava
        var distanceX = newAsteroid.x - ship.x;
        var distanceY = newAsteroid.y - ship.y;
        var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        // Daca asteroidul este prea aproape, ii schimbam pozitia
        var safeDistance = 100;
        if (distance < safeDistance) {
            // Mutam asteroidul departe de nava
            newAsteroid.x = canvasWidth / 4;
            newAsteroid.y = canvasHeight / 4;
        }
        
        // Adaugam asteroidul in array
        asteroids.push(newAsteroid);
    }
    
    console.log('Au fost creati', asteroids.length, 'asteroizi');
}

// ============================================
// SECTIUNEA 8: FUNCTII PENTRU MISCARE SI ROTATIE
// ============================================

// Functie care actualizeaza pozitia si rotatia navei bazat pe tastele apasate
function updateShip() {
    // ROTATIE
    // Verificam atat tastatura cat si touch controls
    if (keys.z || touchControls.rotateLeft) {
        ship.angle = ship.angle - ship.rotationSpeed;
    }
    
    if (keys.c || touchControls.rotateRight) {
        ship.angle = ship.angle + ship.rotationSpeed;
    }
    
    // MISCARE
    ship.velocityX = 0;
    ship.velocityY = 0;
    
    if (keys.ArrowLeft || touchControls.moveLeft) {
        ship.velocityX = -ship.speed;
    }
    
    if (keys.ArrowRight || touchControls.moveRight) {
        ship.velocityX = ship.speed;
    }
    
    if (keys.ArrowUp || touchControls.moveUp) {
        ship.velocityY = -ship.speed;
    }
    
    if (keys.ArrowDown || touchControls.moveDown) {
        ship.velocityY = ship.speed;
    }
    
    // Aplicam viteza la pozitie
    ship.x = ship.x + ship.velocityX;
    ship.y = ship.y + ship.velocityY;
    
    // WRAP-AROUND
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
// Functie care actualizeaza pozitia asteroizilor
function updateAsteroids() {
    // Parcurgem fiecare asteroid
    for (var i = 0; i < asteroids.length; i++) {
        // Luam asteroidul curent
        var asteroid = asteroids[i];
        
        // Actualizam pozitia asteroidului bazat pe viteza
        asteroid.x = asteroid.x + asteroid.velocityX;
        asteroid.y = asteroid.y + asteroid.velocityY;
        
        // WRAP-AROUND: Daca asteroidul iese din ecran, apare de cealalta parte
        
        // Daca asteroidul iese pe dreapta
        if (asteroid.x > canvasWidth + asteroid.size) {
            asteroid.x = -asteroid.size;
        }
        
        // Daca asteroidul iese pe stanga
        if (asteroid.x < -asteroid.size) {
            asteroid.x = canvasWidth + asteroid.size;
        }
        
        // Daca asteroidul iese jos
        if (asteroid.y > canvasHeight + asteroid.size) {
            asteroid.y = -asteroid.size;
        }
        
        // Daca asteroidul iese sus
        if (asteroid.y < -asteroid.size) {
            asteroid.y = canvasHeight + asteroid.size;
        }
    }
}

// ============================================
// SECTIUNEA 9: FUNCTII PENTRU ACTUALIZAREA AFISAJULUI
// ============================================

// Functie care actualizeaza afisarea scorului pe ecran
function updateScoreDisplay() {
    // Gasim elementul HTML cu id-ul "score"
    var scoreElement = document.getElementById('score');
    // Schimbam textul din element cu valoarea curenta a scorului
    scoreElement.textContent = score;
}

// Functie care actualizeaza afisarea vietilor pe ecran
function updateLivesDisplay() {
    // Gasim elementul HTML cu id-ul "lives"
    var livesElement = document.getElementById('lives');
    // Schimbam textul din element cu numarul de vieti ramase
    livesElement.textContent = lives;
}

// ============================================
// SECTIUNEA 10: GAME LOOP (BUCLA PRINCIPALA)
// ============================================

// Functia gameLoop este "inima" jocului
// Aceasta functie se apeleaza de aproximativ 60 de ori pe secunda
// Si actualizeaza si deseneaza tot ce se intampla in joc
function gameLoop() {
    // Verificam daca jocul este activ
    if (!gameRunning) {
        return;
    }
    
    // 1. Stergem tot ce este desenat pe canvas
    clearCanvas();
    
    // 2. Actualizam pozitia navei bazat pe input-ul jucatorului
    updateShip();
    
    // 3. Verificam daca jucatorul vrea sa traga
    handleShooting();
    
    // 4. Actualizam pozitia rachetelor
    updateMissiles();
    
    // 5. Actualizam pozitia asteroizilor
    updateAsteroids();
    
    // 6. Verificam coliziunile
    checkMissileAsteroidCollisions();
    checkAsteroidAsteroidCollisions();
    checkShipAsteroidCollisions();
    
    // 7. Desenam toti asteroizii
    drawAsteroids();
    
    // 8. Desenam toate rachetele
    drawMissiles();
    
    // 9. Desenam nava (ultima pentru a fi deasupra)
    drawShip();
    
    // 10. Continuam loop-ul
    requestAnimationFrame(gameLoop);
}

// ============================================
// SECTIUNEA 11: FUNCTII DE CONTROL AL JOCULUI
// ============================================

// Functie care porneste jocul
function startGame() {
    console.log('Jocul a fost pornit!');
    
    // Setam gameRunning pe true
    gameRunning = true;
    
    // Ascundem ecranul de start
    var startScreen = document.getElementById('start-screen');
    startScreen.style.display = 'none';
    
    // Resetam pozitia navei in centrul ecranului
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    ship.angle = -Math.PI / 2; // Orientare in sus
    
    // Cream asteroizii initiali
    createInitialAsteroids();
    
    // Pornim bucla principala a jocului
    gameLoop();
}

// ============================================
// SECTIUNEA 12: FUNCTIA PRINCIPALA DE SETUP
// ============================================

// Functie care initializeaza jocul
// Aceasta functie se apeleaza la incarcarea paginii
function initGame() {
    console.log('Jocul a fost initializat!');
    
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    
    updateScoreDisplay();
    updateLivesDisplay();
    updateHighScoreDisplay();
    displayHighScores();
    
    // Cream butoanele touch
    createTouchButtons();
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Apasa SPACE pentru a incepe', canvasWidth / 2, canvasHeight / 2);
    
    console.log('Canvas width:', canvasWidth);
    console.log('Canvas height:', canvasHeight);
    console.log('Ship pozitie initiala:', ship.x, ship.y);
}

// ============================================
// SECTIUNEA 13: APELAREA FUNCTIEI DE INITIALIZARE
// ============================================

// Asteptam ca intreaga pagina HTML sa se incarce
// Apoi apelam functia initGame pentru a incepe
window.addEventListener('load', function() {
    console.log('Pagina s-a incarcat complet');
    initGame();
});

// ============================================
// SECTIUNEA 14: VARIABILE PENTRU RACHETE
// ============================================

// Viteza cu care se deplaseaza rachetele
var missileSpeed = 7;

// Dimensiunea rachetelor (raza)
var missileSize = 3;

// Numarul maxim de rachete care pot fi lansate simultan
var maxMissiles = 3;

// Variabila pentru a preveni lansarea continua de rachete
// Cand apasam X, vrem sa lansam doar o racheta, nu mai multe
var canShoot = true;

// ============================================
// SECTIUNEA 15: FUNCTII PENTRU RACHETE
// ============================================

// Functie care creeaza o racheta noua
// Racheta porneste de la pozitia navei si se deplaseaza in directia in care nava este orientata
// Functie care creeaza o racheta noua
// Racheta porneste de la pozitia navei si se deplaseaza in directia in care nava este orientata
function createMissile() {
    // Verificam daca putem lansa o racheta
    // Nu putem lansa daca avem deja 3 rachete active
    if (missiles.length >= maxMissiles) {
        console.log('Nu poti lansa mai mult de', maxMissiles, 'rachete simultan');
        return; // Iesim din functie fara sa cream racheta
    }
    
    // Cream un obiect nou pentru racheta
    var missile = {};
    
    // POZITIA INITIALA: Racheta porneste de la varful navei
    // Varful navei este desenat la (0, -ship.size) in sistemul local de coordonate
    // Trebuie sa transformam aceasta pozitie relativa in coordonate absolute
    
    // Distanta de la centrul navei la varf
    var tipDistance = ship.size;
    const OFFSET = Math.PI / 2;
    
    // Calculam pozitia varfului folosind unghiul navei
        // Unghiul navei indica directia in care este orientat varful
        missile.x = ship.x + Math.cos(ship.angle - OFFSET) * tipDistance;
        missile.y = ship.y + Math.sin(ship.angle - OFFSET) * tipDistance;
    
    // VITEZA: Racheta se deplaseaza in aceeasi directie ca nava
    // Inmultim viteza cu cos/sin pentru a obtine componentele pe X si Y
    missile.velocityX = Math.cos(ship.angle - OFFSET) * missileSpeed;
    missile.velocityY = Math.sin(ship.angle - OFFSET) * missileSpeed;
    
    // Dimensiunea rachetei
    missile.size = missileSize;
    
    // Adaugam racheta in array-ul de rachete
    missiles.push(missile);
    
    console.log('Racheta lansata! Total rachete active:', missiles.length);
}

// Functie care deseneaza o racheta
function drawMissile(missile) {
    // Incepem sa desenam un cerc pentru racheta
    ctx.beginPath();
    
    // Desenam cercul rachetei
    ctx.arc(missile.x, missile.y, missile.size, 0, Math.PI * 2);
    
    // Setam culoarea rachetei
    ctx.fillStyle = '#ffff00'; // Galben
    
    // Umplem cercul
    ctx.fill();
    
    // Adaugam si un contur
    ctx.strokeStyle = '#ffffff'; // Alb
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Functie care deseneaza toate rachetele
function drawMissiles() {
    // Parcurgem fiecare racheta din array
    for (var i = 0; i < missiles.length; i++) {
        // Luam racheta curenta
        var missile = missiles[i];
        
        // Desenam racheta
        drawMissile(missile);
    }
}

// Functie care actualizeaza pozitia rachetelor
function updateMissiles() {
    // Parcurgem rachetele de la sfarsit spre inceput
    // Acest lucru este important pentru ca vom sterge rachete din array
    // Si stergerea in timpul parcurgerii de la inceput catre sfarsit cauzeaza probleme
    for (var i = missiles.length - 1; i >= 0; i--) {
        // Luam racheta curenta
        var missile = missiles[i];
        
        // Actualizam pozitia rachetei
        missile.x = missile.x + missile.velocityX;
        missile.y = missile.y + missile.velocityY;
        
        // Verificam daca racheta a iesit din ecran
        // Daca da, o stergem din array
        var outOfBounds = false;
        
        if (missile.x < 0 || missile.x > canvasWidth) {
            outOfBounds = true;
        }
        
        if (missile.y < 0 || missile.y > canvasHeight) {
            outOfBounds = true;
        }
        
        // Daca racheta a iesit din ecran, o stergem
        if (outOfBounds) {
            // splice(index, 1) sterge 1 element de la pozitia index
            missiles.splice(i, 1);
            console.log('Racheta a iesit din ecran. Rachete ramase:', missiles.length);
        }
    }
}

// Functie care verifica daca tasta X este apasata si lanseaza racheta
function handleShooting() {
    // Verificam atat tastatura cat si touch controls
    if (keys.x || touchControls.shoot) {
        if (canShoot) {
            createMissile();
            canShoot = false;
        }
    } else {
        canShoot = true;
    }
}
// ============================================
// SECTIUNEA 16: FUNCTII PENTRU DETECTAREA COLIZIUNILOR
// ============================================

// Functie care calculeaza distanta intre doua puncte
// Folosim teorema lui Pitagora: distanta = sqrt((x2-x1)^2 + (y2-y1)^2)
function getDistance(x1, y1, x2, y2) {
    // Calculam diferenta pe axa X
    var dx = x2 - x1;
    
    // Calculam diferenta pe axa Y
    var dy = y2 - y1;
    
    // Calculam distanta folosind teorema lui Pitagora
    // dx*dx + dy*dy = ipotenuz^2
    // sqrt(ipotenuz^2) = ipotenuz
    var distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance;
}

// Functie care verifica coliziunea intre doua cercuri
// Doua cercuri se ciocnesc cand distanta dintre centrele lor este mai mica decat suma razelor
function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    // Calculam distanta dintre cele doua centre
    var distance = getDistance(x1, y1, x2, y2);
    
    // Verificam daca distanta este mai mica decat suma razelor
    // Daca da, cercurile se ciocnesc
    if (distance < r1 + r2) {
        return true; // Coliziune detectata
    }
    
    return false; // Nu este coliziune
}

// Functie care verifica coliziunile dintre rachete si asteroizi
function checkMissileAsteroidCollisions() {
    // Parcurgem fiecare racheta (de la sfarsit spre inceput pentru a putea sterge)
    for (var i = missiles.length - 1; i >= 0; i--) {
        var missile = missiles[i];
        
        // Pentru fiecare racheta, verificam coliziunea cu fiecare asteroid
        for (var j = asteroids.length - 1; j >= 0; j--) {
            var asteroid = asteroids[j];
            
            // Verificam daca racheta si asteroidul se ciocnesc
            var collision = checkCircleCollision(
                missile.x, missile.y, missile.size,
                asteroid.x, asteroid.y, asteroid.size
            );
            
            // Daca s-au ciocnit
            if (collision) {
                console.log('Racheta a lovit un asteroid!');
                
                // Scadem 1 din HP-ul asteroidului
                asteroid.hp = asteroid.hp - 1;
                
                // Verificam daca asteroidul a fost distrus (HP = 0)
                if (asteroid.hp <= 0) {
                    console.log('Asteroid distrus!');
                    
                    // Crestem scorul
                    // Fiecare asteroid distrus da 10 puncte
                    score = score + 10;
                    updateScoreDisplay();
                    
                    // Verificam daca jucatorul a castigat o viata suplimentara
                    checkExtraLife();
                    
                    // Stergem asteroidul din array
                    asteroids.splice(j, 1);
                    
                    // Verificam daca au fost distrusi toti asteroizii
                    if (asteroids.length === 0) {
                        console.log('Toti asteroizii au fost distrusi! Se creeaza altii noi...');
                        // Cream asteroizi noi
                        createInitialAsteroids();
                    }
                } else {
                    // Daca asteroidul nu a fost distrus, actualizam culoarea si dimensiunea
                    asteroid.color = getAsteroidColor(asteroid.hp);
                    asteroid.size = getAsteroidSize(asteroid.hp);
                    console.log('Asteroidului ii mai raman', asteroid.hp, 'HP');
                }
                
                // Stergem racheta (indiferent daca asteroidul a fost distrus sau nu)
                missiles.splice(i, 1);
                
                // Iesim din bucla de asteroizi pentru aceasta racheta
                // (o racheta poate lovi doar un asteroid)
                break;
            }
        }
    }
}

// Functie care verifica coliziunile dintre asteroizi
// Cand doi asteroizi se ciocnesc, isi inverseaza vitezele
function checkAsteroidAsteroidCollisions() {
    // Parcurgem fiecare pereche de asteroizi
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid1 = asteroids[i];
        
        // Incepem de la i+1 pentru a nu verifica acelasi asteroid de doua ori
        for (var j = i + 1; j < asteroids.length; j++) {
            var asteroid2 = asteroids[j];
            
            // Verificam coliziunea
            var collision = checkCircleCollision(
                asteroid1.x, asteroid1.y, asteroid1.size,
                asteroid2.x, asteroid2.y, asteroid2.size
            );
            
            // Daca s-au ciocnit
            if (collision) {
                console.log('Doi asteroizi s-au ciocnit!');
                
                // Inversam vitezele pentru ambii asteroizi
                // Acesta este un mod simplu de a simula "respingerea"
                
                // Salvam vitezele temporar
                var tempVx = asteroid1.velocityX;
                var tempVy = asteroid1.velocityY;
                
                // Inversam vitezele
                asteroid1.velocityX = asteroid2.velocityX;
                asteroid1.velocityY = asteroid2.velocityY;
                asteroid2.velocityX = tempVx;
                asteroid2.velocityY = tempVy;
                
                // Micsoram putin vitezele pentru a simula pierderea de energie
                asteroid1.velocityX = asteroid1.velocityX * 0.9;
                asteroid1.velocityY = asteroid1.velocityY * 0.9;
                asteroid2.velocityX = asteroid2.velocityX * 0.9;
                asteroid2.velocityY = asteroid2.velocityY * 0.9;
                
                // Mutam asteroizii putin deoparte pentru a nu ramana blocati unul in celalalt
                var dx = asteroid2.x - asteroid1.x;
                var dy = asteroid2.y - asteroid1.y;
                var distance = getDistance(asteroid1.x, asteroid1.y, asteroid2.x, asteroid2.y);
                
                // Normalizam vectorul directie (facem lungimea = 1)
                if (distance > 0) {
                    dx = dx / distance;
                    dy = dy / distance;
                }
                
                // Mutam asteroizii deoparte
                var pushDistance = (asteroid1.size + asteroid2.size - distance) / 2;
                asteroid1.x = asteroid1.x - dx * pushDistance;
                asteroid1.y = asteroid1.y - dy * pushDistance;
                asteroid2.x = asteroid2.x + dx * pushDistance;
                asteroid2.y = asteroid2.y + dy * pushDistance;
            }
        }
    }
}

// Functie care verifica coliziunile dintre nava si asteroizi
function checkShipAsteroidCollisions() {
    // Parcurgem fiecare asteroid
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid = asteroids[i];
        
        // Verificam coliziunea dintre nava si asteroid
        // Consideram nava ca un cerc cu raza = ship.size
        var collision = checkCircleCollision(
            ship.x, ship.y, ship.size,
            asteroid.x, asteroid.y, asteroid.size
        );
        
        // Daca nava a lovit un asteroid
        if (collision) {
            console.log('Nava a fost lovita de un asteroid!');
            
            // Scadem o viata
            lives = lives - 1;
            updateLivesDisplay();
            
            console.log('Vieti ramase:', lives);
            
            // Verificam daca jocul s-a terminat
            if (lives <= 0) {
                // Jocul s-a terminat
                gameOver();
            } else {
                // Resetam pozitia navei
                resetShip();
            }
            
            // Iesim din functie dupa ce am detectat o coliziune
            return;
        }
    }
}

// ============================================
// SECTIUNEA 17: FUNCTII PENTRU VIETI SUPLIMENTARE
// ============================================

// Functie care verifica daca jucatorul a castigat o viata suplimentara
function checkExtraLife() {
    // Verificam daca scorul a depasit un multiplu de pointsForExtraLife
    // si nu am dat deja o viata pentru acest scor
    
    // Calculam cate vieti suplimentare ar trebui sa aiba jucatorul bazat pe scor
    var extraLivesEarned = Math.floor(score / pointsForExtraLife);
    var extraLivesEarnedLastTime = Math.floor(lastExtraLifeScore / pointsForExtraLife);
    
    // Daca jucatorul a trecut la un nivel nou de vieti
    if (extraLivesEarned > extraLivesEarnedLastTime) {
        console.log('Ai castigat o viata suplimentara!');
        
        // Adunam o viata
        lives = lives + 1;
        updateLivesDisplay();
        
        // Actualizam ultimul scor la care am dat viata
        lastExtraLifeScore = score;
        
        // Afisam un mesaj pe ecran (optional)
        console.log('Vieti totale:', lives);
    }
}

// ============================================
// SECTIUNEA 18: FUNCTII PENTRU GAME OVER SI RESET
// ============================================

// Functie care reseteaza pozitia navei (cand pierde o viata)
function resetShip() {
    console.log('Resetare nava...');
    
    // Mutam nava in centrul ecranului
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    
    // Resetam unghiul (nava orientata in sus)
    ship.angle = -Math.PI / 2;
    
    // Oprim miscarea navei
    ship.velocityX = 0;
    ship.velocityY = 0;
    
    // Stergem toate rachetele
    missiles = [];
    
    // Cream asteroizi noi la distanta de nava
    createInitialAsteroids();
    
    // Oprim jocul pentru 1 secunda pentru a da timp jucatorului sa se pregateasca
    gameRunning = false;
    
    setTimeout(function() {
        // Repornim jocul dupa 1 secunda
        gameRunning = true;
        gameLoop();
    }, 1000);
}

// Functie care este apelata cand jocul se termina (vieti = 0)
function gameOver() {
    console.log('GAME OVER! Scor final:', score);
    
    // Oprim jocul
    gameRunning = false;
    
    // Afisam ecranul de game over
    var gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'block';
    
    // Afisam scorul final
    var finalScoreElement = document.getElementById('final-score');
    finalScoreElement.textContent = score;
}

// Functie care reseteaza jocul pentru a incepe din nou
function restartGame() {
    console.log('Restart joc...');
    
    // Ascundem ecranul de game over
    var gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'none';
    
    // Resetam variabilele de joc
    score = 0;
    lives = 3;
    lastExtraLifeScore = 0;
    
    // Actualizam afisajul
    updateScoreDisplay();
    updateLivesDisplay();
    
    // Resetam arrays
    asteroids = [];
    missiles = [];
    
    // Pornim jocul din nou
    startGame();
}

// ============================================
// SECTIUNEA 19: EVENT LISTENERS PENTRU BUTOANE
// ============================================

// Butonul pentru restart
document.getElementById('restart-btn').addEventListener('click', function() {
    restartGame();
});

// ============================================
// SECTIUNEA 21: LOCALSTORAGE - SALVARE SI INCARCARE SCORURI
// ============================================

// Functie care incarca scorurile salvate din LocalStorage
function loadHighScores() {
    // Incercam sa luam scorurile din LocalStorage
    // getItem returneaza null daca nu exista date
    var savedScores = localStorage.getItem('asteroidsHighScores');
    
    // Daca exista scoruri salvate
    if (savedScores) {
        // Convertim din text JSON inapoi in array
        // JSON.parse transforma un string JSON intr-un obiect JavaScript
        var scoresArray = JSON.parse(savedScores);
        
        console.log('Scoruri incarcate din LocalStorage:', scoresArray);
        
        return scoresArray;
    } else {
        // Daca nu exista scoruri salvate, returnam un array gol
        console.log('Nu exista scoruri salvate');
        return [];
    }
}

// Functie care salveaza scorurile in LocalStorage
function saveHighScores(scoresArray) {
    // Convertim array-ul de scoruri in text JSON
    // JSON.stringify transforma un obiect JavaScript intr-un string JSON
    var scoresJSON = JSON.stringify(scoresArray);
    
    // Salvam in LocalStorage
    // setItem primeste o cheie (numele) si o valoare (datele)
    localStorage.setItem('asteroidsHighScores', scoresJSON);
    
    console.log('Scoruri salvate in LocalStorage:', scoresArray);
}

// Functie care adauga un scor nou in lista de high scores
function addHighScore(playerName, playerScore) {
    // Validam numele (nu poate fi gol)
    if (!playerName || playerName.trim() === '') {
        alert('Te rog introdu un nume!');
        return;
    }
    
    // Incarcam scorurile existente
    var highScores = loadHighScores();
    
    // Cream un obiect pentru scorul nou
    var newScore = {
        name: playerName.trim(), // trim() elimina spatiile de la inceput si sfarsit
        score: playerScore
    };
    
    // Adaugam scorul nou in array
    highScores.push(newScore);
    
    // Sortam array-ul descrescator dupa scor
    // Functia sort primeste o functie de comparare
    // Daca returneaza un numar negativ, a vine inaintea lui b
    // Daca returneaza un numar pozitiv, b vine inaintea lui a
    highScores.sort(function(a, b) {
        return b.score - a.score; // Descrescator (cel mai mare scor primul)
    });
    
    // Pastram doar primele 5 scoruri
    // slice(0, 5) ia elementele de la index 0 la 4 (primele 5)
    highScores = highScores.slice(0, 5);
    
    // Salvam scorurile actualizate
    saveHighScores(highScores);
    
    // Actualizam afisajul
    displayHighScores();
    
    console.log('Scor adaugat:', newScore);
}

// Functie care afiseaza scorurile pe pagina
function displayHighScores() {
    // Incarcam scorurile
    var highScores = loadHighScores();
    
    // Gasim lista HTML unde afisam scorurile
    var scoresList = document.getElementById('scores-list');
    
    // Golim lista (stergem toate elementele anterioare)
    scoresList.innerHTML = '';
    
    // Verificam daca exista scoruri
    if (highScores.length === 0) {
        // Daca nu exista scoruri, afisam un mesaj
        var emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Niciun scor înregistrat încă';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.fontStyle = 'italic';
        scoresList.appendChild(emptyMessage);
        return;
    }
    
    // Parcurgem fiecare scor si il afisam
    for (var i = 0; i < highScores.length; i++) {
        var scoreData = highScores[i];
        
        // Cream un element <li> nou
        var listItem = document.createElement('li');
        
        // Setam textul elementului
        // Afisam: pozitie. nume - scor puncte
        listItem.textContent = scoreData.name + ' - ' + scoreData.score + ' puncte';
        
        // Adaugam elementul in lista
        scoresList.appendChild(listItem);
    }
}

// Functie care actualizeaza afisarea celui mai bun scor in header
function updateHighScoreDisplay() {
    // Incarcam scorurile
    var highScores = loadHighScores();
    
    // Gasim elementul HTML pentru high score
    var highScoreElement = document.getElementById('high-score');
    
    // Verificam daca exista scoruri
    if (highScores.length > 0) {
        // Afisam cel mai bun scor (primul din array dupa sortare)
        highScoreElement.textContent = highScores[0].score;
    } else {
        // Daca nu exista scoruri, afisam 0
        highScoreElement.textContent = '0';
    }
}

// Event listener pentru butonul "Salveaza Scor"
document.getElementById('save-score-btn').addEventListener('click', function() {
    // Luam numele introdus de jucator
    var playerNameInput = document.getElementById('player-name');
    var playerName = playerNameInput.value;
    
    // Adaugam scorul in lista
    addHighScore(playerName, score);
    
    // Golim input-ul
    playerNameInput.value = '';
    
    // Afisam un mesaj de confirmare
    alert('Scor salvat cu succes!');
});

// ============================================
// SECTIUNEA 22: TOUCH CONTROLS - CONTROALE PENTRU TOUCHSCREEN
// ============================================

// Variabile pentru tracking-ul touch-ului
var touchControls = {
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false,
    rotateLeft: false,
    rotateRight: false,
    shoot: false
};

// Functie care creeaza butoanele virtuale pentru touch control
function createTouchButtons() {
    // Verificam daca dispozitivul are touchscreen
    // Daca nu are, nu cream butoanele
    var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
        console.log('Dispozitiv fara touchscreen, nu cream butoane virtuale');
        return;
    }
    
    console.log('Dispozitiv cu touchscreen detectat, cream butoane virtuale');
    
    // Cream un container pentru butoanele de control
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
    
    // Cream container pentru butoanele de miscare (sageti)
    var moveButtons = document.createElement('div');
    moveButtons.style.cssText = `
        display: grid;
        grid-template-columns: repeat(3, 60px);
        grid-template-rows: repeat(3, 60px);
        gap: 5px;
    `;
    
    // Functie helper pentru crearea unui buton
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
    
    // Cream butoanele de directie
    var upBtn = createButton('↑', '1 / 2 / 2 / 3');
    var leftBtn = createButton('←', '2 / 1 / 3 / 2');
    var rightBtn = createButton('→', '2 / 3 / 3 / 4');
    var downBtn = createButton('↓', '3 / 2 / 4 / 3');
    
    // Adaugam butoanele in container
    moveButtons.appendChild(upBtn);
    moveButtons.appendChild(leftBtn);
    moveButtons.appendChild(rightBtn);
    moveButtons.appendChild(downBtn);
    
    // Cream container pentru butoanele de actiune (rotire si tragere)
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
    
    // Adaugam containerele in containerul principal
    touchButtonsContainer.appendChild(moveButtons);
    touchButtonsContainer.appendChild(actionButtons);
    
    // Adaugam containerul in pagina
    document.body.appendChild(touchButtonsContainer);
    
    // ===== EVENT LISTENERS PENTRU BUTOANE =====
    
    // Buton SUS
    upBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveUp = true;
    });
    upBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveUp = false;
    });
    
    // Buton JOS
    downBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveDown = true;
    });
    downBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveDown = false;
    });
    
    // Buton STANGA
    leftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveLeft = true;
    });
    leftBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveLeft = false;
    });
    
    // Buton DREAPTA
    rightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveRight = true;
    });
    rightBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveRight = false;
    });
    
    // Buton ROTIRE STANGA (Z)
    rotateLeftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.rotateLeft = true;
    });
    rotateLeftBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.rotateLeft = false;
    });
    
    // Buton ROTIRE DREAPTA (C)
    rotateRightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.rotateRight = true;
    });
    rotateRightBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.rotateRight = false;
    });
    
    // Buton TRAGERE (X)
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




/// ============================================
// SECTIUNEA 21: LOCALSTORAGE - SALVARE SI INCARCARE SCORURI
// ============================================

// Functie care incarca scorurile salvate din LocalStorage
function loadHighScores() {
    // Incercam sa luam scorurile din LocalStorage
    // getItem returneaza null daca nu exista date
    var savedScores = localStorage.getItem('asteroidsHighScores');
    
    // Daca exista scoruri salvate
    if (savedScores) {
        // Convertim din text JSON inapoi in array
        // JSON.parse transforma un string JSON intr-un obiect JavaScript
        var scoresArray = JSON.parse(savedScores);
        
        console.log('Scoruri incarcate din LocalStorage:', scoresArray);
        
        return scoresArray;
    } else {
        // Daca nu exista scoruri salvate, returnam un array gol
        console.log('Nu exista scoruri salvate');
        return [];
    }
}

// Functie care salveaza scorurile in LocalStorage
function saveHighScores(scoresArray) {
    // Convertim array-ul de scoruri in text JSON
    // JSON.stringify transforma un obiect JavaScript intr-un string JSON
    var scoresJSON = JSON.stringify(scoresArray);
    
    // Salvam in LocalStorage
    // setItem primeste o cheie (numele) si o valoare (datele)
    localStorage.setItem('asteroidsHighScores', scoresJSON);
    
    console.log('Scoruri salvate in LocalStorage:', scoresArray);
}

// Functie care adauga un scor nou in lista de high scores
function addHighScore(playerName, playerScore) {
    // Validam numele (nu poate fi gol)
    if (!playerName || playerName.trim() === '') {
        alert('Te rog introdu un nume!');
        return;
    }
    
    // Incarcam scorurile existente
    var highScores = loadHighScores();
    
    // Cream un obiect pentru scorul nou
    var newScore = {
        name: playerName.trim(), // trim() elimina spatiile de la inceput si sfarsit
        score: playerScore
    };
    
    // Adaugam scorul nou in array
    highScores.push(newScore);
    
    // Sortam array-ul descrescator dupa scor
    // Functia sort primeste o functie de comparare
    // Daca returneaza un numar negativ, a vine inaintea lui b
    // Daca returneaza un numar pozitiv, b vine inaintea lui a
    highScores.sort(function(a, b) {
        return b.score - a.score; // Descrescator (cel mai mare scor primul)
    });
    
    // Pastram doar primele 5 scoruri
    // slice(0, 5) ia elementele de la index 0 la 4 (primele 5)
    highScores = highScores.slice(0, 5);
    
    // Salvam scorurile actualizate
    saveHighScores(highScores);
    
    // Actualizam afisajul
    displayHighScores();
    
    console.log('Scor adaugat:', newScore);
}

// Functie care afiseaza scorurile pe pagina
function displayHighScores() {
    // Incarcam scorurile
    var highScores = loadHighScores();
    
    // Gasim lista HTML unde afisam scorurile
    var scoresList = document.getElementById('scores-list');
    
    // Golim lista (stergem toate elementele anterioare)
    scoresList.innerHTML = '';
    
    // Verificam daca exista scoruri
    if (highScores.length === 0) {
        // Daca nu exista scoruri, afisam un mesaj
        var emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Niciun scor înregistrat încă';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.fontStyle = 'italic';
        scoresList.appendChild(emptyMessage);
        return;
    }
    
    // Parcurgem fiecare scor si il afisam
    for (var i = 0; i < highScores.length; i++) {
        var scoreData = highScores[i];
        
        // Cream un element <li> nou
        var listItem = document.createElement('li');
        
        // Setam textul elementului
        // Afisam: pozitie. nume - scor puncte
        listItem.textContent = scoreData.name + ' - ' + scoreData.score + ' puncte';
        
        // Adaugam elementul in lista
        scoresList.appendChild(listItem);
    }
}

// Functie care actualizeaza afisarea celui mai bun scor in header
function updateHighScoreDisplay() {
    // Incarcam scorurile
    var highScores = loadHighScores();
    
    // Gasim elementul HTML pentru high score
    var highScoreElement = document.getElementById('high-score');
    
    // Verificam daca exista scoruri
    if (highScores.length > 0) {
        // Afisam cel mai bun scor (primul din array dupa sortare)
        highScoreElement.textContent = highScores[0].score;
    } else {
        // Daca nu exista scoruri, afisam 0
        highScoreElement.textContent = '0';
    }
}

// Event listener pentru butonul "Salveaza Scor"
document.getElementById('save-score-btn').addEventListener('click', function() {
    // Luam numele introdus de jucator
    var playerNameInput = document.getElementById('player-name');
    var playerName = playerNameInput.value;
    
    // Adaugam scorul in lista
    addHighScore(playerName, score);
    
    // Golim input-ul
    playerNameInput.value = '';
    
    // Afisam un mesaj de confirmare
    alert('Scor salvat cu succes!');
});

// ============================================
// SECTIUNEA 22: TOUCH CONTROLS - CONTROALE PENTRU TOUCHSCREEN
// ============================================

// Variabile pentru tracking-ul touch-ului
var touchControls = {
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false,
    rotateLeft: false,
    rotateRight: false,
    shoot: false
};

// Functie care creeaza butoanele virtuale pentru touch control
function createTouchButtons() {
    // Verificam daca dispozitivul are touchscreen
    // Daca nu are, nu cream butoanele
    var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
        console.log('Dispozitiv fara touchscreen, nu cream butoane virtuale');
        return;
    }
    
    console.log('Dispozitiv cu touchscreen detectat, cream butoane virtuale');
    
    // Cream un container pentru butoanele de control
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
    
    // Cream container pentru butoanele de miscare (sageti)
    var moveButtons = document.createElement('div');
    moveButtons.style.cssText = `
        display: grid;
        grid-template-columns: repeat(3, 60px);
        grid-template-rows: repeat(3, 60px);
        gap: 5px;
    `;
    
    // Functie helper pentru crearea unui buton
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
    
    // Cream butoanele de directie
    var upBtn = createButton('↑', '1 / 2 / 2 / 3');
    var leftBtn = createButton('←', '2 / 1 / 3 / 2');
    var rightBtn = createButton('→', '2 / 3 / 3 / 4');
    var downBtn = createButton('↓', '3 / 2 / 4 / 3');
    
    // Adaugam butoanele in container
    moveButtons.appendChild(upBtn);
    moveButtons.appendChild(leftBtn);
    moveButtons.appendChild(rightBtn);
    moveButtons.appendChild(downBtn);
    
    // Cream container pentru butoanele de actiune (rotire si tragere)
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
    
    // Adaugam containerele in containerul principal
    touchButtonsContainer.appendChild(moveButtons);
    touchButtonsContainer.appendChild(actionButtons);
    
    // Adaugam containerul in pagina
    document.body.appendChild(touchButtonsContainer);
    
    // ===== EVENT LISTENERS PENTRU BUTOANE =====
    
    // Buton SUS
    upBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveUp = true;
    });
    upBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveUp = false;
    });
    
    // Buton JOS
    downBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveDown = true;
    });
    downBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveDown = false;
    });
    
    // Buton STANGA
    leftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveLeft = true;
    });
    leftBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveLeft = false;
    });
    
    // Buton DREAPTA
    rightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.moveRight = true;
    });
    rightBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.moveRight = false;
    });
    
    // Buton ROTIRE STANGA (Z)
    rotateLeftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.rotateLeft = true;
    });
    rotateLeftBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.rotateLeft = false;
    });
    
    // Buton ROTIRE DREAPTA (C)
    rotateRightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchControls.rotateRight = true;
    });
    rotateRightBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchControls.rotateRight = false;
    });
    
    // Buton TRAGERE (X)
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

