document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const navButtons = document.querySelectorAll('.nav-btn');
    const disclaimer = document.querySelector('.medical-disclaimer');
    const acceptBtn = document.getElementById('accept-disclaimer');

    // Disclaimer Logic
    if (disclaimer && localStorage.getItem('disclaimerAccepted') === 'true') {
        disclaimer.style.display = 'none';
    }

    if (acceptBtn && disclaimer) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('disclaimerAccepted', 'true');
            disclaimer.style.opacity = '0';
            setTimeout(() => disclaimer.style.display = 'none', 500);
        });
    }

    // Multi-page Initialization Routing
    // Instead of switching views, we detect what page we are on by checking for unique DOM elements
    if (document.getElementById('progressionChart')) {
        initializeDashboardCharts();
    }

    if (document.getElementById('hair-layer')) {
        initializeHairAnimation();
    }

    if (document.getElementById('webcam-video')) {
        initializeScanner();
    }

    if (document.getElementById('root-cause-ui')) {
        initializeTools();
    }

    if (document.getElementById('chat-history') && typeof initializeChatbot === 'function') {
        initializeChatbot();
    }
});

async function initializeDashboardCharts() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/health-metrics');
        if (response.ok) {
            const data = await response.json();

            // Update the DOM elements with fetched data
            const percentElement = document.querySelector('.percentage');
            if (percentElement) percentElement.textContent = data.overall_score;

            const stats = document.querySelectorAll('.stat-value');
            if (stats.length >= 2) {
                stats[0].textContent = data.hydration;
                stats[1].textContent = data.streak_days + " Days";
            }

            // Only attempt if canvas exists
            const ctx = document.getElementById('progressionChart');
            if (!ctx) return;

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                    datasets: [{
                        label: 'Hair Health Score',
                        data: data.progression,
                        borderColor: '#0d9488', // Teal accent
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#0d9488',
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleFont: { family: 'Inter', size: 14 },
                            bodyFont: { family: 'Inter', size: 14 },
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 50,
                            max: 100,
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            ticks: { color: '#64748b', font: { family: 'Inter' } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#64748b', font: { family: 'Inter' } }
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.error("Backend fetch error:", err);
    }
}

function initializeHairAnimation() {
    const playBtn = document.getElementById('play-animation');
    const playText = document.getElementById('play-text');
    const playIcon = document.querySelector('.play-icon');
    const hairLayer = document.getElementById('hair-layer');
    const progressBar = document.getElementById('anim-progress');
    const stageLabels = document.querySelectorAll('#stage-labels span');

    if (!playBtn || !hairLayer) return;

    let isPlaying = false;
    let animInterval;
    let animProgress = 0; // 0 to 100

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseAnimation();
        } else {
            if (animProgress >= 100) resetAnimation();
            playAnimation();
        }
    });

    function playAnimation() {
        isPlaying = true;
        playText.textContent = "Pause Animation";
        playIcon.textContent = "⏸";

        animInterval = setInterval(() => {
            animProgress += 0.5; // Controls speed (~200 intervals = 10s playback)
            if (animProgress >= 100) {
                animProgress = 100;
                pauseAnimation();
                playText.textContent = "Replay Animation";
                playIcon.textContent = "↺";
            }
            updateAnimationState(animProgress);
        }, 50);
    }

    function pauseAnimation() {
        isPlaying = false;
        clearInterval(animInterval);
        if (animProgress < 100) {
            playText.textContent = "Resume Animation";
            playIcon.textContent = "▶";
        }
    }

    function resetAnimation() {
        animProgress = 0;
        updateAnimationState(0);
    }

    function updateAnimationState(progress) {
        progressBar.style.width = `${progress}%`;

        let currentStage = 1;
        if (progress >= 75) currentStage = 4;
        else if (progress >= 50) currentStage = 3;
        else if (progress >= 25) currentStage = 2;

        hairLayer.setAttribute('class', `head-svg stage-${currentStage}`);

        stageLabels.forEach((label, index) => {
            if (index + 1 === currentStage) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }
}

let currentStream = null;

function initializeScanner() {
    const btnCamera = document.getElementById('btn-camera');
    const btnCapture = document.getElementById('btn-capture');
    const imgUpload = document.getElementById('img-upload');
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('snapshot-canvas');
    const placeholder = document.getElementById('scanner-placeholder');
    const resultsDiv = document.getElementById('analysis-results');

    if (!btnCamera) return;

    btnCamera.addEventListener('click', async () => {
        if (currentStream) {
            stopCamera();
            btnCamera.querySelector('span').textContent = 'Open Camera';
            btnCapture.style.display = 'none';
        } else {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                video.srcObject = currentStream;
                video.style.display = 'block';
                placeholder.style.display = 'none';
                canvas.style.display = 'none';
                resultsDiv.style.display = 'none';

                btnCamera.querySelector('span').textContent = 'Close Camera';
                btnCapture.style.display = 'inline-block';
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Could not access camera. Please check permissions.");
            }
        }
    });

    btnCapture.addEventListener('click', () => {
        if (!currentStream) return;

        // Take Snapshot
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

        // Hide video, show snapshot
        video.style.display = 'none';
        canvas.style.display = 'block';

        stopCamera();
        btnCamera.querySelector('span').textContent = 'Retake';
        btnCapture.style.display = 'none';

        simulateAnalysis();
    });

    imgUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

                    if (currentStream) stopCamera();
                    video.style.display = 'none';
                    placeholder.style.display = 'none';
                    canvas.style.display = 'block';

                    btnCamera.querySelector('span').textContent = 'Open Camera';
                    btnCapture.style.display = 'none';

                    simulateAnalysis();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
    }

    function simulateAnalysis() {
        resultsDiv.style.display = 'block';
        document.getElementById('res-condition').textContent = 'Analyzing...';
        document.getElementById('res-confidence').textContent = '--';
        document.getElementById('res-progress').style.width = '0%';
        document.getElementById('res-recommendation').textContent = '...';

        // Mock API Call delay
        setTimeout(() => {
            const conditions = ['Stage 2 Thinning (Mild)', 'Healthy Scalp', 'Excessive Sebum detected'];
            const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
            const conf = Math.floor(Math.random() * 15) + 80; // 80 - 95%

            document.getElementById('res-condition').textContent = randomCondition;
            document.getElementById('res-confidence').textContent = conf;
            document.getElementById('res-progress').style.width = conf + '%';

            if (randomCondition.includes('Healthy')) {
                document.getElementById('res-recommendation').textContent = 'Keep up your current routine!';
            } else if (randomCondition.includes('Sebum')) {
                document.getElementById('res-recommendation').textContent = 'Consider a clarifying shampoo 1-2 times a week.';
            } else {
                document.getElementById('res-recommendation').textContent = 'Apply Minoxidil 5% daily to the affected areas.';
            }
        }, 2000);
    }
}

function initializeChatbot() {
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const suggestionBtns = document.querySelectorAll('.badge-btn');

    if (!chatHistory) return;

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

        const p = document.createElement('p');
        p.textContent = text;
        msgDiv.appendChild(p);

        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async function handleSend(customText = null) {
        const text = customText || chatInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        chatInput.value = '';

        // Hide suggestions after first interaction
        document.getElementById('chat-suggestions').style.display = 'none';

        // Add a temporary typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing';
        typingDiv.innerHTML = '<p>...</p>';
        chatHistory.appendChild(typingDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Mock AI response
        setTimeout(() => {
            chatHistory.removeChild(typingDiv);

            let response = "That's an excellent question. ";
            if (text.toLowerCase().includes('thinning')) {
                response += "Hair thinning can be caused by genetics (Androgenetic Alopecia), stress, or nutritional deficiencies. I recommend getting a blood panel for Vitamin D, Iron, and Thyroid function.";
            } else if (text.toLowerCase().includes('minoxidil')) {
                response += "Minoxidil is an FDA-approved topical treatment that is generally safe for most people. It works by prolonging the anagen (growth) phase of hair follicles. Side effects are rare but can include scalp irritation.";
            } else if (text.toLowerCase().includes('diet')) {
                response += "A diet rich in protein, Omega-3 fatty acids, iron, and zinc is crucial. Foods like salmon, eggs, spinach, and nuts are excellent for supporting hair growth.";
            } else {
                response += "Based on my current knowledge base, I suggest monitoring your daily habits. Are you experiencing any stress recently? Consistency in your routine is key.";
            }

            addMessage(response, false);
        }, 1500);
    }

    sendBtn.addEventListener('click', () => handleSend());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            handleSend(btn.textContent);
        });
    });
}

function initializeTools() {
    const btnRoot = document.getElementById('btn-analyze-root');
    const resRoot = document.getElementById('root-cause-results');

    if (btnRoot && resRoot) {
        btnRoot.addEventListener('click', () => {
            btnRoot.textContent = 'Analyzing lifestyle data...';
            btnRoot.disabled = true;

            setTimeout(() => {
                btnRoot.style.display = 'none';
                resRoot.style.display = 'block';
            }, 1500);
        });
    }

    const btnIng = document.getElementById('btn-analyze-ing');
    const inputIng = document.getElementById('ingredient-input');
    const resIng = document.getElementById('ingredient-results');
    const scoreVal = document.getElementById('safety-score-val');
    const listIng = document.getElementById('detected-ingredients');

    if (btnIng && inputIng && resIng) {
        btnIng.addEventListener('click', () => {
            const text = inputIng.value.toLowerCase();
            if (!text.trim()) return;

            btnIng.textContent = 'Scanning Database...';
            btnIng.disabled = true;

            setTimeout(() => {
                resIng.style.display = 'block';
                listIng.innerHTML = '';
                btnIng.textContent = 'Analyze Again';
                btnIng.disabled = false;

                let score = 100;
                let flags = [];

                if (text.includes('sulfate')) {
                    flags.push({ name: 'Sulfates', desc: 'Can strip natural oils and irritate scalp.', bad: true });
                    score -= 30;
                }
                if (text.includes('dimethicone') || text.includes('silicone')) {
                    flags.push({ name: 'Silicones', desc: 'Can cause buildup preventing moisture penetration.', bad: true });
                    score -= 20;
                }
                if (text.includes('alcohol denat') || text.includes('isopropyl alcohol')) {
                    flags.push({ name: 'Drying Alcohols', desc: 'Extremely stripping for textured hair.', bad: true });
                    score -= 25;
                }
                if (text.includes('argan oil') || text.includes('jojoba')) {
                    flags.push({ name: 'Nourishing Oils', desc: 'Great for sealing in moisture.', bad: false });
                    score += 5;
                }
                if (flags.length === 0) {
                    flags.push({ name: 'Clean Formualtion', desc: 'No major harsh chemicals detected based on our basic database.', bad: false });
                }

                score = Math.min(Math.max(score, 0), 100);
                scoreVal.textContent = `${score}/100`;
                scoreVal.className = `text-2xl font-bold ${score > 70 ? 'target-good' : score > 40 ? 'text-warning' : 'text-danger'}`;

                flags.forEach(f => {
                    const li = document.createElement('li');
                    li.className = `mt-2 p-2 rounded ${f.bad ? 'bg-danger-light' : 'bg-success-light'}`;
                    li.innerHTML = `<strong>${f.bad ? '⚠️' : '✅'} ${f.name}</strong>: <span class="text-sm text-muted">${f.desc}</span>`;
                    listIng.appendChild(li);
                });

            }, 1200);
        });
    }
}
