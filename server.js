// Main Server

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const game = new Game(io);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_game', (name) => {
        game.addPlayer(socket.id, name);
    });

    socket.on('replace_tile', (tileIndex) => {
        game.replaceTile(tileIndex);
    });

    socket.on('send_reaction', (payload) => {
        game.handleReaction(socket.id, payload.targetId, payload.emoji);
    });

    // --- VOICE CHAT SIGNALING ---
    socket.on('voice_join', () => {
        // Notify others that this user is ready for voice
        socket.broadcast.emit('voice_user_joined', socket.id);
    });

    socket.on('voice_signal', (payload) => {
        // payload: { to: targetId, signal: ... }
        io.to(payload.to).emit('voice_signal', {
            from: socket.id,
            signal: payload.signal
        });
    });

    socket.on('next_round', () => {
        // Only Admin or Scientist should trigger this really, but for now open
        game.nextRound();
    });

    socket.on('disconnect', () => {
        game.removePlayer(socket.id);
    });

    socket.on('set_ready', (isReady) => {
        game.setPlayerReady(socket.id, isReady);
    });

    socket.on('start_game', (config) => {
        game.startGame(config);
    });

    socket.on('select_crime', ({ means, evidence }) => {
        game.selectCrime(socket.id, means, evidence);
    });

    socket.on('give_clue', ({ tileIndex, optionIndex }) => {
        game.giveClue(socket.id, tileIndex, optionIndex);
    });

    socket.on('make_guess', ({ targetPlayerId, means, evidence }) => {
        game.makeGuess(socket.id, targetPlayerId, means, evidence);
    });

    socket.on('guess_witness', (targetId) => {
        game.guessWitness(socket.id, targetId);
    });

    socket.on('reset_game', () => {
        game.resetGame();
    });

    socket.on('toggle_suspicion', (payload) => {
        game.toggleSuspicion(socket.id, payload.targetId, payload.card);
    });

    // Chat
    socket.on('chat_message', (msg) => {
        // Broadcast to everyone including sender
        io.emit('chat_message', { id: socket.id, name: game.getPlayerName(socket.id), text: msg });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
