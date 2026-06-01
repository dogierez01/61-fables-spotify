const splash = document.getElementById('splash-screen'), instr = document.getElementById('instructions-screen'),
      app = document.getElementById('main-app'), grid = document.getElementById('stations-grid'),
      playerZone = document.getElementById('player-zone'), audio = document.getElementById('audio-player'),
      transcript = document.getElementById('transcript-box'), popup = document.getElementById('translation-popup'),
      gameZone = document.getElementById('game-zone'), gameBoard = document.getElementById('game-board'),
      feedbackArea = document.getElementById('quiz-feedback-area'), ptsVal = document.getElementById('points-val'),
      comicModal = document.getElementById('comic-modal'), comicImg = document.getElementById('comic-img'),
      modalClose = document.getElementById('modal-close'), zoomContainer = document.getElementById('zoom-container');

let lifetimeScore = parseInt(localStorage.getItem('fablesScore')) || 0;
let completedLessons = [];

try {
    completedLessons = JSON.parse(localStorage.getItem('completedFablesLessons')) || [];
} catch (e) {
    completedLessons = [];
}

if(ptsVal) ptsVal.innerText = lifetimeScore;

let wordBucket = []; let currentQ = 0; let attempts = 0; let totalScore = 0; let firstCard = null;

function renderGrid() {
    grid.innerHTML = "";
    stations.forEach((s, i) => {
        const btn = document.createElement('div'); btn.className = 'station-tile';
        if(completedLessons.includes(s.file)) btn.classList.add('completed');
        btn.innerHTML = `<b>${i + 1}</b> ${s.title.replace(/^\d+\.\s*/, "")}`;
        btn.onclick = () => { 
            grid.classList.add('hidden'); playerZone.classList.remove('hidden'); 
            document.getElementById('now-playing-title').innerText = s.title; 
            audio.src = s.file; wordBucket = []; 
        };
        grid.appendChild(btn);
    });
}

if (typeof stations !== 'undefined') {
    renderGrid();
} else {
    alert("CRITICAL ERROR: data.js is broken or cut off. Please restore your original working data.js file.");
}

document.getElementById('btn-back').onclick = () => {
    audio.pause(); audio.currentTime = 0;
    playerZone.classList.add('hidden');
    transcript.classList.add('hidden');
    gameZone.classList.add('hidden');
    grid.classList.remove('hidden');
    currentQ = 0; attempts = 0;
};

// --- IMAGE FIXES ---
document.getElementById('btn-comic').onclick = () => {
    const currentFile = decodeURIComponent(audio.src.split('/').pop());
    
    if (typeof stations === 'undefined') return;
    const station = stations.find(s => s.file === currentFile);
    
    if (station) {
        let imageName = station.title.replace(/^\d+\.\s*/, "") + ".png";
        
        if (station.file === "07_CamelTent.mp3") imageName = "The Camel and the Tent.png";
        if (station.file === "09_CrowPeacock.mp3") imageName = "The Crow and the Peacock Feathers.png";
        if (station.file === "60_WolfSheep.mp3") imageName = "The Wolf in Sheep's Clothing.png";
        
        comicImg.src = imageName;
        comicModal.classList.remove('hidden');
        resetZoom();
    }
};

modalClose.onclick = () => { comicModal.classList.add('hidden'); };

// --- ZOOM AND PAN LOGIC ---
let scale = 1, lastScale = 1, startDist = 0;
let translateX = 0, translateY = 0, lastTranslateX = 0, lastTranslateY = 0;
let startX = 0, startY = 0;

zoomContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        startX = e.touches[0].pageX - lastTranslateX;
        startY = e.touches[0].pageY - lastTranslateY;
    } else if (e.touches.length === 2) {
        startDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
    }
}, { passive: false });

zoomContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        translateX = e.touches[0].pageX - startX;
        translateY = e.touches[0].pageY - startY;
    } else if (e.touches.length === 2) {
        let dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        scale = Math.min(Math.max(1, lastScale * (dist / startDist)), 4);
    }
    comicImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}, { passive: false });

zoomContainer.addEventListener('touchend', () => {
    lastScale = scale;
    lastTranslateX = translateX;
    lastTranslateY = translateY;
});

function resetZoom() {
    scale = 1; lastScale = 1;
    translateX = 0; translateY = 0; lastTranslateX = 0; lastTranslateY = 0;
    comicImg.style.transform = `translate(0px, 0px) scale(1)`;
}

document.getElementById('btn-start').onclick = () => { splash.classList.add('hidden'); instr.classList.remove('hidden'); };
document.getElementById('btn-enter').onclick = () => { instr.classList.add('hidden'); app.classList.remove('hidden'); };

document.getElementById('ctrl-play').onclick = () => audio.play();
document.getElementById('ctrl-pause').onclick = () => audio.pause();
document.getElementById('ctrl-stop').onclick = () => { audio.pause(); audio.currentTime = 0; };
document.getElementById('btn-blind').onclick = () => { transcript.classList.add('hidden'); gameZone.classList.add('hidden'); audio.play(); };

document.getElementById('btn-read').onclick = () => {
    let fn = decodeURIComponent(audio.src.split('/').pop()); 
    const data = lessonData[fn][0];
    transcript.classList.remove('hidden'); gameZone.classList.add('hidden'); transcript.innerHTML = "";
    data.text.split(" ").forEach(w => {
        const span = document.createElement('span'); 
        const clean = w.toLowerCase().replace(/[^a-z0-9ğüşöçı]/gi, "");
        span.innerText = w + " "; span.className = "clickable-word";
        span.onclick = (e) => {
            const tr = data.dict[clean];
            if(tr) {
                if (!wordBucket.some(p => p.en === clean)) wordBucket.push({en: clean, tr: tr});
                popup.innerText = tr; popup.style.left = `${e.clientX}px`; popup.style.top = `${e.clientY - 50}px`;
                popup.classList.remove('hidden'); setTimeout(() => popup.classList.add('hidden'), 2000);
            }
        };
        transcript.appendChild(span);
    });
    audio.play();
};

document.getElementById('btn-game').onclick = () => {
    let fn = decodeURIComponent(audio.src.split('/').pop()); 
    const lesson = lessonData[fn][0];
    transcript.classList.add('hidden'); gameZone.classList.remove('hidden'); feedbackArea.innerHTML = "";
    gameBoard.innerHTML = ""; firstCard = null; gameBoard.style.display = "grid";
    let set = [...wordBucket];
    for (let k in lesson.dict) { if (set.length >= 8) break; if (!set.some(p => p.en === k)) set.push({en: k, tr: lesson.dict[k]}); }
    let deck = [];
    set.forEach(p => { deck.push({text: p.en, match: p.tr}); deck.push({text: p.tr, match: p.en}); });
    deck.sort(() => Math.random() - 0.5);
    deck.forEach(card => {
        const div = document.createElement('div'); div.className = 'game-card'; div.innerText = card.text;
        div.onclick = () => {
            if (div.classList.contains('correct') || div.classList.contains('selected')) return;
            if (firstCard) {
                if (firstCard.innerText === card.match) {
                    div.classList.add('correct'); firstCard.classList.add('correct'); firstCard = null;
                } else {
                    div.classList.add('wrong'); setTimeout(() => { div.classList.remove('wrong'); firstCard.classList.remove('selected'); firstCard = null; }, 500);
                }
            } else { firstCard = div; div.classList.add('selected'); }
        };
        gameBoard.appendChild(div);
    });
};

document.getElementById('btn-bowling').onclick = () => {
    let fn = decodeURIComponent(audio.src.split('/').pop()); 
    const lesson = lessonData[fn][0];
    transcript.classList.add('hidden'); gameZone.classList.remove('hidden'); gameBoard.style.display = "none";
    currentQ = 0; totalScore = 0; attempts = 0;
    runQuiz(lesson);
};

// --- NEW TRUE/FALSE QUIZ LOGIC ---
function runQuiz(lesson) {
    if (currentQ >= 7) { finishQuiz(); return; }
    const qData = lesson.questions[currentQ];
    const storyNum = parseInt(decodeURIComponent(audio.src.split('/').pop()).substring(0,2));
    
    // New UI with True/False buttons
    feedbackArea.innerHTML = `
        <div id="quiz-container">
            <div class="score-badge">SCORE: ${totalScore} | Q: ${currentQ+1}/7</div>
            <button id="btn-hear-q" class="mode-btn neon-green">👂 LISTEN TO QUESTION</button>
            
            <div id="tf-box" class="hidden" style="margin-top:20px; display: flex; gap: 15px; justify-content: center;">
                <button id="btn-true" class="action-btn-large" style="background-color: #39ff14; color: black; min-width: 120px;">TRUE</button>
                <button id="btn-false" class="action-btn-large" style="background-color: #ff0055; color: white; min-width: 120px;">FALSE</button>
            </div>
            
            <div id="res-area"></div>
        </div>`;

    document.getElementById('btn-hear-q').onclick = () => {
        const utter = new SpeechSynthesisUtterance(qData.q);
        utter.lang = 'en-US';
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let v = voices.find(v => (v.name.includes(storyNum % 2 !== 0 ? "Female" : "Male")) && v.lang.startsWith('en'));
            utter.voice = v || voices.find(v => v.lang.startsWith('en')) || voices[0];
        }
        
        // Show True/False buttons after audio finishes
        utter.onend = () => { document.getElementById('tf-box').classList.remove('hidden'); };
        window.speechSynthesis.speak(utter);
    };

    // Central function to check the answer
    function checkAnswer(userChoiceIsTrue) {
        document.getElementById('tf-box').classList.add('hidden');
        
        // The data.js uses "Yes" or "No". We convert that to true/false logic.
        const correctAnswerIsTrue = qData.a_en.toLowerCase().includes("yes");
        
        if (userChoiceIsTrue === correctAnswerIsTrue) {
            let pts = (attempts === 0) ? 20 : 15; 
            totalScore += pts;
            showResult(true, pts === 20 ? "STRIKE! (+20)" : "SPARE! (+15)", qData, lesson);
        } else {
            attempts++;
            if (attempts === 1) showResult(false, "MISS! TRY AGAIN", qData, lesson, true);
            else showResult(false, "MISS! (0 pts)", qData, lesson, false);
        }
    }

    // Attach logic to the new buttons
    document.getElementById('btn-true').onclick = () => checkAnswer(true);
    document.getElementById('btn-false').onclick = () => checkAnswer(false);
}

function showResult(isCorrect, msg, qData, lesson, canRetry = false) {
    const area = document.getElementById('res-area');
    area.innerHTML = `<h1 style="color:${isCorrect?'#39ff14':'#f44'}; font-size: 50px;">${msg}</h1>`;
    
    if (isCorrect || !canRetry) {
        area.innerHTML += `<p class="quiz-q-text">Q: ${qData.q}</p><p class="quiz-a-text">EN: ${qData.a_en}</p><p style="color:#888; font-size:30px; font-weight: bold;">TR: ${qData.a_tr}</p><button id="btn-nxt" class="action-btn-large">NEXT QUESTION ⮕</button>`;
        document.getElementById('btn-nxt').onclick = () => { currentQ++; attempts = 0; runQuiz(lesson); };
    } else {
        area.innerHTML += `<button id="btn-retry" class="action-btn-large">RETRY FOR SPARE</button>`;
        document.getElementById('btn-retry').onclick = () => { 
            area.innerHTML = ""; 
            document.getElementById('tf-box').classList.remove('hidden'); 
        };
    }
}

function finishQuiz() {
    lifetimeScore += totalScore; localStorage.setItem('fablesScore', lifetimeScore);
    const fn = decodeURIComponent(audio.src.split('/').pop());
    if(!completedLessons.includes(fn)) { 
        completedLessons.push(fn); 
        localStorage.setItem('completedFablesLessons', JSON.stringify(completedLessons)); 
    }
    renderGrid();
    feedbackArea.innerHTML = `<h1 style="color:#ccff00; font-size: 60px;">FINISHED!</h1><h2 style="font-size: 40px;">QUIZ SCORE: ${totalScore}</h2><button id="btn-done" class="action-btn-large">SAVE & RETURN</button>`;
    document.getElementById('btn-done').onclick = () => {
        playerZone.classList.add('hidden');
        grid.classList.remove('hidden');
    };
}
