const socket = io();

// State
let myId = null;
let myRole = null;
let gameState = null; // Whole state object
let selectedMeans = null;
let selectedEvidence = null;

// Note & Accuse State
let notedCards = {}; // { cardValue: true }
let accusedMeans = null;
let accusedEvidence = null;
let accusedPlayerId = null;

// Elements
const screens = {
    login: document.getElementById('login-screen'),
    lobby: document.getElementById('lobby-screen'),
    role: document.getElementById('role-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen')
};

const dom = {
    username: document.getElementById('username'),
    btnJoin: document.getElementById('btn-join'),
    playerList: document.getElementById('player-list'),
    btnReady: document.getElementById('btn-ready'),
    btnStart: document.getElementById('btn-start'),
    adminControls: document.getElementById('admin-controls'),
    chkAccomplice: document.getElementById('chk-accomplice'),
    chkWitness: document.getElementById('chk-witness'),
    waitMsg: document.getElementById('wait-msg'),

    myRoleDisplay: document.getElementById('role-display'),
    roundDisplay: document.getElementById('round-display'),
    badgeDisplay: document.getElementById('badge-display'),
    scientistPanel: document.getElementById('scientist-panel'),
    tilesContainer: document.getElementById('tiles-container'),
    publicTilesContainer: document.getElementById('public-tiles-container'),
    otherPlayers: document.getElementById('other-players'),
    actionBar: document.getElementById('action-bar'),
    btnCommit: document.getElementById('btn-commit-crime'),
    chatInput: document.getElementById('chat-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    chatMessages: document.getElementById('chat-messages'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalDesc: document.getElementById('modal-desc'),
    btnConfirm: document.getElementById('btn-confirm-action'),
    btnCancel: document.getElementById('btn-cancel-action')
};

// Utils
function showScreen(screenId) {
    Object.values(screens).forEach(s => {
        if (s) s.classList.add('hidden');
    });
    if (screens[screenId]) screens[screenId].classList.remove('hidden');
}

// Join
dom.btnJoin.addEventListener('click', () => {
    const name = dom.username.value;
    if (name) {
        socket.emit('join_game', name);
        showScreen('lobby');
    }
});

dom.btnReady.addEventListener('click', () => {
    socket.emit('set_ready', true);
    dom.btnReady.disabled = true;
    dom.btnReady.innerText = "Đã Sẵn Sàng!";
});

dom.btnStart.addEventListener('click', () => {
    const config = {
        useAccomplice: dom.chkAccomplice.checked,
        useWitness: dom.chkWitness.checked
    };
    socket.emit('start_game', config);
});

// Start listening for chat
dom.btnSendChat.addEventListener('click', sendChat);
dom.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChat();
});

function sendChat() {
    const txt = dom.chatInput.value.trim();
    if (txt) {
        socket.emit('chat_message', txt);
        dom.chatInput.value = '';
    }
}

// Commit Crime Button
dom.btnCommit.addEventListener('click', () => {
    if (selectedMeans && selectedEvidence) {
        if (confirm(`Xác nhận gây án với ${selectedMeans} và ${selectedEvidence}?`)) {
            socket.emit('select_crime', { means: selectedMeans, evidence: selectedEvidence });
            dom.actionBar.classList.add('hidden'); // Hide button
        }
    } else {
        alert("Bạn phải chọn đủ 1 Hung Khí và 1 Vật Chứng!");
    }
});

// Socket Events
socket.on('connect', () => {
    console.log("Connected to server. Socket ID:", socket.id);
    myId = socket.id;
});

socket.on('log_add', (entry) => {
    addLogEntry(entry);
});

socket.on('reaction_show', (data) => {
    showReaction(data);
});

socket.on('state_update', (state) => {
    // console.log("Received State Update:", state);
    gameState = state; // Store it

    try {
        render(state);
    } catch (e) {
        console.error("Render Error:", e);
    }
});

socket.on('guess_result', (result) => {
    if (!result.success) {
        alert("Phá án SAI! Bạn bị mất Phù Hiệu cảnh sát.");
    }
});

socket.on('chat_message', (msg) => {
    const div = document.createElement('div');
    if (msg.type === 'system') {
        div.className = 'system';
    } else {
        const isSelf = msg.id === myId;
        div.className = isSelf ? 'self' : '';
    }
    div.innerHTML = msg.type === 'system'
        ? msg.text
        : `<strong>${msg.name}</strong>: ${msg.text}`;
    dom.chatMessages.appendChild(div);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
});

socket.on('timer_start', (timer) => {
    startLocalTimer(timer);
});

socket.on('play_sound', (soundName) => {
    playSound(soundName);
});

// --- AUDIO ---
const sounds = {
    bgm: new Audio('https://actions.google.com/sounds/v1/ambiences/creaky_wooden_floor.ogg'), // Placeholder
    clue: new Audio('https://actions.google.com/sounds/v1/tools/switch_click.ogg'),
    win: new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'), // Placeholder
    lose: new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
    accuse_fail: new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_cowbell.ogg')
};

// Set volumes
Object.values(sounds).forEach(s => s.volume = 0.5);

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(e => console.warn("Audio play failed (interaction needed):", e));
    }
}

// --- TIMER ---
let timerInterval = null;
function startLocalTimer(timer) {
    if (timerInterval) clearInterval(timerInterval);
    const display = document.getElementById('timer-display'); // Need to add to HTML

    if (!display) {
        // Create if needed or assume user adds to HTML. 
        // For now, let's inject it into role display if missing
        const container = document.getElementById('game-info-bar'); // Assuming specific ID or just put in body
    }

    const update = () => {
        const timeLeft = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const text = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        const el = document.getElementById('timer-val') || createTimerElement();
        el.innerText = text;

        if (timeLeft < 10) el.style.color = 'red';
        else el.style.color = 'white';

        if (timeLeft <= 0) clearInterval(timerInterval);
    };

    update();
    timerInterval = setInterval(update, 1000);
}

function createTimerElement() {
    const d = document.createElement('div');
    d.id = 'timer-val';
    d.style.fontSize = '2em';
    d.style.fontWeight = 'bold';
    d.style.position = 'fixed';
    d.style.top = '10px';
    d.style.right = '10px';
    d.style.background = 'rgba(0,0,0,0.5)';
    d.style.padding = '5px 10px';
    d.style.borderRadius = '5px';
    d.style.zIndex = '2000'; // High z-index to stay on top
    document.body.appendChild(d);
    return d;
}

// Rendering Wrapper
function render(state) {
    // console.log("Rendering state...", state.gameState);

    // 1. Lobby Logic
    if (state.gameState === 'LOBBY') {
        renderLobby(state);
    } else {
        // NON-LOBBY States

        // Find self
        const me = state.players.find(p => p.id === myId);
        if (!me) return;

        myRole = me.role;

        if (screens.game && screens.game.classList.contains('hidden')) {
            console.log("Transitioning to GAME SCREEN");
            showScreen('game');
        }

        dom.myRoleDisplay.innerText = `Vai: ${myRole}`;
        dom.roundDisplay.innerText = `Vòng: ${state.round}`;
        dom.badgeDisplay.innerText = `Phá Án: ${me.badges > 0 ? 'Còn' : 'Hết'}`;

        // Render Board
        renderTiles(state);
        renderSuspects(state);
        renderSuspicionBoard(state); // New Sidebar Component

        // Story Panel (Scientist)
        if (myRole === 'Pháp Y' && state.gameState === 'INVESTIGATION' && state.solution && state.solution.story) {
            renderStoryPanel(state.solution);
        }

        // Commit Button (Murderer in Phase 1)
        if (myRole === 'Hung Thủ' && state.gameState === 'CRIME_SELECTION') {
            dom.actionBar.classList.remove('hidden');
        } else {
            dom.actionBar.classList.add('hidden');
        }

        // --- WITNESS GUESS PHASE ---
        if (state.gameState === 'WITNESS_GUESS') {
            // Murderer sees ALERT
            if (myRole === 'Hung Thủ') {
                dom.myRoleDisplay.innerText = "CHỌN NHÂN CHỨNG NGAY!";
                dom.myRoleDisplay.style.color = "red";
                dom.myRoleDisplay.style.fontWeight = "bold";
            } else {
                dom.myRoleDisplay.innerText = "HUNG THỦ ĐANG TÌM NHÂN CHỨNG...";
            }
        }

        // --- FINAL CHANCE PHASE ---
        if (state.gameState === 'FINAL_CHANCE') {
            dom.roundDisplay.innerText = "VÒNG CUỐI!";
            dom.roundDisplay.style.color = "red";
            dom.roundDisplay.classList.add('pulse'); // Reuse the pulse anim if possible or just style

            // Show alert overlay if not already shown? Or just rely on header
            const header = document.querySelector('header');
            if (header) header.style.borderBottomColor = 'red';

            dom.myRoleDisplay.innerHTML = `<span style="color:red">⚠️ CƠ HỘI CUỐI: 30S ĐỂ TỐ CÁO! ⚠️</span>`;
        } else {
            const header = document.querySelector('header');
            if (header) header.style.borderBottomColor = '#333';
        }
    }

    // 3. Game Over
    if (state.gameState === 'GAME_OVER') {
        showScreen('gameOver');
        populateGameOver(state);
    }
}

// Sub-renderers

function renderLobby(state) {
    dom.playerList.innerHTML = '';
    const players = state.players;
    const ripeCount = players.length;

    // Check Admin
    const isAdmin = (myId === state.adminId);

    const lobbyHeader = document.querySelector('#lobby-screen h1');
    if (lobbyHeader) lobbyHeader.innerText = `Phòng Chờ (${ripeCount}/10)`;

    // Render Players
    players.forEach(p => {
        const div = document.createElement('div');
        div.className = `player-card ${p.isReady ? 'ready' : ''}`;
        let roleText = '';
        if (p.id === state.adminId) roleText = '👑 ';

        div.innerText = `${roleText}${p.name} ${p.id === myId ? '(Bạn)' : ''}\n${p.isReady ? 'SẴN SÀNG' : '...'}`;
        dom.playerList.appendChild(div);
    });

    // START BUTTON: Only for Admin
    if (isAdmin) {
        dom.adminControls.classList.remove('hidden');
        dom.waitMsg.classList.add('hidden');

        // LOBBY START
        if (state.gameState === 'LOBBY') {
            if (ripeCount >= 4) {
                dom.btnStart.disabled = false;
                dom.btnStart.innerText = "Bắt Đầu Game";
                dom.btnStart.classList.remove('hidden');
                dom.btnStart.style.background = "linear-gradient(45deg, #e74c3c, #c0392b)";
            } else {
                dom.btnStart.disabled = true;
                dom.btnStart.innerText = `Cần 4+ người (Hiện: ${ripeCount})`;
                dom.btnStart.classList.remove('hidden');
            }
        }
    } else {
        // Non-admin
        dom.adminControls.classList.add('hidden');
        dom.btnStart.classList.add('hidden');
        dom.waitMsg.classList.remove('hidden');
    }
}

// Helper to inject Next Round button outside of Lobby
function renderAdminGameControls(state) {
    // Allow Admin OR Scientist to advance round
    const isScientist = (myRole === 'Pháp Y');
    const isAdmin = (myId === state.adminId);

    if (!isAdmin && !isScientist) return;

    // Check if we need to show "Next Round" button
    // Check if we need to show "Next Round" button
    // Strategy 3: Inject into Main Header (.game-info) - The most stable place
    const gameInfo = document.querySelector('.game-info');

    // Debug Log
    console.log("Checking Next Round Button:", {
        role: myRole,
        state: state.gameState,
        round: state.round,
        isAdmin: isAdmin,
        headerFound: !!gameInfo
    });

    if (state.gameState === 'INVESTIGATION' && state.round < 3 && gameInfo) {
        let btnNext = document.getElementById('btn-next-round');
        if (!btnNext) {
            btnNext = document.createElement('button');
            btnNext.id = 'btn-next-round';
            // btnNext.className = 'admin-btn'; // Conflict with header styles?
            btnNext.innerHTML = "Qua Vòng Tiếp &raquo;";

            // Header Button Styles
            btnNext.style.marginLeft = '20px';
            btnNext.style.fontSize = '0.9rem';
            btnNext.style.padding = '5px 15px';
            btnNext.style.background = '#2ecc71';
            btnNext.style.color = '#fff';
            btnNext.style.border = 'none';
            btnNext.style.borderRadius = '4px';
            btnNext.style.cursor = 'pointer';
            btnNext.style.fontWeight = 'bold';
            btnNext.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

            btnNext.onclick = (e) => {
                e.stopPropagation();
                if (confirm("Chuyển sang vòng tiếp theo?")) {
                    socket.emit('next_round');
                }
            };
            gameInfo.appendChild(btnNext);
        }
    } else {
        // Cleanup
        let btnNext = document.getElementById('btn-next-round');
        if (btnNext) btnNext.remove();
    }
}


function renderTiles(state) {
    const isScientist = (myRole === 'Pháp Y');
    const container = isScientist ? dom.tilesContainer : dom.publicTilesContainer;

    if (isScientist) {
        dom.scientistPanel.classList.remove('hidden');
        document.getElementById('public-tiles-panel').classList.add('hidden');

        // Render Admin controls if needed
        renderAdminGameControls(state);
    } else {
        dom.scientistPanel.classList.add('hidden');
        document.getElementById('public-tiles-panel').classList.remove('hidden');
    }

    container.innerHTML = '';

    state.sceneTiles.forEach((tile, tileIdx) => {
        const div = document.createElement('div');
        div.className = `scene-tile ${tile.type}`;

        const header = document.createElement('div');
        header.className = 'tile-header';

        // REPLACEMENT LOGIC (Scientist Only, Round 2+, General Tiles)
        if (isScientist && state.gameState === 'INVESTIGATION' &&
            state.round >= 2 && tile.type === 'general') {
            header.innerHTML = `${tile.name} <span style='font-size:0.8em; cursor:pointer' title='Đổi thẻ này'>🔄</span>`;
            header.querySelector('span').onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Bạn muốn đổi thẻ "${tile.name}" bằng thẻ mới?`)) {
                    socket.emit('replace_tile', tileIdx);
                }
            };
        } else {
            header.innerText = tile.name;
        }

        div.appendChild(header);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = `tile-options ${isScientist ? 'selectable' : ''}`;

        tile.options.forEach((opt, optIdx) => {
            const optSpan = document.createElement('div');
            optSpan.className = 'tile-option';
            optSpan.innerText = opt;

            if (state.clues[tileIdx] === optIdx) {
                optSpan.classList.add('selected');
            }

            if (isScientist && state.gameState === 'INVESTIGATION') {
                optSpan.addEventListener('click', () => {
                    socket.emit('give_clue', { tileIndex: tileIdx, optionIndex: optIdx });
                });
            }

            optionsDiv.appendChild(optSpan);
        });

        div.appendChild(optionsDiv);
        container.appendChild(div);
    });
}

function renderSuspects(state) {
    dom.otherPlayers.innerHTML = '';

    // Check Teammates/Enemies visibility
    let badGuys = [];
    if (state.teammates) badGuys = state.teammates;  // Murderer/Accomplice view
    if (state.perpetrators) badGuys = state.perpetrators; // Witness view

    state.players.forEach(p => {
        if (p.role === 'Pháp Y') return;

        const div = document.createElement('div');
        div.className = 'suspect-container';
        div.setAttribute('data-id', p.id); // For Reactions

        // Reaction Menu
        div.oncontextmenu = (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, p.id);
        };

        // Name Highlight Logic
        const nameDiv = document.createElement('div');
        nameDiv.className = 'suspect-name';

        let visualName = p.name;
        if (badGuys.includes(p.id)) {
            nameDiv.style.color = '#e74c3c'; // Red for bad guys
        }

        if (p.id === myId) {
            visualName += ' (Bạn)';
            nameDiv.style.fontWeight = 'bold';
            nameDiv.style.color = '#3498db'; // Highlight self with blue
        }

        nameDiv.innerText = visualName;

        // WITNESS GUESS CLICKABLE (Restored)
        if (gameState.gameState === 'WITNESS_GUESS' && myRole === 'Hung Thủ') {
            nameDiv.style.cursor = 'pointer';
            nameDiv.style.border = '1px solid red';
            nameDiv.style.padding = '5px';
            nameDiv.style.borderRadius = '5px';
            nameDiv.innerText += " (CHỌN)";
            nameDiv.onclick = () => {
                if (confirm(`Bạn nghi ngờ ${p.name} là Nhân Chứng? Nếu đúng bạn thắng, sai bạn thua!`)) {
                    socket.emit('guess_witness', p.id);
                }
            };
        }

        div.appendChild(nameDiv);

        // --- SUSPICION (Votes Received) ---
        if (p.votesReceived && p.votesReceived.length > 0) {
            div.classList.add('suspect-glow'); // CSS class for glow

            const suspicionDiv = document.createElement('div');
            suspicionDiv.style.fontSize = '0.75rem';
            suspicionDiv.style.color = '#ff4757';
            suspicionDiv.style.marginTop = '-5px';
            suspicionDiv.style.marginBottom = '5px';
            suspicionDiv.style.textAlign = 'center';
            suspicionDiv.innerText = `⚠️ Bị tố bởi: ${p.votesReceived.join(', ')}`;
            div.appendChild(suspicionDiv);
        }

        if (p.badges > 0) {
            const badge = document.createElement('span');
            badge.className = 'badge-count';
            badge.innerText = '👮';
            div.appendChild(badge);
        }

        // CARDS
        const renderCardList = (type, cards) => {
            if (!cards || !Array.isArray(cards)) cards = []; // Safety Check

            const group = document.createElement('div');
            group.className = 'card-group';
            group.innerHTML = `<h4>${type === 'means' ? 'Hung Khí' : 'Vật Chứng'}</h4>`;
            const list = document.createElement('div');
            list.className = 'card-list interactive';

            cards.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'game-card';
                cardDiv.innerText = card;

                // Highlight Logic
                // 1. Selection (Red) - Global State (but local variable)
                if ((type === 'means' && accusedMeans === card) ||
                    (type === 'evidence' && accusedEvidence === card)) {
                    cardDiv.classList.add('selected-accuse');
                }

                // 2. Note (Yellow) - Local State
                if (notedCards[card]) {
                    cardDiv.classList.add('noted');
                }

                // 3. Selection (Green)
                if (selectedMeans === card || selectedEvidence === card) {
                    cardDiv.classList.add('selected');
                }

                // 4. SUSPICION RENDER
                if (p.suspicions) {
                    const susList = p.suspicions.filter(s => s.card === card).map(s => s.from);
                    if (susList.length > 0) {
                        const susDiv = document.createElement('div');
                        susDiv.className = 'suspicion-tag';
                        susDiv.innerHTML = `🧐 ${susList.join(', ')} nghi ngờ`;
                        cardDiv.appendChild(susDiv);
                        // Also highlight card border if suspected?
                        cardDiv.style.border = '1px dashed #e67e22';
                    }
                }

                // Interactions
                // Click -> Note & Broadcast Suspicion
                cardDiv.onclick = (e) => {
                    // If in crime selection, use old logic
                    if (gameState.gameState === 'CRIME_SELECTION' && myRole === 'Hung Thủ') {
                        handleCrimeSelection(p.id, card, type);
                        return;
                    }

                    // Toggle Note (Local Visual)
                    notedCards[card] = !notedCards[card];

                    // Broadcast Suspicion (Server Logic)
                    // Only if we are noting IT (turning ON). Or both? 
                    // Let's sync it. Toggle on server matches toggle on client.
                    if (gameState.gameState === 'INVESTIGATION' && myRole !== 'Pháp Y') {
                        socket.emit('toggle_suspicion', { targetId: p.id, card: card });
                    }

                    render(gameState);
                };

                // Double Click -> Accuse Select
                cardDiv.ondblclick = (e) => {
                    e.preventDefault();
                    if (gameState.gameState !== 'INVESTIGATION') return;
                    if (myRole === 'Pháp Y') return; // Scientist doesn't accuse

                    // Allow selecting from new person, reset previous
                    if (accusedPlayerId && accusedPlayerId !== p.id) {
                        accusedMeans = null;
                        accusedEvidence = null;
                    }
                    accusedPlayerId = p.id;

                    if (type === 'means') {
                        accusedMeans = (accusedMeans === card) ? null : card;
                    } else {
                        accusedEvidence = (accusedEvidence === card) ? null : card;
                    }

                    render(gameState);
                }

                // Right Click -> Reaction Menu
                cardDiv.oncontextmenu = (e) => {
                    e.preventDefault();
                    showContextMenu(e.clientX, e.clientY, p.id); // Show menu at mouse pos
                };

                list.appendChild(cardDiv);
            });
            group.appendChild(list);
            return group;
        };

        try {
            div.appendChild(renderCardList('means', p.means));
            div.appendChild(renderCardList('evidence', p.evidence));
        } catch (err) {
            console.error("Error rendering card list for", p.name, err);
            const errDiv = document.createElement('div');
            errDiv.innerText = "Lỗi hiển thị thẻ";
            errDiv.style.color = "red";
            div.appendChild(errDiv);
        }

        dom.otherPlayers.appendChild(div);
    });

    updateAccuseButton();
}

function handleCrimeSelection(playerId, cardValue, type) {
    if (type === 'means') selectedMeans = (selectedMeans === cardValue) ? null : cardValue;
    if (type === 'evidence') selectedEvidence = (selectedEvidence === cardValue) ? null : cardValue;

    // Validation
    const me = gameState.players.find(p => p.id === myId);
    if (me.id !== playerId) {
        alert("Bạn chỉ được chọn hung khí trên người bạn!");
        selectedMeans = null; selectedEvidence = null;
    }
    render(gameState);
}

function updateAccuseButton() {
    let btn = document.getElementById('btn-accuse');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btn-accuse';
        btn.innerText = "TỐ CÁO NGAY!";
        btn.className = 'murder-btn'; // Reuse red style
        btn.style.position = 'fixed';
        btn.style.bottom = '150px';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.zIndex = '300';
        btn.style.display = 'none';

        btn.onclick = () => {
            const target = gameState.players.find(p => p.id === accusedPlayerId);
            if (confirm(`Bạn muốn tố cáo ${target.name}?\nHung khí: ${accusedMeans}\nVật chứng: ${accusedEvidence}`)) {
                socket.emit('make_guess', {
                    targetPlayerId: accusedPlayerId,
                    means: accusedMeans,
                    evidence: accusedEvidence
                });
                // Clear selection locally
                accusedMeans = null;
                accusedEvidence = null;
                render(gameState);
            }
        };
        document.body.appendChild(btn);
    }

    // Show Condition
    if (accusedMeans && accusedEvidence && accusedPlayerId) {
        // Also check if I have badges
        const me = gameState.players.find(p => p.id === myId);
        if (me && me.badges > 0 && gameState.gameState === 'INVESTIGATION' && myRole !== 'Pháp Y') {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    } else {
        btn.style.display = 'none';
    }
}

function renderStoryPanel(solution) {
    let storyDiv = document.getElementById('story-panel');
    if (!storyDiv) {
        storyDiv = document.createElement('div');
        storyDiv.id = 'story-panel';
        storyDiv.style.background = '#2c3e50';
        storyDiv.style.border = '1px solid #e74c3c';
        storyDiv.style.padding = '1rem';
        storyDiv.style.margin = '1rem 0';
        storyDiv.style.borderRadius = '8px';
        dom.scientistPanel.prepend(storyDiv);
    }

    storyDiv.innerHTML = `
        <h4 style="color:#e74c3c; margin-top:0;">HỒ SƠ VỤ ÁN (MẬT)</h4>
        <p style="font-style:italic;">"${solution.story}"</p>
        <div style="font-size: 0.9em; margin-top: 5px; color: #f1c40f;">
            <strong>Gợi ý:</strong> Nguyên nhân có thể là <u>${solution.suggestions.cause}</u>
        </div>
        <div style="font-size: 0.8em; color: #95a5a6; margin-top:5px;">
            Hung khí: ${solution.means} | Vật chứng: ${solution.evidence}
        </div>
    `;
}

function populateGameOver(state) {
    const winnerText = document.getElementById('winner-text');
    const reasonText = document.getElementById('game-over-reason');
    const revealDiv = document.getElementById('solution-reveal');

    // Text Logic
    if (state.winner === 'INVESTIGATORS') {
        winnerText.innerText = "CHÚC MỪNG PHE CẢNH SÁT!";
        if (state.overReason === 'CAUGHT') reasonText.innerText = "Hung thủ bị bắt và không tìm thấy Nhân Chứng.";
        if (state.overReason === 'WITNESS_SAFE') reasonText.innerText = "Hung thủ đoán sai Nhân Chứng!";
        winnerText.style.color = '#3498db';
    } else {
        winnerText.innerText = "HUNG THỦ THẮNG!";
        if (state.overReason === 'ESCAPED') reasonText.innerText = "Hung thủ đã trốn thoát khỏi sự truy đuổi.";
        if (state.overReason === 'WITNESS_KILLED') reasonText.innerText = "Hung thủ đã trừ khử Nhân Chứng thành công!";
        winnerText.style.color = '#e74c3c';
    }

    // Identity Reveal Logic
    const murderer = state.players.find(p => p.role === 'Hung Thủ');
    const accomplice = state.players.find(p => p.role === 'Tòng Phạm');

    let revealHTML = `
            <div style="margin-top:20px; text-align:center;">
                <h3 style="color:#e74c3c">HUNG THỦ LÀ: ${murderer ? murderer.name : 'Unknown'}</h3>
                ${accomplice ? `<h4 style="color:#e67e22">Tòng Phạm: ${accomplice.name}</h4>` : ''}
            </div>
            <div style="margin-top:20px; border:1px solid #555; padding:10px; background:#222; border-radius:8px;">
                <h4 style="margin-top:0;">CHÂN TƯỚNG VỤ ÁN</h4>
                <div style="display:flex; justify-content:center; gap:10px;">
                    <div class="game-card selected" style="cursor:default;">${state.solution ? state.solution.means : '?'}</div>
                    <div class="game-card selected" style="cursor:default;">${state.solution ? state.solution.evidence : '?'}</div>
                </div>
            </div>
        `;
    revealDiv.innerHTML = revealHTML;

    // Update Restart Button Logic
    const btnRestart = document.getElementById('btn-restart');

    console.log("GAME OVER RENDER. My ID:", myId, "Admin ID:", state.adminId);

    // Remove the inline onclick="location.reload()" to ensure our JS takes over
    btnRestart.removeAttribute('onclick');

    if (myId === state.adminId) {
        btnRestart.innerText = "Tạo Game Mới (Chủ Phòng)";
        btnRestart.style.display = 'inline-block';
        btnRestart.onclick = (e) => {
            e.preventDefault(); // Prevent any default behavior
            console.log("Clicking Reset Game...");
            socket.emit('reset_game');
        };
    } else {
        console.log("I am not admin. Hiding restart button.");
        btnRestart.innerText = "Chờ Chủ Phòng tạo lại...";
        btnRestart.style.display = 'none'; // Only Admin can restart
    }
}

// --- RENDER ADMIN CONTROLS ---
function renderAdminGameControls(state) {
    if (myId !== state.adminId) return;

    let panel = document.getElementById('admin-panel-sidebar');
    // Render into sidebar panel
    if (!panel) return;

    panel.classList.remove('hidden');
    panel.innerHTML = ''; // Clear previous

    const ctrlDiv = document.createElement('div');
    ctrlDiv.style.background = '#333';
    ctrlDiv.style.padding = '10px';
    ctrlDiv.style.borderRadius = '5px';
    ctrlDiv.style.border = '1px solid #555';

    // Timer Display
    if (state.timer) {
        // Javascript-side countdown update handled elsewhere (maybe add here?)
        ctrlDiv.innerHTML += `<div style="text-align:center; font-size:1.5rem; color:${state.timer.duration < 10 ? 'red' : '#f1c40f'}; margin-bottom:10px;">⏳ ${state.timer.duration}s</div>`;
    }

    // Next Round Button
    if (state.gameState === 'INVESTIGATION' && state.round < state.maxRounds) {
        const btnNext = document.createElement('button');
        btnNext.className = 'admin-btn';
        btnNext.innerHTML = '📱 QUA VÒNG MỚI >>';
        btnNext.onclick = () => {
            if (confirm("Chuyển sang vòng tiếp theo?")) {
                socket.emit('next_round');
            }
        };
        ctrlDiv.appendChild(btnNext);
    }

    // Final Chance / Game Over handled automatically by server timer usually, but can add force end here if needed.

    panel.appendChild(ctrlDiv);
}

// --- SUSPICION BOARD (SIDEBAR) ---
function renderSuspicionBoard(state) {
    let board = document.getElementById('suspicion-board');
    if (!board) {
        const sidebar = document.getElementById('game-sidebar');
        if (!sidebar) return;
        board = document.createElement('div');
        board.id = 'suspicion-board';
        // HTML Structure handled by CSS now
        // Insert before tabs
        const tabs = document.getElementById('sidebar-tabs');
        sidebar.insertBefore(board, tabs);
    }

    // Calculate Ranks
    const suspects = state.players
        .filter(p => !['Pháp Y'].includes(p.role)) // Exclude Scientist
        .filter(p => p.suspicionCount > 0)
        .sort((a, b) => b.suspicionCount - a.suspicionCount)
        .slice(0, 3); // Top 3

    if (suspects.length === 0) {
        board.classList.add('hidden');
        return;
    }

    board.classList.remove('hidden');
    // Header with Icon
    board.innerHTML = `<h5><span style="font-size:1.2em">🔥</span> DIỆN TÌNH NGHI</h5>`;

    suspects.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = `suspicion-item rank-${idx + 1}`;

        const rankIcon = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));

        row.innerHTML = `
            <span class="suspicion-rank">${rankIcon}</span>
            <span class="suspicion-text" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size: 0.9em; flex: 1;">
                 <strong style="color:#eee;">${p.name}:</strong> 
                 <span style="color:#ff6b6b; font-weight:bold;">${p.suspicionCount} tình nghi</span>
            </span>
        `;
        board.appendChild(row);
    });
}

// --- SIDEBAR TABS LOGIC ---
const tabBtnChat = document.getElementById('tab-btn-chat');
const tabBtnLog = document.getElementById('tab-btn-log');
const tabChat = document.getElementById('tab-chat');
const tabLog = document.getElementById('tab-log');

function switchTab(tabName) {
    if (tabName === 'chat') {
        tabBtnChat.classList.add('active');
        tabBtnLog.classList.remove('active');
        tabChat.classList.add('active');
        tabLog.classList.remove('active');
    } else {
        tabBtnChat.classList.remove('active');
        tabBtnLog.classList.add('active');
        tabChat.classList.remove('active');
        tabLog.classList.remove('active');
        tabLog.classList.add('active'); // Ensure tabLog is active
        // Clear unread notification if implemented
        tabBtnLog.style.color = '';
    }
}

if (tabBtnChat && tabBtnLog) {
    tabBtnChat.onclick = () => switchTab('chat');
    tabBtnLog.onclick = () => switchTab('log');
}

// --- LOGS ---
function addLogEntry(entry) {
    // Target the new log list in tab
    const list = document.getElementById('log-list');
    if (!list) return;

    // Notification if tab is not active
    if (!tabLog.classList.contains('active')) {
        tabBtnLog.style.color = '#ff4757'; // Red alert color
    }

    // CHECK FOR START GAME NOTIFICATION
    if (entry.type === 'phase' && entry.text.includes('Hung thủ đã chọn')) {
        alert("🔪 HUNG THỦ ĐÃ HÀNH ĐỘNG! \nTRÒ CHƠI BẮT ĐẦU!");
        switchTab('log'); // Auto switch to log on game start
    }

    const item = document.createElement('div');
    item.className = `log-item ${entry.type}`;

    const time = new Date(entry.time).toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    item.innerText = `[${time}] ${entry.text}`;

    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
}

// --- REACTIONS ---
function showReaction(data) {
    // data: { sourceId, targetId, emoji }
    const { targetId, emoji } = data;

    const targetEl = document.querySelector(`.player-card[data-id="${targetId}"]`) ||
        document.querySelector(`.suspect-container[data-id="${targetId}"]`);

    if (targetEl) {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-emoji';
        floatEl.innerText = emoji;

        // Position relative to target
        const rect = targetEl.getBoundingClientRect();
        floatEl.style.left = (rect.left + rect.width / 2) + 'px';
        floatEl.style.top = (rect.top + rect.height / 2) + 'px';

        document.body.appendChild(floatEl);

        // Remove after animation
        setTimeout(() => floatEl.remove(), 2000);
    }
}

// Context Menu Helper
function showContextMenu(x, y, targetId) {
    // Remove old
    const old = document.getElementById('context-menu');
    if (old) old.remove();

    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.style.top = y + 'px';
    menu.style.left = x + 'px';

    const emojis = ['🤔', '👍', '👎', '😂', '🔥', '👀'];

    emojis.forEach(e => {
        const btn = document.createElement('span');
        btn.innerText = e;
        btn.onclick = () => {
            socket.emit('send_reaction', { targetId, emoji: e });
            menu.remove();
        };
        menu.appendChild(btn);
    });

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 10);

    document.body.appendChild(menu);
}

// --- VOICE CHAT LOGIC (WebRTC Mesh) ---
let localStream = null;
let peers = {}; // { otherUserId: RTCPeerConnection }
let isMicOn = false;
let audioContext = null;
let analyser = null;

const btnMic = document.getElementById('btn-mic');
const voiceStatus = document.getElementById('voice-status');

if (btnMic) {
    btnMic.onclick = toggleMic;
}

async function toggleMic() {
    if (isMicOn) {
        // Turn OFF
        isMicOn = false;
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        btnMic.innerText = '🔇 Bật Mic';
        btnMic.style.background = '#e74c3c';
        voiceStatus.innerText = 'Đã ngắt kết nối';

        // Close all peers
        Object.values(peers).forEach(pc => pc.close());
        peers = {};

        removeVisuals();
    } else {
        // Turn ON
        try {
            voiceStatus.innerText = 'Đang kết nối...';
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            isMicOn = true;
            btnMic.innerText = '🎙️ Tắt Mic';
            btnMic.style.background = '#2ecc71';
            voiceStatus.innerText = 'Đang nói...';

            // Init Audio Analysis for Visuals
            setupAudioAnalysis(localStream);

            // Notify Server
            socket.emit('voice_join');

        } catch (err) {
            console.error("Mic Access Error:", err);
            alert("Không thể truy cập Micro! Vui lòng kiểm tra quyền trình duyệt.");
            voiceStatus.innerText = 'Lỗi truy cập Mic';
        }
    }
}

function removeVisuals() {
    // Remove all speaking indicators
    document.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
}

// Socket Listeners for Voice
socket.on('voice_user_joined', (userId) => {
    // A new user joined voice -> We (existing user) initiate connection
    if (!isMicOn) return; // Ignore if we are not in voice
    console.log("Voice: User joined", userId);
    createPeerConnection(userId, true);
});

socket.on('voice_signal', async (data) => {
    // data: { from, signal }
    if (!isMicOn) return;

    const { from, signal } = data;
    let pc = peers[from];

    if (!pc) {
        // Incoming connection (Answer side)
        pc = createPeerConnection(from, false);
    }

    try {
        if (signal.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            if (signal.sdp.type === 'offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('voice_signal', { to: from, signal: { sdp: pc.localDescription } });
            }
        } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    } catch (e) {
        console.error("Signal Warning:", e);
    }
});

function createPeerConnection(targetId, isInitiator) {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Public STUN
    });

    peers[targetId] = pc;

    // Add local tracks
    if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    // Handle ICE
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('voice_signal', { to: targetId, signal: { candidate: event.candidate } });
        }
    };

    // Handle Stream
    pc.ontrack = (event) => {
        console.log("Voice: Received Remote Stream from", targetId);
        const remoteAudio = document.createElement('audio');
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.autoplay = true;
        // remoteAudio.controls = true; // Debugging
        remoteAudio.style.display = 'none';
        document.body.appendChild(remoteAudio);

        // Analyze Remote Audio for Visuals
        setupRemoteAudioAnalysis(event.streams[0], targetId);

        // Cleanup on end
        event.streams[0].onremovetrack = () => {
            remoteAudio.remove();
        };
    };

    if (isInitiator) {
        pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            socket.emit('voice_signal', { to: targetId, signal: { sdp: offer } });
        });
    }

    return pc;
}

// --- AUDIO VISUALIZATION ---

function setupAudioAnalysis(stream) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser); // Loopback? No, don't connect to destination to avoid self-echo

    visualize(analyser, myId);
}

function setupRemoteAudioAnalysis(stream, userId) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    // AND connect to destination (speakers)
    analyser.connect(audioContext.destination);

    visualize(analyser, userId);
}

function visualize(analyser, userId) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
        if (!peers[userId] && userId !== myId) return; // Stop if disconnected

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;

        // Apply class if volume > threshold
        const el = document.querySelector(`.player-card[data-id="${userId}"]`) ||
            document.querySelector(`.suspect-container[data-id="${userId}"]`);

        if (el) {
            if (average > 10) { // Threshold
                el.classList.add('speaking');
            } else {
                el.classList.remove('speaking');
            }
        }

        requestAnimationFrame(checkVolume);
    };
    checkVolume();
}

// Context Menu Helper (Moved from helper file)
function showContextMenu(x, y, targetId) {
    // Remove old
    const old = document.getElementById('context-menu');
    if (old) old.remove();

    const menu = document.createElement('div');
    menu.id = 'context-menu';
    // FORCE INLINE STYLES
    menu.style.position = 'fixed';
    menu.style.top = y + 'px';
    menu.style.left = x + 'px';
    menu.style.backgroundColor = '#222';
    menu.style.border = '1px solid #ffa502';
    menu.style.padding = '8px';
    menu.style.borderRadius = '20px';
    menu.style.display = 'flex';
    menu.style.gap = '8px';
    menu.style.zIndex = '9999';
    menu.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
    menu.style.transition = 'opacity 0.2s';

    const emojis = ['🤔', '👍', '👎', '😂', '🔥', '👀'];

    emojis.forEach(e => {
        const btn = document.createElement('span');
        btn.innerText = e;
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '1.5rem';
        btn.style.transition = 'transform 0.2s';

        btn.onmouseover = () => btn.style.transform = 'scale(1.3)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';

        btn.onclick = () => {
            socket.emit('send_reaction', { targetId, emoji: e });
            menu.remove();
        };
        menu.appendChild(btn);
    });

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 10);

    document.body.appendChild(menu);
}

// --- REACTIONS VISUALIZER ---
function showReaction(data) {
    const { targetId, emoji } = data;

    // Find Target Element (Must be VISIBLE)
    const candidates = document.querySelectorAll(`[data-id="${targetId}"]`);
    let targetEl = null;
    for (const el of candidates) {
        // offsetParent is null if element or ancestor is display: none
        if (el.offsetParent !== null && (el.classList.contains('player-card') || el.classList.contains('suspect-container'))) {
            targetEl = el;
            break;
        }
    }

    if (targetEl) {
        const floatEl = document.createElement('div');
        floatEl.innerText = emoji;

        // INLINE STYLES (Robustness)
        floatEl.style.position = 'fixed';
        floatEl.style.fontSize = '3rem';
        floatEl.style.pointerEvents = 'none';
        floatEl.style.zIndex = '10000';
        floatEl.style.textShadow = '0 2px 5px rgba(0,0,0,0.5)';

        // Position relative to target
        const rect = targetEl.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        floatEl.style.left = startX + 'px';
        floatEl.style.top = startY + 'px';
        // Center the transform origin
        floatEl.style.transform = 'translate(-50%, -50%)';

        document.body.appendChild(floatEl);

        // WEB ANIMATIONS API (No CSS needed)
        const animation = floatEl.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0, offset: 0 },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -150px) scale(1)', opacity: 0, offset: 1 }
        ], {
            duration: 2000,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Cleanup
        animation.onfinish = () => floatEl.remove();
    }
}
