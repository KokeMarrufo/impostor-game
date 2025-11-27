require('dotenv').config();

const { createServer } = require('http');
const next = require('next');
const socketIo = require('socket.io');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

// Initialize Gemini (optional - only needed for AI word generation)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: 'v1'
}) : null;

if (genAI) {
    console.log('✨ Gemini API configured - AI word generation enabled!');
} else {
    console.log('⚠️  Gemini API key not found - AI word generation disabled (add GEMINI_API_KEY to .env)');
}

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);
    const io = socketIo(httpServer);

    const rooms = new Map();

    const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

    const assignRoles = (room) => {
        const word = room.settings.words[room.currentRound - 1];
        const players = room.players;
        const impostorIndex = Math.floor(Math.random() * players.length);

        room.players.forEach((p, index) => {
            p.isImpostor = index === impostorIndex;
            p.word = p.isImpostor ? 'IMPOSTOR' : word;
        });
    };

    const calculateResults = (room) => {
        const votes = room.votes;
        const voteCounts = {};
        let maxVotes = 0;
        let votedOutId = null;

        // Count votes
        Object.values(votes).forEach(targetId => {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
            if (voteCounts[targetId] > maxVotes) {
                maxVotes = voteCounts[targetId];
                votedOutId = targetId;
            }
        });

        // Determine if impostor caught
        const impostor = room.players.find(p => p.isImpostor);
        const impostorCaught = votedOutId === impostor.id;

        // Update scores
        if (impostorCaught) {
            room.players.forEach(p => {
                if (!p.isImpostor) p.score += 1;
            });
        } else {
            impostor.score += 1;
        }

        room.lastRoundResult = {
            impostor: impostor,
            votedOutId: votedOutId,
            impostorCaught: impostorCaught
        };
    };

    const generateWordsWithAI = async (theme, count) => {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured');
        }

        try {
            const apiKey = process.env.GEMINI_API_KEY;
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const prompt = `Generate ${count} simple, common words related to the theme: "${theme}". 
These words are for a social deduction game where players must identify who doesn't know the secret word.
Return ONLY a JSON array of ${count} words as strings, nothing else. No explanations, no formatting, just the JSON array.
Example format: ["word1", "word2", "word3"]`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text.trim();

            // Remove markdown code blocks if present
            let cleanText = text;
            if (text.startsWith('```json')) {
                cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            } else if (text.startsWith('```')) {
                cleanText = text.replace(/```\n?/g, '').trim();
            }

            // Parse the JSON array from the response
            const words = JSON.parse(cleanText);
            return words.slice(0, count); // Ensure we only return the requested count
        } catch (error) {
            console.error('AI word generation error:', error);
            throw new Error('Failed to generate words with AI');
        }
    };

    const transferAdminToNextEligible = (room) => {
        // Find connected players excluding current admin
        const eligiblePlayers = room.players
            .filter(p => p.connected && p.id !== room.adminId)
            .sort((a, b) => a.connectedAt - b.connectedAt); // Oldest first

        if (eligiblePlayers.length > 0) {
            room.adminId = eligiblePlayers[0].id;
            return true;
        }
        return false; // No eligible players
    };

    const getRandomWords = (count) => {
        try {
            const filePath = path.join(__dirname, 'base_aleatoria.json');
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const allWords = JSON.parse(fileContent);

            // Shuffle and select N unique words
            const shuffled = [...allWords].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, Math.min(count, allWords.length));
        } catch (error) {
            console.error('Error reading base_aleatoria.json:', error);
            throw new Error('Failed to load random words');
        }
    };

    // Socket.io Logic
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('create_room', ({ name }, callback) => {
            const code = generateCode();
            rooms.set(code, {
                code,
                adminId: socket.id,
                players: [{ id: socket.id, name, score: 0, isImpostor: false, word: null, connected: true, connectedAt: Date.now() }],
                settings: { rounds: 3, words: [] },
                state: 'LOBBY',
                currentRound: 0,
                votes: {},
            });
            socket.join(code);
            callback({ success: true, code });
            io.to(code).emit('room_update', rooms.get(code));
        });

        socket.on('join_room', ({ code, name }, callback) => {
            const room = rooms.get(code);
            if (!room) return callback({ success: false, error: 'Room not found' });

            room.players.push({ id: socket.id, name, score: 0, isImpostor: false, word: null, connected: true, connectedAt: Date.now() });
            socket.join(code);
            callback({ success: true, room });
            io.to(code).emit('room_update', room);
        });

        socket.on('check_room', ({ code }, callback) => {
            const room = rooms.get(code);
            if (!room) return callback({ exists: false });
            callback({
                exists: true,
                state: room.state,
                players: room.players
            });
        });

        socket.on('rejoin_game', ({ code, targetPlayerId }, callback) => {
            const room = rooms.get(code);
            if (!room) return callback({ success: false, error: 'Room not found' });

            const playerIndex = room.players.findIndex(p => p.id === targetPlayerId);
            if (playerIndex === -1) return callback({ success: false, error: 'Player not found' });

            const player = room.players[playerIndex];
            if (player.connected) return callback({ success: false, error: 'Player already connected' });

            // Check if ALL players are currently disconnected (session abandonment)
            const allDisconnected = room.players.every(p => !p.connected);

            // Update player ID to new socket ID
            player.id = socket.id;
            player.connected = true;

            socket.join(code);

            // If session was abandoned, grant admin to first reconnecting player
            if (allDisconnected) {
                room.adminId = socket.id;
                console.log(`Session abandoned - Admin granted to first reconnecting player ${socket.id} in room ${code}`);
            }

            callback({ success: true, room });
            io.to(code).emit('room_update', room);
        });

        socket.on('update_settings', ({ code, settings }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            room.settings = { ...room.settings, ...settings };
            io.to(code).emit('room_update', room);
        });

        socket.on('generate_ai_words', async ({ code, theme, count }, callback) => {
            const room = rooms.get(code);
            if (!room) return callback({ success: false, error: 'Room not found' });
            if (room.adminId !== socket.id) return callback({ success: false, error: 'Only admin can generate words' });

            if (!process.env.GEMINI_API_KEY) {
                return callback({ success: false, error: 'AI word generation not configured. Add GEMINI_API_KEY to environment.' });
            }

            try {
                const words = await generateWordsWithAI(theme, count);
                room.settings.words = words;
                room.settings.aiGenerated = true; // Mark as AI-generated
                room.settings.theme = theme; // Store theme for reference
                callback({ success: true, count: words.length });
                io.to(code).emit('room_update', room);
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        socket.on('start_game', ({ code }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            if (room.settings.words.length < room.settings.rounds) {
                return; // Not enough words
            }

            room.state = 'PLAYING';
            room.currentRound = 1;

            // Assign roles for first round
            assignRoles(room);

            io.to(code).emit('room_update', room);
        });

        socket.on('start_random_game', ({ code }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            try {
                // Get random words based on number of rounds
                const randomWords = getRandomWords(room.settings.rounds);

                // Update room settings with random words
                room.settings.words = randomWords;
                room.settings.aiGenerated = false;
                room.settings.theme = null;

                // Start the game
                room.state = 'PLAYING';
                room.currentRound = 1;
                room.votes = {};
                assignRoles(room);

                io.to(code).emit('room_update', room);
            } catch (error) {
                console.error('Error starting random game:', error);
            }
        });

        socket.on('start_voting', ({ code }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            room.state = 'VOTING';
            io.to(code).emit('room_update', room);
        });

        socket.on('submit_vote', ({ code, targetId }) => {
            const room = rooms.get(code);
            if (!room) return;

            room.votes[socket.id] = targetId;

            // Check if all players voted
            if (Object.keys(room.votes).length === room.players.length) {
                // Calculate results
                calculateResults(room);
                room.state = 'ROUND_END';
                io.to(code).emit('room_update', room);
            } else {
                io.to(code).emit('room_update', room);
            }
        });

        socket.on('next_round', ({ code }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            if (room.currentRound >= room.settings.rounds) {
                room.state = 'GAME_END';
            } else {
                room.currentRound += 1;
                room.state = 'PLAYING';
                room.votes = {};
                room.lastRoundResult = null;
                assignRoles(room);
            }
            io.to(code).emit('room_update', room);
        });

        socket.on('end_game', ({ code }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            room.state = 'GAME_END';
            io.to(code).emit('room_update', room);
        });

        socket.on('restart_game', ({ code }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            // Reset room state
            room.state = 'LOBBY';
            room.currentRound = 0;
            room.votes = {};
            room.lastRoundResult = null;

            // Reset player scores and roles
            room.players.forEach(p => {
                p.score = 0;
                p.isImpostor = false;
                p.word = null;
            });

            io.to(code).emit('room_update', room);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Handle disconnect: remove player from room OR mark as disconnected
            rooms.forEach((room, code) => {
                const index = room.players.findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    const wasAdmin = room.adminId === socket.id;

                    if (room.state === 'LOBBY' || room.state === 'GAME_END') {
                        // In Lobby or Game End, remove completely
                        room.players.splice(index, 1);
                        if (room.players.length === 0) {
                            rooms.delete(code);
                        } else {
                            // Transfer admin if disconnected player was admin
                            if (wasAdmin) {
                                transferAdminToNextEligible(room);
                            }
                            io.to(code).emit('room_update', room);
                        }
                    } else {
                        // In Game, mark as disconnected
                        room.players[index].connected = false;

                        // Transfer admin if disconnected player was admin
                        if (wasAdmin) {
                            const transferred = transferAdminToNextEligible(room);
                            if (transferred) {
                                console.log(`Admin transferred from ${socket.id} to ${room.adminId} in room ${code}`);
                            } else {
                                console.log(`No eligible players to transfer admin in room ${code}`);
                            }
                        }

                        io.to(code).emit('room_update', room);

                        // Optional: If everyone is disconnected, maybe clean up after a timeout?
                        // For now, we'll leave the room alive until restart.
                    }
                }
            });
        });
    });

    // Default Next.js handler
    server.use((req, res) => {
        return handle(req, res);
    });

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
