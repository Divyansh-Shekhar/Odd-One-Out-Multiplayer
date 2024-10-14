const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files from the public directory

const playerScores = {}; // Object to hold player scores

io.on('connection', (socket) => {
    console.log('A player connected');

    let playerName; // Store the player's name in the socket instance

    // When a new player joins, initialize their score
    socket.on('join', (name) => {
        playerName = name; // Store the player's name
        if (!playerScores[playerName]) {
            playerScores[playerName] = 0; // Initialize score if not already present
        }
        io.emit('scoreUpdate', playerScores); // Update scores on all clients
    });

    // Handle generating a new game
    socket.on('newGame', () => {
        const bait = Math.floor(Math.random() * 28);
        const baseColorR = Math.floor(Math.random() * 256);
        const baseColorG = Math.floor(Math.random() * 256);
        const baseColorB = Math.floor(Math.random() * 256);

        const baitColorR = Math.min(Math.max(baseColorR + (Math.random() < 0.5 ? 15 : -15), 0), 255);
        const baitColorG = Math.min(Math.max(baseColorG + (Math.random() < 0.5 ? 15 : -15), 0), 255);
        const baitColorB = Math.min(Math.max(baseColorB + (Math.random() < 0.5 ? 15 : -15), 0), 255);

        const baitColor = `rgb(${baitColorR}, ${baitColorG}, ${baitColorB})`;
        const baseColor = `rgb(${baseColorR}, ${baseColorG}, ${baseColorB})`;

        io.emit('newGame', { baitColor, baitButton: bait, baseColor });
    });

    // Handle guessing the odd color
    socket.on('guess', (data) => {
        if (data.correct) {
            playerScores[data.playerName] += 1; // Increase score for correct guess
        } else {
            playerScores[data.playerName] -= 1; // Decrease score for incorrect guess
        }
        io.emit('guess', data); // Broadcast guess result to all clients
        io.emit('scoreUpdate', playerScores); // Update scores on all clients
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        if (playerName) {
            delete playerScores[playerName]; // Remove player from scores
            io.emit('scoreUpdate', playerScores); // Update scores on all clients
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
});
