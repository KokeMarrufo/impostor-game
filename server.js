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

    // ===== WEREWOLF GAME MODE HELPER FUNCTIONS =====

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const getRoleDescription = (role) => {
        const descriptions = {
            'Lobo': 'Eres un LOBO. Debes eliminar a los aldeanos sin ser descubierto.',
            'Aldeano': 'Eres un ALDEANO. Debes identificar y eliminar a los lobos.',
            'Vidente': 'Eres el VIDENTE. Puedes ver el rol de un jugador cada noche.',
            'Bruja': 'Eres la BRUJA. Tienes una poción de vida y una de muerte (uso único).',
            'Cazador': 'Eres el CAZADOR. Si mueres, puedes disparar a un jugador.',
            'Cupido': 'Eres CUPIDO. En la primera noche, enlazas a dos enamorados.',
            'Niña Pequeña': 'Eres la NIÑA PEQUEÑA. Puedes espiar a los lobos por la noche.',
            'Sheriff': 'Eres el SHERIFF. Tu voto desempata en caso de empate.'
        };
        return descriptions[role] || 'Rol desconocido';
    };

    const assignWerewolfRoles = (room) => {
        const { numWolves, numSeers, numWitches, numHunters, hasCupid, hasLittleGirl } = room.werewolfConfig;

        // Exclude admin (narrator) from role assignment
        const playersToAssign = room.players.filter(p => p.id !== room.adminId);
        const roles = [];

        // Create role pool
        for (let i = 0; i < numWolves; i++) roles.push('Lobo');
        for (let i = 0; i < numSeers; i++) roles.push('Vidente');
        for (let i = 0; i < numWitches; i++) roles.push('Bruja');
        for (let i = 0; i < numHunters; i++) roles.push('Cazador');
        if (hasCupid) roles.push('Cupido');
        if (hasLittleGirl) roles.push('Niña Pequeña');

        // Fill remaining with Aldeanos
        while (roles.length < playersToAssign.length) {
            roles.push('Aldeano');
        }

        // Shuffle roles
        shuffleArray(roles);

        // Assign roles to players (excluding admin)
        playersToAssign.forEach((player, index) => {
            player.role = roles[index];
            player.isAlive = true;
            room.isAlive[player.id] = true;
        });

        // Admin doesn't get a role
        const admin = room.players.find(p => p.id === room.adminId);
        if (admin) {
            admin.role = null;
            admin.isAlive = false; // Admin is not "in the game"
            room.isAlive[admin.id] = false;
        }
    };

    const processPlayerDeath = (room, playerId, reason) => {
        const deaths = [];
        const processedIds = new Set();

        const killPlayer = (id, deathReason) => {
            if (processedIds.has(id)) return;

            const player = room.players.find(p => p.id === id);
            if (!player || !player.isAlive) return;

            player.isAlive = false;
            room.isAlive[id] = false;
            processedIds.add(id);

            deaths.push({
                playerId: id,
                playerName: player.name,
                role: player.role,
                isWerewolf: player.role === 'Lobo',
                reason: deathReason
            });

            // Check for lover
            if (player.isLover && player.linkedTo) {
                const lover = room.players.find(p => p.id === player.linkedTo);
                if (lover && lover.isAlive) {
                    killPlayer(lover.id, 'Love');
                }
            }
        };

        killPlayer(playerId, reason);
        return deaths;
    };

    const checkWerewolfVictory = (room) => {
        const alivePlayers = room.players.filter(p => room.isAlive[p.id]);
        const aliveWolves = alivePlayers.filter(p => p.role === 'Lobo');
        const aliveVillagers = alivePlayers.filter(p => p.role !== 'Lobo');

        if (aliveWolves.length === 0) {
            return { gameOver: true, winner: 'VILLAGERS' };
        }

        if (aliveWolves.length >= aliveVillagers.length) {
            return { gameOver: true, winner: 'WEREWOLVES' };
        }

        return { gameOver: false };
    };

    // Socket.io Logic
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('create_room', ({ name }, callback) => {
            const code = generateCode();
            const adminPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN

            rooms.set(code, {
                code,
                adminId: socket.id,
                adminPin, // PIN for admin rejoin
                adminPlayerName: name, // Store admin's player name for rejoin identification
                players: [{
                    id: socket.id,
                    name,
                    score: 0,
                    // Impostor mode fields
                    isImpostor: false,
                    word: null,
                    // Werewolf mode fields
                    role: null,
                    isAlive: true,
                    isLover: false,
                    linkedTo: null,
                    // Connection tracking
                    connected: true,
                    connectedAt: Date.now()
                }],
                settings: { rounds: 3, words: [] },
                gameMode: 'IMPOSTOR', // 'IMPOSTOR' or 'LOBO'
                // Werewolf configuration
                werewolfConfig: {
                    numWolves: 2,
                    numSeers: 1,
                    numWitches: 1,
                    numHunters: 1,
                    hasCupid: true,
                    hasLittleGirl: false,
                    sheriffId: null
                },
                // Werewolf game state
                currentPhase: 'SETUP', // 'SETUP', 'NIGHT', 'DAY', 'VOTING', 'HUNTER_REVENGE', 'ENDED'
                cupidLinked: false,
                lovers: {
                    player1Id: null,
                    player2Id: null
                },
                witchPotions: {
                    lifePotionUsed: false,
                    deathPotionUsed: false
                },
                nightVictimId: null,
                witchDeathTargetId: null,
                nightNumber: 0,
                isAlive: {}, // Map of playerId -> boolean
                // Common fields
                state: 'LOBBY',
                currentRound: 0,
                votes: {},
            });
            socket.join(code);
            callback({ success: true, code, adminPin }); // Return PIN to admin
            io.to(code).emit('room_update', rooms.get(code));
        });

        socket.on('join_room', ({ code, name }, callback) => {
            const room = rooms.get(code);
            if (!room) return callback({ success: false, error: 'Room not found' });

            room.players.push({
                id: socket.id,
                name,
                score: 0,
                // Impostor mode fields
                isImpostor: false,
                word: null,
                // Werewolf mode fields
                role: null,
                isAlive: true,
                isLover: false,
                linkedTo: null,
                // Connection tracking
                connected: true,
                connectedAt: Date.now()
            });
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
                players: room.players,
                adminPlayerName: room.adminPlayerName // Include admin player name for rejoin identification
            });
        });

        socket.on('rejoin_game', ({ code, targetPlayerId, adminPin }, callback) => {
            const room = rooms.get(code);
            if (!room) return callback({ success: false, error: 'Room not found' });

            const playerIndex = room.players.findIndex(p => p.id === targetPlayerId);
            if (playerIndex === -1) return callback({ success: false, error: 'Player not found' });

            const player = room.players[playerIndex];

            // Check if trying to rejoin as admin by comparing player name
            const isAdminRejoin = player.name === room.adminPlayerName;

            if (isAdminRejoin) {
                // Validate admin PIN
                if (!adminPin || adminPin !== room.adminPin) {
                    return callback({ success: false, error: 'Invalid admin PIN' });
                }
            }

            if (player.connected) return callback({ success: false, error: 'Player already connected' });

            // Check if ALL players are currently disconnected (session abandonment)
            const allDisconnected = room.players.every(p => !p.connected);

            // Update player ID to new socket ID
            player.id = socket.id;
            player.connected = true;

            socket.join(code);

            // Admin reassignment logic
            if (allDisconnected) {
                // In Lobo mode, NEVER reassign admin - game is ruined without original narrator
                // In Impostor mode, allow admin reassignment for abandoned sessions
                if (room.gameMode === 'IMPOSTOR') {
                    room.adminId = socket.id;
                    console.log(`Session abandoned - Admin granted to first reconnecting player ${socket.id} in room ${code}`);
                }
                // In Lobo mode, don't reassign admin even if abandoned
            } else if (isAdminRejoin) {
                // Restore admin status (PIN already validated above)
                room.adminId = socket.id;
            }

            // If rejoining during Werewolf game, resend role data
            if (room.gameMode === 'LOBO' && room.state === 'WEREWOLF_PLAYING' && player.role && !isAdminRejoin) {
                const allies = player.role === 'Lobo'
                    ? room.players.filter(p => p.role === 'Lobo' && p.id !== player.id).map(p => p.name)
                    : [];

                const loverName = player.isLover && player.linkedTo
                    ? room.players.find(p => p.id === player.linkedTo)?.name
                    : null;

                io.to(socket.id).emit('role_assigned', {
                    roleName: player.role,
                    description: getRoleDescription(player.role),
                    allies,
                    loverName
                });
            }

            callback({ success: true, room });
            io.to(code).emit('room_update', room);
        });

        socket.on('update_settings', ({ code, settings }) => {
            const room = rooms.get(code);
            if (!room) return;
            if (room.adminId !== socket.id) return;

            // Update regular settings
            if (settings.rounds !== undefined || settings.words !== undefined) {
                room.settings = { ...room.settings, ...settings };
            }

            // Update game mode
            if (settings.gameMode !== undefined) {
                room.gameMode = settings.gameMode;
            }

            // Update werewolf config
            if (settings.werewolfConfig !== undefined) {
                room.werewolfConfig = { ...room.werewolfConfig, ...settings.werewolfConfig };
            }

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

        // ===== WEREWOLF MODE SOCKET EVENTS =====

        socket.on('start_werewolf_game', ({ code }) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id || room.gameMode !== 'LOBO') return;

            // Assign roles
            assignWerewolfRoles(room);
            room.currentPhase = 'NIGHT';
            room.nightNumber = 1;
            room.state = 'WEREWOLF_PLAYING';

            // Send roles privately to each player (excluding admin/narrator)
            room.players.forEach(player => {
                // Skip admin - they don't get a role
                if (player.id === room.adminId) return;

                const allies = player.role === 'Lobo'
                    ? room.players.filter(p => p.role === 'Lobo' && p.id !== player.id).map(p => p.name)
                    : [];

                // Get lover partner name if player is a lover
                const loverName = player.isLover && player.linkedTo
                    ? room.players.find(p => p.id === player.linkedTo)?.name
                    : null;

                io.to(player.id).emit('role_assigned', {
                    roleName: player.role,
                    description: getRoleDescription(player.role),
                    allies,
                    loverName // Name of lover partner (without role)
                });
            });

            io.to(code).emit('room_update', room);
            io.to(code).emit('phase_changed', { phase: 'NIGHT', message: '🌙 Es de noche...' });
        });

        socket.on('cupid_link', ({ code, player1Id, player2Id }, callback) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) return callback({ success: false, error: 'Not authorized' });

            const p1 = room.players.find(p => p.id === player1Id);
            const p2 = room.players.find(p => p.id === player2Id);

            if (!p1 || !p2) return callback({ success: false, error: 'Players not found' });

            p1.isLover = true;
            p1.linkedTo = player2Id;
            p2.isLover = true;
            p2.linkedTo = player1Id;

            room.cupidLinked = true;
            room.lovers = { player1Id, player2Id };

            // Notify both lovers about their partner
            io.to(p1.id).emit('lover_linked', { loverName: p2.name });
            io.to(p2.id).emit('lover_linked', { loverName: p1.name });

            io.to(code).emit('room_update', room);
            callback({ success: true, player1Name: p1.name, player2Name: p2.name });
        });

        socket.on('set_sheriff', ({ code, playerId }) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) return;

            room.werewolfConfig.sheriffId = playerId;
            io.to(code).emit('room_update', room);
        });

        socket.on('revive_player', ({ code, playerId }) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) return;

            // Revive the player
            room.isAlive[playerId] = true;

            console.log(`Player ${playerId} revived by admin in room ${code}`);
            io.to(code).emit('room_update', room);
        });

        socket.on('mark_night_victim', ({ code, victimId }, callback) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) return callback({ success: false });

            room.nightVictimId = victimId;
            io.to(code).emit('room_update', room);
            callback({ success: true });
        });

        socket.on('witch_use_life_potion', ({ code }, callback) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id || room.witchPotions.lifePotionUsed) {
                return callback({ success: false, error: 'Cannot use potion' });
            }

            room.witchPotions.lifePotionUsed = true;
            room.nightVictimId = null; // Cancel death

            io.to(code).emit('room_update', room);
            callback({ success: true });
        });

        socket.on('witch_use_death_potion', ({ code, targetId }, callback) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id || room.witchPotions.deathPotionUsed) {
                return callback({ success: false, error: 'Cannot use potion' });
            }

            room.witchPotions.deathPotionUsed = true;
            room.witchDeathTargetId = targetId;

            io.to(code).emit('room_update', room);
            callback({ success: true });
        });

        socket.on('end_night', ({ code }) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) return;

            let allDeaths = [];

            // Process wolf victim
            if (room.nightVictimId) {
                const deaths = processPlayerDeath(room, room.nightVictimId, 'Night');
                allDeaths = allDeaths.concat(deaths);
            }

            // Process witch death potion victim
            if (room.witchDeathTargetId) {
                const deaths = processPlayerDeath(room, room.witchDeathTargetId, 'Witch');
                allDeaths = allDeaths.concat(deaths);
            }

            // Reset night victims
            room.nightVictimId = null;
            room.witchDeathTargetId = null;

            // Check if any dead hunters
            const deadHunters = allDeaths.filter(d => d.role === 'Cazador');

            if (deadHunters.length > 0) {
                // Activate hunter revenge
                room.currentPhase = 'HUNTER_REVENGE';
                const hunter = room.players.find(p => p.id === deadHunters[0].playerId);

                io.to(code).emit('night_ended', { deaths: allDeaths });
                io.to(code).emit('phase_changed', { phase: 'HUNTER_REVENGE', message: '🏹 El Cazador busca venganza...' });
                io.to(hunter.id).emit('hunter_revenge_trigger', {
                    alivePlayers: room.players.filter(p => room.isAlive[p.id])
                });
            } else {
                // Check victory
                const victoryCheck = checkWerewolfVictory(room);

                if (victoryCheck.gameOver) {
                    room.currentPhase = 'ENDED';
                    room.state = 'WEREWOLF_ENDED';
                    io.to(code).emit('game_ended', {
                        winner: victoryCheck.winner,
                        survivors: room.players.filter(p => room.isAlive[p.id]),
                        allDeaths
                    });
                } else {
                    room.currentPhase = 'DAY';
                    io.to(code).emit('night_ended', { deaths: allDeaths });
                    io.to(code).emit('phase_changed', { phase: 'DAY', message: '☀️ Amaneció...' });
                }
            }

            io.to(code).emit('room_update', room);
        });

        socket.on('hunter_shoots', ({ code, targetId }, callback) => {
            const room = rooms.get(code);
            if (!room || room.currentPhase !== 'HUNTER_REVENGE') {
                return callback({ success: false, error: 'Not in hunter revenge phase' });
            }

            const deaths = processPlayerDeath(room, targetId, 'Hunter');

            io.to(code).emit('hunter_shot', {
                targetId,
                targetName: deaths[0].playerName,
                targetRole: deaths[0].role,
                deaths
            });

            // Check victory
            const victoryCheck = checkWerewolfVictory(room);

            if (victoryCheck.gameOver) {
                room.currentPhase = 'ENDED';
                room.state = 'WEREWOLF_ENDED';
                io.to(code).emit('game_ended', {
                    winner: victoryCheck.winner,
                    survivors: room.players.filter(p => room.isAlive[p.id])
                });
            } else {
                room.currentPhase = 'DAY';
                io.to(code).emit('phase_changed', { phase: 'DAY' });
            }

            io.to(code).emit('room_update', room);
            callback({ success: true });
        });

        socket.on('start_night', ({ code }) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) return;

            room.currentPhase = 'NIGHT';
            room.nightNumber++;
            room.votes = {};

            io.to(code).emit('phase_changed', { phase: 'NIGHT', message: '🌙 Es de noche...' });
            io.to(code).emit('room_update', room);
        });

        socket.on('start_werewolf_voting', ({ code }) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) return;

            room.currentPhase = 'VOTING';
            room.votes = {};

            io.to(code).emit('voting_started', {
                alivePlayers: room.players.filter(p => room.isAlive[p.id])
            });
            io.to(code).emit('room_update', room);
        });

        socket.on('cast_werewolf_vote', ({ code, targetId }, callback) => {
            const room = rooms.get(code);
            if (!room || !room.isAlive[socket.id]) {
                return callback({ success: false, error: 'Cannot vote' });
            }

            room.votes[socket.id] = targetId;

            // Check if all alive players voted
            const alivePlayers = room.players.filter(p => room.isAlive[p.id]);
            const votedCount = Object.keys(room.votes).filter(id => room.isAlive[id]).length;

            if (votedCount === alivePlayers.length) {
                // Calculate result
                const voteCounts = {};
                Object.values(room.votes).forEach(tId => {
                    voteCounts[tId] = (voteCounts[tId] || 0) + 1;
                });

                let maxVotes = 0;
                let votedOutId = null;
                const tied = [];

                Object.entries(voteCounts).forEach(([id, count]) => {
                    if (count > maxVotes) {
                        maxVotes = count;
                        votedOutId = id;
                        tied.length = 0;
                        tied.push(id);
                    } else if (count === maxVotes) {
                        tied.push(id);
                    }
                });

                // Tiebreaker with Sheriff
                if (tied.length > 1 && room.werewolfConfig.sheriffId) {
                    const sheriffVote = room.votes[room.werewolfConfig.sheriffId];
                    if (sheriffVote && tied.includes(sheriffVote)) {
                        votedOutId = sheriffVote;
                    }
                }

                // Process death
                const deaths = processPlayerDeath(room, votedOutId, 'Lynch');

                io.to(code).emit('voted_out_werewolf', {
                    ...deaths[0],
                    voteCount: maxVotes,
                    allDeaths: deaths
                });

                // Check for dead hunter
                const deadHunter = deaths.find(d => d.role === 'Cazador');

                if (deadHunter) {
                    room.currentPhase = 'HUNTER_REVENGE';
                    io.to(code).emit('phase_changed', { phase: 'HUNTER_REVENGE', message: '🏹 El Cazador busca venganza...' });
                    io.to(deadHunter.playerId).emit('hunter_revenge_trigger', {
                        alivePlayers: room.players.filter(p => room.isAlive[p.id])
                    });
                } else {
                    // Check victory
                    const victoryCheck = checkWerewolfVictory(room);

                    if (victoryCheck.gameOver) {
                        room.currentPhase = 'ENDED';
                        room.state = 'WEREWOLF_ENDED';
                        io.to(code).emit('game_ended', {
                            winner: victoryCheck.winner,
                            survivors: room.players.filter(p => room.isAlive[p.id])
                        });
                    } else {
                        room.currentPhase = 'NIGHT';
                        room.nightNumber++;
                        io.to(code).emit('phase_changed', { phase: 'NIGHT', message: '🌙 Es de noche...' });
                    }
                }

                io.to(code).emit('room_update', room);
            } else {
                io.to(code).emit('room_update', room);
            }

            callback({ success: true });
        });

        socket.on('get_all_roles', ({ code }, callback) => {
            const room = rooms.get(code);
            if (!room || room.adminId !== socket.id) {
                return callback({ success: false, error: 'Not authorized' });
            }

            const rolesData = room.players.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role,
                isAlive: room.isAlive[p.id],
                isLover: p.isLover,
                linkedTo: p.linkedTo
            }));

            callback({ success: true, roles: rolesData });
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
                        // BUT ONLY in Impostor mode - in Lobo mode, admin must rejoin with PIN
                        if (wasAdmin && room.gameMode === 'IMPOSTOR') {
                            const transferred = transferAdminToNextEligible(room);
                            if (transferred) {
                                console.log(`Admin transferred from ${socket.id} to ${room.adminId} in room ${code}`);
                            } else {
                                console.log(`No eligible players to transfer admin in room ${code}`);
                            }
                        } else if (wasAdmin && room.gameMode === 'LOBO') {
                            console.log(`Admin disconnected in Lobo mode - must rejoin with PIN in room ${code}`);
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
