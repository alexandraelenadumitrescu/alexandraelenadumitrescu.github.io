document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const checkButton = document.getElementById('checkButton');
    const resetButton = document.getElementById('resetButton');
    const guessSection = document.querySelector('.guess-section');
    const feedbackDiv = document.getElementById('feedback');
    const bloodTypeSelect = document.getElementById('bloodTypeSelect');
    const rhFactorSelect = document.getElementById('rhFactorSelect');

    const dropA = document.getElementById('dropA');
    const dropB = document.getElementById('dropB');
    const dropD = document.getElementById('dropD');

    let currentBloodType = {}; // Va stoca grupa sanguina generată aleatoriu

    // Definește regulile de aglutinare
    const agglutinationRules = {
        'A+': { A: true, B: false, D: true },
        'A-': { A: true, B: false, D: false },
        'B+': { A: false, B: true, D: true },
        'B-': { A: false, B: true, D: false },
        'AB+': { A: true, B: true, D: true },
        'AB-': { A: true, B: true, D: false },
        '0+': { A: false, B: false, D: true },
        '0-': { A: false, B: false, D: false }
    };

    function resetTest() {
        dropA.classList.remove('agglutinated');
        dropB.classList.remove('agglutinated');
        dropD.classList.remove('agglutinated');
        feedbackDiv.textContent = '';
        feedbackDiv.classList.remove('correct', 'incorrect');
        guessSection.style.display = 'none';
        startButton.style.display = 'block';
        resetButton.style.display = 'none';
        bloodTypeSelect.value = '';
        rhFactorSelect.value = '';
    }

    function startTest() {
        resetTest(); // Asigură-te că testul este curat la fiecare început
        startButton.style.display = 'none';
        guessSection.style.display = 'none'; // Ascunde secțiunea de ghicit până la finalizarea animației

        // Generează o grupă sanguină aleatorie
        const bloodTypes = Object.keys(agglutinationRules);
        const randomType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
        currentBloodType.full = randomType;
        currentBloodType.type = randomType.slice(0, -1);
        currentBloodType.rh = randomType.slice(-1) === '+' ? 'Pozitiv' : 'Negativ';

        const agglA = agglutinationRules[randomType].A;
        const agglB = agglut agglutinationRules[randomType].B;
        const agglD = agglutinationRules[randomType].D;

        // Animația de aglutinare
        setTimeout(() => {
            if (agglA) {
                dropA.classList.add('agglutinated');
            }
        }, 500); // Apare aglutinarea Anti-A după 0.5s

        setTimeout(() => {
            if (agglB) {
                dropB.classList.add('agglutinated');
            }
        }, 1500); // Apare aglutinarea Anti-B după 1.5s

        setTimeout(() => {
            if (agglD) {
                dropD.classList.add('agglutinated');
            }
            // După ce toate animațiile au rulat, afișează secțiunea de ghicit
            setTimeout(() => {
                guessSection.style.display = 'block';
            }, 1000); // Dă un timp suplimentar pentru a procesa ultimul efect
        }, 2500); // Apare aglutinarea Anti-D după 2.5s
    }

    function checkAnswer() {
        const userBloodType = bloodTypeSelect.value;
        const userRhFactor = rhFactorSelect.value;

        if (!userBloodType || !userRhFactor) {
            feedbackDiv.textContent = 'Te rog, alege atât grupa sanguină, cât și factorul Rh!';
            feedbackDiv.className = 'feedback incorrect';
            return;
        }

        const guessedFullType = userBloodType + (userRhFactor === 'Pozitiv' ? '+' : '-');

        if (guessedFullType === currentBloodType.full) {
            feedbackDiv.textContent = `Corect! Grupa sanguină este ${currentBloodType.type}${currentBloodType.rh === 'Pozitiv' ? '+' : '-'}.`;
            feedbackDiv.className = 'feedback correct';
        } else {
            feedbackDiv.textContent = `Incorect. Grupa sanguină este ${currentBloodType.type}${currentBloodType.rh === 'Pozitiv' ? '+' : '-'}. Ai ghicit ${userBloodType}${userRhFactor === 'Pozitiv' ? '+' : '-'}.`;
            feedbackDiv.className = 'feedback incorrect';
        }
        resetButton.style.display = 'block';
    }

    startButton.addEventListener('click', startTest);
    checkButton.addEventListener('click', checkAnswer);
    resetButton.addEventListener('click', resetTest);

    resetTest(); // Inițializează jocul la încărcare
});