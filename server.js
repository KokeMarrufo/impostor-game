const { createServer } = require('http');
const next = require('next');
const socketIo = require('socket.io');
const express = require('express');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

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

    // Socket.io Logic
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('create_room', ({ name }, callback) => {
            const code = generateCode();
            rooms.set(code, {
                code,
                adminId: socket.id,
                players: [{ id: socket.id, name, score: 0, isImpostor: false, word: null }],
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

            room.players.push({ id: socket.id, name, score: 0, isImpostor: false, word: null });
            socket.join(code);
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

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Handle disconnect: remove player from room
            rooms.forEach((room, code) => {
                const index = room.players.findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    room.players.splice(index, 1);
                    if (room.players.length === 0) {
                        rooms.delete(code);
                    } else {
                        // If admin left, assign new admin
                        if (room.adminId === socket.id) {
                            room.adminId = room.players[0].id;
                        }
                        io.to(code).emit('room_update', room);
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
