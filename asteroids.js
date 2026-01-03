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

// Numarul maxim de rachete care pot fi lansate simultan
var maxMissiles = 3;

// Variabila pentru a preveni spam-ul tastei X (cooldown intre lansari)
var canShoot = true;

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
// SECTIUNEA 5: EVENT LISTENERS PENTRU TASTATURA SI TOUCH
// ============================================

// Functie care se apeleaza cand o tasta este apasata
document.addEventListener('keydown', function(event) {
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
document.addEventListener('keyup', function(event) {
    // Verificam daca tasta eliberata este in obiectul nostru keys
    if (keys.hasOwnProperty(event.key)) {
        // Setam valoarea pe false pentru a marca ca tasta nu mai este apasata
        keys[event.key] = false;
        event.preventDefault();
    }
});

// ============================================
// SECTIUNEA 5B: EVENT LISTENERS PENTRU TOUCH CONTROLS
// ============================================

// Functie care se apeleaza la incarcarea paginii pentru a seta touch controls
function setupTouchControls() {
    // Obtinem toate butoanele touch
    var touchUp = document.getElementById('touch-up');
    var touchDown = document.getElementById('touch-down');
    var touchLeft = document.getElementById('touch-left');
    var touchRight = document.getElementById('touch-right');
    var touchRotateLeft = document.getElementById('touch-rotate-left');
    var touchRotateRight = document.getElementById('touch-rotate-right');
    var touchShoot = document.getElementById('touch-shoot');
    
    // Functie helper pentru a seta evenimentele touch pe un buton
    // keyName = numele tastei din obiectul keys (ex: 'ArrowUp')
    function setupTouchButton(button, keyName) {
        // Eveniment cand butonul este apasat (touchstart)
        button.addEventListener('touchstart', function(event) {
            keys[keyName] = true;
            event.preventDefault(); // Prevenim scroll-ul pe mobil
        });
        
        // Eveniment cand butonul este eliberat (touchend)
        button.addEventListener('touchend', function(event) {
            keys[keyName] = false;
            event.preventDefault();
        });
        
        // Si pentru mouse (pentru testare pe desktop)
        button.addEventListener('mousedown', function(event) {
            keys[keyName] = true;
            event.preventDefault();
        });
        
        button.addEventListener('mouseup', function(event) {
            keys[keyName] = false;
            event.preventDefault();
        });
    }
    
    // Setam fiecare buton cu tasta corespunzatoare
    setupTouchButton(touchUp, 'ArrowUp');
    setupTouchButton(touchDown, 'ArrowDown');
    setupTouchButton(touchLeft, 'ArrowLeft');
    setupTouchButton(touchRight, 'ArrowRight');
    setupTouchButton(touchRotateLeft, 'z');
    setupTouchButton(touchRotateRight, 'c');
    setupTouchButton(touchShoot, 'x');
    
    console.log('Touch controls au fost configurate');
}

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

// Functie care deseneaza o racheta
// Parametru: missile - obiectul care contine proprietatile rachetei
function drawMissile(missile) {
    // Desenam racheta ca un mic cerc alb
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, missile.size, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; // Alb
    ctx.fill();
    ctx.strokeStyle = '#00ff00'; // Contur verde
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
// SECTIUNEA 7: FUNCTII PENTRU CREAREA ASTEROIZILOR SI RACHETELOR
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

// Functie care actualizeaza proprietatile asteroidului cand HP-ul se schimba
function updateAsteroidProperties(asteroid) {
    // Actualizam culoarea bazat pe noul HP
    asteroid.color = getAsteroidColor(asteroid.hp);
    
    // Actualizam dimensiunea bazat pe noul HP
    asteroid.size = getAsteroidSize(asteroid.hp);
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

// Functie care creeaza o racheta noua
function createMissile() {
    // Verificam daca putem lansa racheta (cooldown)
    if (!canShoot) {
        return; // Nu lansam racheta daca nu putem
    }
    
    // Verificam daca avem deja numarul maxim de rachete
    if (missiles.length >= maxMissiles) {
        console.log('Prea multe rachete active! Maxim:', maxMissiles);
        return; // Nu lansam racheta daca avem deja 3
    }
    
    // Cream obiectul pentru racheta
    var missile = {};
    
    // Racheta porneste de la pozitia navei
    missile.x = ship.x;
    missile.y = ship.y;
    
    // Dimensiunea rachetei
    missile.size = 3;
    
    // Viteza rachetei (mai rapida decat nava)
    var missileSpeed = 8;
    
    // Calculam directia rachetei bazat pe unghiul navei
    // Folosim trigonometrie:
    // - cos(unghi) da componenta X a directiei
    // - sin(unghi) da componenta Y a directiei
    missile.velocityX = Math.cos(ship.angle) * missileSpeed;
    missile.velocityY = Math.sin(ship.angle) * missileSpeed;
    
    // Adaugam racheta in array
    missiles.push(missile);
    
    console.log('Racheta lansata! Total rachete:', missiles.length);
    
    // Activam cooldown-ul pentru a preveni spam
    canShoot = false;
    
    // Dupa 250ms permitem lansarea altei rachete
    setTimeout(function() {
        canShoot = true;
    }, 250);
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
    // Daca tasta Z este apasata, rotim nava spre stanga
    if (keys.z) {
        // Scadem din unghi pentru a roti in sens trigonometric (stanga)
        ship.angle = ship.angle - ship.rotationSpeed;
    }
    
    // Daca tasta C este apasata, rotim nava spre dreapta
    if (keys.c) {
        // Adunam la unghi pentru a roti in sens orar (dreapta)
        ship.angle = ship.angle + ship.rotationSpeed;
    }
    
    // MISCARE
    // Resetam viteza la 0 inainte de a verifica tastele
    ship.velocityX = 0;
    ship.velocityY = 0;
    
    // Daca sageata stanga este apasata, ne miscam spre stanga
    if (keys.ArrowLeft) {
        ship.velocityX = -ship.speed; // Viteza negativa = miscare spre stanga
    }
    
    // Daca sageata dreapta este apasata, ne miscam spre dreapta
    if (keys.ArrowRight) {
        ship.velocityX = ship.speed; // Viteza pozitiva = miscare spre dreapta
    }
    
    // Daca sageata sus este apasata, ne miscam in sus
    if (keys.ArrowUp) {
        ship.velocityY = -ship.speed; // Viteza negativa = miscare in sus (Y scade)
    }
    
    // Daca sageata jos este apasata, ne miscam in jos
    if (keys.ArrowDown) {
        ship.velocityY = ship.speed; // Viteza pozitiva = miscare in jos (Y creste)
    }
    
    // Aplicam viteza la pozitie
    ship.x = ship.x + ship.velocityX;
    ship.y = ship.y + ship.velocityY;
    
    // WRAP-AROUND: Daca nava iese din ecran, apare de cealalta parte
    // Acest lucru creeaza efectul de "spatiu infinit"
    
    // Daca nava iese pe dreapta, apare pe stanga
    if (ship.x > canvasWidth) {
        ship.x = 0;
    }
    
    // Daca nava iese pe stanga, apare pe dreapta
    if (ship.x < 0) {
        ship.x = canvasWidth;
    }
    
    // Daca nava iese jos, apare sus
    if (ship.y > canvasHeight) {
        ship.y = 0;
    }
    
    // Daca nava iese sus, apare jos
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

// Functie care actualizeaza pozitia rachetelor
function updateMissiles() {
    // Parcurgem rachetele de la sfarsit la inceput
    // Acest lucru ne permite sa stergem rachete din array in siguranta
    for (var i = missiles.length - 1; i >= 0; i--) {
        // Luam racheta curenta
        var missile = missiles[i];
        
        // Actualizam pozitia rachetei
        missile.x = missile.x + missile.velocityX;
        missile.y = missile.y + missile.velocityY;
        
        // Daca racheta iese din ecran, o stergem din array
        // Folosim splice pentru a sterge un element din array
        if (missile.x < 0 || missile.x > canvasWidth || 
            missile.y < 0 || missile.y > canvasHeight) {
            missiles.splice(i, 1); // Sterge racheta de la pozitia i
            console.log('Racheta a iesit din ecran. Rachete ramase:', missiles.length);
        }
    }
}

// ============================================
// SECTIUNEA 9: FUNCTII PENTRU DETECTAREA COLIZIUNILOR
// ============================================

// Functie care calculeaza distanta dintre doua puncte
// Foloseste teorema lui Pitagora: distanta = radical din (x^2 + y^2)
function calculateDistance(x1, y1, x2, y2) {
    var dx = x1 - x2; // Diferenta pe axa X
    var dy = y1 - y2; // Diferenta pe axa Y
    
    // Ridicam la patrat si adunam: dx^2 + dy^2
    // Apoi extragem radicalul cu Math.sqrt
    return Math.sqrt(dx * dx + dy * dy);
}

// Functie care verifica coliziunea intre doua cercuri
// Doua cercuri se ciocnesc daca distanta dintre centre < suma razelor
function checkCircleCollision(x1, y1, radius1, x2, y2, radius2) {
    var distance = calculateDistance(x1, y1, x2, y2);
    
    // Daca distanta este mai mica decat suma razelor, avem coliziune
    return distance < (radius1 + radius2);
}

// Functie care verifica coliziunile intre rachete si asteroizi
function checkMissileAsteroidCollisions() {
    // Parcurgem rachetele de la sfarsit la inceput
    for (var i = missiles.length - 1; i >= 0; i--) {
        var missile = missiles[i];
        
        // Parcurgem asteroizii de la sfarsit la inceput
        for (var j = asteroids.length - 1; j >= 0; j--) {
            var asteroid = asteroids[j];
            
            // Verificam daca racheta si asteroidul se ciocnesc
            var collision = checkCircleCollision(
                missile.x, missile.y, missile.size,
                asteroid.x, asteroid.y, asteroid.size
            );
            
            if (collision) {
                console.log('Racheta a lovit asteroidul!');
                
                // Reducem HP-ul asteroidului
                asteroid.hp = asteroid.hp - 1;
                
                // Verificam daca asteroidul a fost distrus
                if (asteroid.hp <= 0) {
                    // Adaugam puncte la scor
                    // Asteroizi mai mari dau mai multe puncte
                    var points = 10 * (4 - asteroid.hp + 1); // HP initial x 10
                    score = score + 25; // Simplificat: 25 puncte per asteroid
                    updateScoreDisplay();
                    
                    // Verificam daca jucatorul castiga o viata noua
                    checkExtraLife();
                    
                    // Stergem asteroidul din array
                    asteroids.splice(j, 1);
                    console.log('Asteroid distrus! Scor:', score);
                } else {
                    // Daca asteroidul nu a fost distrus, actualizam proprietatile
                    updateAsteroidProperties(asteroid);
                    console.log('Asteroid lovit! HP ramas:', asteroid.hp);
                }
                
                // Stergem racheta din array (oricum a lovit ceva)
                missiles.splice(i, 1);
                
                // Iesim din bucla de asteroizi (racheta a fost stearsa)
                break;
            }
        }
    }
}

// Functie care verifica coliziunea dintre nava si asteroizi
function checkShipAsteroidCollisions() {
    // Parcurgem fiecare asteroid
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid = asteroids[i];
        
        // Verificam coliziunea cu nava
        var collision = checkCircleCollision(
            ship.x, ship.y, ship.size,
            asteroid.x, asteroid.y, asteroid.size
        );
        
        if (collision) {
            console.log('Nava a lovit un asteroid!');
            
            // Pierdem o viata
            lives = lives - 1;
            updateLivesDisplay();
            
            // Verificam daca jocul s-a terminat
            if (lives <= 0) {
                gameOver();
            } else {
                // Respawn-am nava in centru
                respawnShip();
            }
            
            // Oprim verificarea (o singura coliziune per frame)
            break;
        }
    }
}

// Functie care verifica daca jucatorul merita o viata noua
function checkExtraLife() {
    // Verificam daca scorul a trecut pragul pentru viata noua
    // Si daca nu am dat deja viata la acest prag
    if (score >= lastExtraLifeScore + pointsForExtraLife) {
        lives = lives + 1;
        updateLivesDisplay();
        
        // Actualizam pragul pentru urmatoarea viata
        lastExtraLifeScore = lastExtraLifeScore + pointsForExtraLife;
        
        console.log('Viata noua! Vieti totale:', lives);
    }
}

// Functie care verifica coliziunile intre asteroizi
function checkAsteroidCollisions() {
    // Parcurgem fiecare pereche de asteroizi
    // Folosim doua bucle: i parcurge toti asteroizii, j parcurge asteroizii dupa i
    for (var i = 0; i < asteroids.length; i++) {
        for (var j = i + 1; j < asteroids.length; j++) {
            var asteroid1 = asteroids[i];
            var asteroid2 = asteroids[j];
            
            // Verificam daca cei doi asteroizi se ciocnesc
            var collision = checkCircleCollision(
                asteroid1.x, asteroid1.y, asteroid1.size,
                asteroid2.x, asteroid2.y, asteroid2.size
            );
            
            if (collision) {
                // Calculam directia de la asteroid1 la asteroid2
                var dx = asteroid2.x - asteroid1.x;
                var dy = asteroid2.y - asteroid1.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                
                // Normalizam directia (facem lungimea vectorului = 1)
                // Impartim fiecare componenta la distanta
                if (distance > 0) {
                    dx = dx / distance;
                    dy = dy / distance;
                }
                
                // Schimbam directiile de miscare ale asteroizilor
                // Folosim o formula simplificata: inversam vitezele pe directia coliziunii
                
                // Salvam vitezele vechi
                var v1x = asteroid1.velocityX;
                var v1y = asteroid1.velocityY;
                var v2x = asteroid2.velocityX;
                var v2y = asteroid2.velocityY;
                
                // Interschimbam partial vitezele (simplu, nu fizic perfect)
                asteroid1.velocityX = v2x;
                asteroid1.velocityY = v2y;
                asteroid2.velocityX = v1x;
                asteroid2.velocityY = v1y;
                
                // Separaim asteroizii pentru a preveni suprapunerea
                // Mutam fiecare asteroid in directia opusa cu jumatate din overlap
                var overlap = asteroid1.size + asteroid2.size - distance;
                var separationX = dx * (overlap / 2 + 1);
                var separationY = dy * (overlap / 2 + 1);
                
                asteroid1.x = asteroid1.x - separationX;
                asteroid1.y = asteroid1.y - separationY;
                asteroid2.x = asteroid2.x + separationX;
                asteroid2.y = asteroid2.y + separationY;
            }
        }
    }
}

// ============================================
// SECTIUNEA 10: FUNCTII PENTRU ACTUALIZAREA AFISAJULUI
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
// SECTIUNEA 10B: FUNCTII PENTRU LOCAL STORAGE (SCORURI MAXIME)
// ============================================

// Functie care incarca scorurile din localStorage
// Returneaza un array cu top 5 scoruri sau un array gol daca nu exista
function loadHighScores() {
    // Incercam sa luam datele din localStorage
    // localStorage.getItem returneaza null daca cheia nu exista
    var scoresString = localStorage.getItem('asteroidsHighScores');
    
    // Daca nu exista scoruri salvate, returnam array gol
    if (scoresString === null) {
        console.log('Nu exista scoruri salvate');
        return [];
    }
    
    // Convertim string-ul JSON inapoi in array
    // JSON.parse transforma string-ul in obiect JavaScript
    try {
        var scores = JSON.parse(scoresString);
        console.log('Scoruri incarcate:', scores);
        return scores;
    } catch (error) {
        // Daca JSON-ul este invalid, returnam array gol
        console.error('Eroare la citirea scorurilor:', error);
        return [];
    }
}

// Functie care salveaza scorurile in localStorage
function saveHighScores(scores) {
    // Convertim array-ul in string JSON
    // JSON.stringify transforma obiectul JavaScript in string
    var scoresString = JSON.stringify(scores);
    
    // Salvam string-ul in localStorage
    localStorage.setItem('asteroidsHighScores', scoresString);
    
    console.log('Scoruri salvate:', scores);
}

// Functie care adauga un scor nou in lista si actualizeaza top 5
function addHighScore(playerName, playerScore) {
    // Incarcam scorurile existente
    var scores = loadHighScores();
    
    // Cream obiectul pentru noul scor
    var newScore = {
        name: playerName,
        score: playerScore
    };
    
    // Adaugam noul scor in array
    scores.push(newScore);
    
    // Sortam array-ul dupa scor (de la cel mai mare la cel mai mic)
    // Functia de comparare: daca b.score > a.score, b vine inaintea lui a
    scores.sort(function(a, b) {
        return b.score - a.score;
    });
    
    // Pastram doar primele 5 scoruri
    // slice(0, 5) returneaza elementele de la index 0 la 4
    scores = scores.slice(0, 5);
    
    // Salvam scorurile actualizate
    saveHighScores(scores);
    
    // Actualizam afisajul
    displayHighScores();
    
    return scores;
}

// Functie care afiseaza scorurile pe pagina
function displayHighScores() {
    // Incarcam scorurile
    var scores = loadHighScores();
    
    // Gasim lista din HTML
    var scoresList = document.getElementById('scores-list');
    
    // Golim lista (stergem continutul anterior)
    scoresList.innerHTML = '';
    
    // Daca nu exista scoruri, afisam un mesaj
    if (scores.length === 0) {
        var li = document.createElement('li');
        li.textContent = 'Inca nu exista scoruri!';
        scoresList.appendChild(li);
        return;
    }
    
    // Parcurgem fiecare scor si cream un element <li> pentru el
    for (var i = 0; i < scores.length; i++) {
        var score = scores[i];
        
        // Cream elementul <li>
        var li = document.createElement('li');
        
        // Setam textul: "Nume - Scor puncte"
        li.textContent = score.name + ' - ' + score.score + ' puncte';
        
        // Adaugam elementul in lista
        scoresList.appendChild(li);
    }
    
    // Actualizam si high score-ul afisat in info
    if (scores.length > 0) {
        var highScoreElement = document.getElementById('high-score');
        highScoreElement.textContent = scores[0].score;
    }
}

// ============================================
// SECTIUNEA 11: GAME LOOP (BUCLA PRINCIPALA)
// ============================================

// Functia gameLoop este "inima" jocului
// Aceasta functie se apeleaza de aproximativ 60 de ori pe secunda
// Si actualizeaza si deseneaza tot ce se intampla in joc
function gameLoop() {
    // Verificam daca jocul este activ
    if (!gameRunning) {
        // Daca jocul nu ruleaza, nu facem nimic
        return;
    }
    
    // 1. Stergem tot ce este desenat pe canvas
    clearCanvas();
    
    // 2. Actualizam pozitia navei bazat pe input-ul jucatorului
    updateShip();
    
    // 3. Actualizam pozitia asteroizilor
    updateAsteroids();
    
    // 4. Actualizam pozitia rachetelor
    updateMissiles();
    
    // 5. Verificam coliziunile intre asteroizi
    checkAsteroidCollisions();
    
    // 6. Verificam coliziunile intre rachete si asteroizi
    checkMissileAsteroidCollisions();
    
    // 7. Verificam coliziunile intre nava si asteroizi
    checkShipAsteroidCollisions();
    
    // 8. Desenam toti asteroizii
    drawAsteroids();
    
    // 9. Desenam toate rachetele
    drawMissiles();
    
    // 10. Desenam nava in noua pozitie (desenam nava ultima pentru a fi deasupra asteroizilor)
    drawShip();
    
    // 11. Cerem browser-ului sa apeleze din nou gameLoop la urmatorul frame
    // Acesta este modul corect de a crea o animatie fluenta in JavaScript
    requestAnimationFrame(gameLoop);
}

// ============================================
// SECTIUNEA 12: FUNCTII DE CONTROL AL JOCULUI
// ============================================

// Functie care porneste jocul
function startGame() {
    console.log('Jocul a fost pornit!');
    
    // Setam gameRunning pe true
    gameRunning = true;
    
    // Resetam variabilele jocului
    score = 0;
    lives = 3;
    lastExtraLifeScore = 0;
    missiles = [];
    
    // Actualizam afisajul
    updateScoreDisplay();
    updateLivesDisplay();
    
    // Ascundem ecranul de start
    var startScreen = document.getElementById('start-screen');
    startScreen.style.display = 'none';
    
    // Ascundem ecranul de game over (daca este vizibil)
    var gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'none';
    
    // Resetam pozitia navei in centrul ecranului
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    ship.angle = -Math.PI / 2; // Orientare in sus
    
    // Cream asteroizii initiali
    createInitialAsteroids();
    
    // Pornim bucla principala a jocului
    gameLoop();
}

// Functie care respawn-eaza nava dupa o coliziune
function respawnShip() {
    console.log('Respawn nava! Vieti ramase:', lives);
    
    // Resetam pozitia navei in centru
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    ship.angle = -Math.PI / 2;
    
    // Stergem toate rachetele
    missiles = [];
    
    // Facem nava invulnerabila pentru 2 secunde (optional - implementat simplu)
    // Pentru simplitate, doar miscam asteroizii departe
    for (var i = 0; i < asteroids.length; i++) {
        var asteroid = asteroids[i];
        
        // Calculam distanta de la asteroid la nava
        var distance = calculateDistance(asteroid.x, asteroid.y, ship.x, ship.y);
        
        // Daca asteroidul este prea aproape, il mutam
        if (distance < 150) {
            // Mutam asteroidul la o pozitie aleatoare departe de nava
            asteroid.x = Math.random() * canvasWidth;
            asteroid.y = 50; // In partea de sus a ecranului
        }
    }
}

// Functie care se apeleaza cand jocul se termina
function gameOver() {
    console.log('GAME OVER! Scor final:', score);
    
    // Oprim jocul
    gameRunning = false;
    
    // Afisam scorul final
    var finalScoreElement = document.getElementById('final-score');
    finalScoreElement.textContent = score;
    
    // Resetam input-ul pentru nume
    var playerNameInput = document.getElementById('player-name');
    playerNameInput.value = '';
    
    // Afisam ecranul de game over
    var gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'block';
}

// Functie care salveaza scorul jucatorului
function savePlayerScore() {
    // Luam numele introdus de jucator
    var playerNameInput = document.getElementById('player-name');
    var playerName = playerNameInput.value.trim(); // trim() sterge spatiile de la inceput/sfarsit
    
    // Verificam daca jucatorul a introdus un nume
    if (playerName === '') {
        alert('Te rog introdu numele tau!');
        return;
    }
    
    // Adaugam scorul in localStorage
    addHighScore(playerName, score);
    
    console.log('Scor salvat pentru:', playerName, 'cu', score, 'puncte');
    
    // Ascundem butonul de salvare (pentru a preveni salvari multiple)
    var saveButton = document.getElementById('save-score-btn');
    saveButton.style.display = 'none';
    
    // Afisam mesaj de confirmare
    alert('Scorul tau a fost salvat!');
}

// ============================================
// SECTIUNEA 13: FUNCTIA PRINCIPALA DE SETUP
// ============================================

// Functie care initializeaza jocul
// Aceasta functie se apeleaza la incarcarea paginii
function initGame() {
    console.log('Jocul a fost initializat!');
    
    // Setam pozitia initiala a navei in centrul canvas-ului
    ship.x = canvasWidth / 2;  // Impartim latimea la 2 pentru centru
    ship.y = canvasHeight / 2; // Impartim inaltimea la 2 pentru centru
    
    // Afisam valorile initiale pe ecran
    updateScoreDisplay();
    updateLivesDisplay();
    
    // Incarcam si afisam scorurile salvate
    displayHighScores();
    
    // Configuram controalele touch
    setupTouchControls();
    
    // Desenam instructiuni pe canvas
    ctx.fillStyle = '#00ff00'; // Culoare verde
    ctx.font = '20px Arial';   // Fontul textului
    ctx.textAlign = 'center';  // Aliniere la centru
    ctx.fillText('Apasa SPACE pentru a incepe', canvasWidth / 2, canvasHeight / 2);
    
    console.log('Canvas width:', canvasWidth);
    console.log('Canvas height:', canvasHeight);
    console.log('Ship pozitie initiala:', ship.x, ship.y);
    
    // Adaugam event listener pentru butonul de restart
    var restartButton = document.getElementById('restart-btn');
    restartButton.addEventListener('click', function() {
        console.log('Restart joc');
        startGame();
    });
    
    // Adaugam event listener pentru butonul de salvare scor
    var saveScoreButton = document.getElementById('save-score-btn');
    saveScoreButton.addEventListener('click', function() {
        console.log('Salvare scor');
        savePlayerScore();
    });
}

// ============================================
// SECTIUNEA 14: APELAREA FUNCTIEI DE INITIALIZARE
// ============================================

// Asteptam ca intreaga pagina HTML sa se incarce
// Apoi apelam functia initGame pentru a incepe
window.addEventListener('load', function() {
    console.log('Pagina s-a incarcat complet');
    initGame();
});