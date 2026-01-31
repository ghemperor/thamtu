// Game Logic Handling

const { MEANS_CARDS, EVIDENCE_CARDS, SCENE_TILES, shuffle, getRandomItems, generateCrimeStory } = require('./data');

class Game {
    constructor(io) {
        this.io = io;
        this.players = [];
        this.gameState = 'LOBBY';
        this.adminId = null; // The Host

        // Roles
        this.scientistId = null;
        this.murdererId = null;
        this.accompliceId = null;
        this.witnessId = null;

        this.solution = {
            murdererId: null,
            means: null,
            evidence: null,
            story: null,
            suggestions: null
        };

        this.sceneTiles = [];
        this.clues = {};
        this.round = 1;
        this.maxRounds = 3;
        // Logs
        this.logs = []; // [{ time, text, type }]
    }

    addLog(text, type = 'info') {
        const entry = {
            time: Date.now(),
            text,
            type
        };
        this.logs.push(entry);
        // Trim logs if too long
        if (this.logs.length > 50) this.logs.shift();

        this.io.emit('log_add', entry);
    }

    // ... (rest of methods)

    handleReaction(playerId, targetId, emoji) {
        // Just relay it
        const p = this.players.find(p => p.id === playerId);
        if (!p) return;

        // Anti-spam? 
        this.io.emit('reaction_show', {
            sourceId: playerId,
            sourceName: p.name,
            targetId,
            emoji
        });
    }

    broadcastState() {
        this.players.forEach(p => {
            this.io.to(p.id).emit('state_update', this.getPlayerView(p.id));
        });
    }

    addPlayer(id, name) {
        // First player is Admin
        if (this.players.length === 0) {
            this.adminId = id;
        }

        this.players.push({
            id,
            name,
            role: null,
            means: [],
            evidence: [],
            isReady: false,
            badges: 1
        });
        this.broadcastState();
    }

    getPlayerName(id) {
        const p = this.players.find(p => p.id === id);
        return p ? p.name : "Người lạ";
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
        if (id === this.adminId && this.players.length > 0) {
            this.adminId = this.players[0].id; // Reassign admin
        }
        this.broadcastState();
    }

    setPlayerReady(id, isReady) {
        const p = this.players.find(p => p.id === id);
        if (p) p.isReady = isReady;
        this.broadcastState();
    }

    // Start Game - Now accepts Config
    startGame(config = { useWitness: false, useAccomplice: false }) {
        console.log("Admin requesting start...", config);

        if (this.players.length < 4) {
            console.log("Không đủ người (<4).");
            return;
        }

        try {
            this.gameState = 'SETUP';

            // Assign Roles
            const shuffledIds = shuffle(this.players.map(p => p.id));
            let idx = 0;

            this.scientistId = shuffledIds[idx++];
            this.murdererId = shuffledIds[idx++];

            this.accompliceId = config.useAccomplice ? shuffledIds[idx++] : null;
            this.witnessId = config.useWitness ? shuffledIds[idx++] : null;

            console.log(`Roles: Pháp Y=${this.scientistId}, Hung Thủ=${this.murdererId}, Tòng Phạm=${this.accompliceId}, Nhân Chứng=${this.witnessId}`);

            // Prepare Decks
            const meansDeck = shuffle([...MEANS_CARDS]);
            const evidenceDeck = shuffle([...EVIDENCE_CARDS]);

            this.players.forEach(p => {
                if (p.id === this.scientistId) p.role = 'Pháp Y';
                else if (p.id === this.murdererId) p.role = 'Hung Thủ';
                else if (p.id === this.accompliceId) p.role = 'Tòng Phạm';
                else if (p.id === this.witnessId) p.role = 'Nhân Chứng';
                else p.role = 'Thám Tử';

                if (p.role !== 'Pháp Y') {
                    p.means = meansDeck.splice(0, 4);
                    p.evidence = evidenceDeck.splice(0, 4);
                } else {
                    p.means = [];
                    p.evidence = [];
                }
            });

            // Setup Tiles
            const generalTiles = SCENE_TILES.filter(t => t.type === 'general');
            const selectedGeneral = getRandomItems(generalTiles, 4);

            this.sceneTiles = [
                SCENE_TILES.find(t => t.name === 'Nguyên nhân cái chết'),
                SCENE_TILES.find(t => t.name === 'Hiện trường vụ án'),
                ...selectedGeneral
            ];

            this.gameState = 'CRIME_SELECTION';
            this.broadcastState();
        } catch (error) {
            console.error("LỖI START GAME:", error);
        }
    }

    // Reset Game to Lobby
    resetGame() {
        console.log("RESETTING GAME...");
        this.gameState = 'LOBBY';
        this.winner = null;
        this.overReason = null;

        this.scientistId = null;
        this.murdererId = null;
        this.accompliceId = null;
        this.witnessId = null;

        this.solution = {
            murdererId: null,
            means: null,
            evidence: null,
            story: null,
            suggestions: null
        };

        this.sceneTiles = [];
        this.clues = {};
        this.round = 1;

        // Reset Players
        this.players.forEach(p => {
            p.role = null;
            p.means = [];
            p.evidence = [];
            p.isReady = false; // Everyone needs to ready up again
            p.badges = 1;
        });

        this.broadcastState();
    }

    selectCrime(playerId, means, evidence) {
        if (playerId !== this.murdererId) return;
        if (this.gameState !== 'CRIME_SELECTION') return;

        const { story, suggestions } = generateCrimeStory(means, evidence);

        this.solution = {
            murdererId: this.murdererId,
            means,
            evidence,
            story,
            suggestions
        };

        this.gameState = 'INVESTIGATION';
        this.round = 1;
        this.addLog(`📜 Hung thủ đã chọn phương thức gây án. Cuộc điều tra bắt đầu!`, 'phase');
        this.startTimer(180); // 3 Minutes for Round 1
        this.broadcastState();
    }

    // --- NEW: Round Management ---
    nextRound() {
        if (this.round >= this.maxRounds) {
            // End of Round 3 -> Go to FINAL CHANCE (30s)
            if (this.gameState !== 'FINAL_CHANCE') {
                this.gameState = 'FINAL_CHANCE';
                this.addLog(`⚠️ CƠ HỘI CUỐI! 30 giây để tìm ra Hung thủ!`, 'alert');
                this.startTimer(30, () => {
                    // Time up for Final Chance -> Game Over
                    if (this.gameState === 'FINAL_CHANCE') {
                        this.gameState = 'GAME_OVER';
                        this.winner = 'MURDERER';
                        this.overReason = 'ESCAPED';
                        this.addLog(`⌛ Hết giờ! Hung thủ đã trốn thoát.`, 'end');
                        this.broadcastState();
                        this.io.emit('play_sound', 'lose');
                    }
                });
                this.broadcastState();
                return;
            }
            return;
        }

        this.round++;

        // Between rounds, allow Scientist to replace a tile?
        // Actually, the rule is Scientist replaces a tile immediately at start of R2 & R3.
        // So we enter a "REPLACE_PHASE" or just handle it purely via state.

        // Let's keep it simple: Just allow replaceTile API call during Round 2/3.
        // Reset Timer
        this.startTimer(180); // 3 mins per round
        this.broadcastState();
    }

    replaceTile(tileIndex) {
        // Validation: Must be Scientist
        if (this.gameState !== 'INVESTIGATION') return;

        // Cannot replace Cause (0) or Location (1)
        if (tileIndex < 2) return;

        // Draw new tile from GENERAL pool
        const generalTiles = SCENE_TILES.filter(t => t.type === 'general');
        // Filter out tiles already on board
        const currentNames = this.sceneTiles.map(t => t.name);
        const available = generalTiles.filter(t => !currentNames.includes(t.name));

        if (available.length > 0) {
            const newTile = getRandomItems(available, 1)[0];
            this.sceneTiles[tileIndex] = newTile;
            // Clear clue for this index
            delete this.clues[tileIndex];

            // Broadcast event for sound/anim
            this.io.emit('tile_replaced', { index: tileIndex, newTile });
            this.broadcastState();
        }
    }

    // --- NEW: Timer ---
    startTimer(seconds, onTimeout = null) {
        // Clear existing timeout if any
        if (this.timerTimeout) clearTimeout(this.timerTimeout);

        const endTime = Date.now() + (seconds * 1000);
        this.timer = {
            endTime: endTime,
            duration: seconds
        };
        // Emit timer start
        this.io.emit('timer_start', this.timer);

        // Server-side enforcement (optional but good for Final Chance)
        if (onTimeout) {
            this.timerTimeout = setTimeout(onTimeout, seconds * 1000);
        }
    }

    giveClue(playerId, tileIndex, optionIndex) {
        if (playerId !== this.scientistId) return;
        if (this.gameState !== 'INVESTIGATION') return; // Cannot give clue in Final Chance

        this.clues[tileIndex] = optionIndex;

        // Sound trigger
        this.io.emit('play_sound', 'clue');

        this.broadcastState();
    }

    makeGuess(playerId, targetPlayerId, means, evidence) {
        const p = this.players.find(p => p.id === playerId);
        const target = this.players.find(p => p.id === targetPlayerId);

        if (!p || p.badges <= 0) return;

        // Allow guessing in INVESTIGATION or FINAL_CHANCE
        if (this.gameState !== 'INVESTIGATION' && this.gameState !== 'FINAL_CHANCE') return;

        p.badges--;

        const isWin = (targetPlayerId === this.solution.murdererId &&
            means === this.solution.means &&
            evidence === this.solution.evidence);

        // Broadcast System Message
        const status = isWin ? "THÀNH CÔNG" : "THẤT BẠI";
        const icon = isWin ? "🎉" : "❌";
        const msg = `👮 ${p.name} đã tố cáo ${target ? target.name : 'ai đó'} ${status} với hung khí [${means}] và vật chứng [${evidence}]. ${icon}`;

        this.addLog(msg, isWin ? 'success' : 'fail');

        this.io.emit('chat_message', {
            type: 'system',
            text: msg
        });

        // Sound Trigger
        this.io.emit('play_sound', isWin ? 'win' : 'accuse_fail');

        if (isWin) {
            // INVESTIGATORS WON... But wait, is there a witness?
            if (this.witnessId) {
                this.gameState = 'WITNESS_GUESS'; // Murderer gets a chance
                this.broadcastState();
            } else {
                this.gameState = 'GAME_OVER';
                this.winner = 'INVESTIGATORS';
                this.overReason = 'CAUGHT';
                this.broadcastState();
            }
        } else {
            const investigators = this.players.filter(p => p.role !== 'Pháp Y');
            const badgesLeft = investigators.reduce((sum, p) => sum + p.badges, 0);
            if (badgesLeft === 0) {
                this.gameState = 'GAME_OVER';
                this.winner = 'MURDERER';
                this.overReason = 'ESCAPED';
                this.broadcastState();
                this.io.emit('play_sound', 'lose');
            } else {
                this.io.to(playerId).emit('guess_result', { success: false });
                this.broadcastState();
            }
        }
    }

    // Murderer guesses who the witness is
    guessWitness(playerId, targetId) {
        if (playerId !== this.murdererId) return;
        if (this.gameState !== 'WITNESS_GUESS') return;

        if (targetId === this.witnessId) {
            this.gameState = 'GAME_OVER';
            this.winner = 'MURDERER';
            this.overReason = 'WITNESS_KILLED';
            this.io.emit('play_sound', 'lose'); // Investigators lose
            this.broadcastState();
        } else {
            this.gameState = 'GAME_OVER';
            this.winner = 'INVESTIGATORS';
            this.overReason = 'WITNESS_SAFE';
            this.io.emit('play_sound', 'win');
            this.broadcastState();
        }
    }

    broadcastState() {
        this.players.forEach(p => {
            this.io.to(p.id).emit('state_update', this.getPlayerView(p.id));
        });
    }

    getPlayerView(playerId) {
        const p = this.players.find(p => p.id === playerId);
        const myRole = p.role;

        const publicData = {
            gameState: this.gameState,
            players: this.players.map(pl => ({
                id: pl.id,
                name: pl.name,
                isReady: pl.isReady,
                role: (this.gameState === 'GAME_OVER' || pl.id === playerId) ? pl.role : (pl.role === 'Pháp Y' ? 'Pháp Y' : '???'),
                means: pl.means,
                evidence: pl.evidence,
                badges: pl.badges
            })),
            sceneTiles: this.sceneTiles,
            clues: this.clues,
            round: this.round,
            maxRounds: this.maxRounds,
            timer: this.timer, // NEW
            winner: this.winner,
            overReason: this.overReason,
            solution: (this.gameState === 'GAME_OVER') ? this.solution : null,
            adminId: this.adminId
        };

        // Role-based Knowledge
        let knowledge = {};

        // Scientist sees solution
        if (myRole === 'Pháp Y') {
            knowledge.solution = this.solution;
        }

        // Murderer sees Accomplice
        if (myRole === 'Hung Thủ' || myRole === 'Tòng Phạm') {
            knowledge.teammates = this.players
                .filter(pl => pl.role === 'Hung Thủ' || pl.role === 'Tòng Phạm')
                .map(pl => pl.id);
        }

        // Witness sees Murderer and Accomplice
        if (myRole === 'Nhân Chứng') {
            knowledge.perpetrators = this.players
                .filter(pl => pl.role === 'Hung Thủ' || pl.role === 'Tòng Phạm')
                .map(pl => pl.id);
        }

        return { ...publicData, ...knowledge };
    }
}

module.exports = Game;
