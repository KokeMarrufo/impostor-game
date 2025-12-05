'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [gameState, setGameState] = useState(null);
    const [socket, setSocket] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    // Werewolf mode state
    const [myRole, setMyRole] = useState(null);
    const [nightDeaths, setNightDeaths] = useState([]);
    const [hunterRevengeActive, setHunterRevengeActive] = useState(false);
    const [votedOutData, setVotedOutData] = useState(null);
    const [gameEndedData, setGameEndedData] = useState(null);

    useEffect(() => {
        const s = getSocket();
        setSocket(s);

        s.on('connect', () => {
            setPlayerId(s.id);
        });

        s.on('room_update', (state) => {
            setGameState(state);
        });

        // Werewolf mode listeners
        s.on('role_assigned', (data) => {
            setMyRole(data);
        });

        s.on('phase_changed', (data) => {
            console.log('Phase changed:', data);
        });

        s.on('night_ended', (data) => {
            setNightDeaths(data.deaths);
        });

        s.on('hunter_revenge_trigger', (data) => {
            setHunterRevengeActive(true);
        });

        s.on('hunter_shot', (data) => {
            // Hunter shot someone - show their death
            setHunterRevengeActive(false); // Deactivate hunter revenge
            setNightDeaths(data.deaths); // Show the death(s)
        });

        s.on('voted_out_werewolf', (data) => {
            setVotedOutData(data);
        });

        s.on('game_ended', (data) => {
            setGameEndedData(data);
        });

        s.on('lover_linked', ({ loverName }) => {
            // Update myRole to include lover name
            setMyRole(prev => prev ? { ...prev, loverName } : null);
        });

        return () => {
            s.off('connect');
            s.off('room_update');
            s.off('role_assigned');
            s.off('phase_changed');
            s.off('night_ended');
            s.off('hunter_revenge_trigger');
            s.off('hunter_shot');
            s.off('voted_out_werewolf');
            s.off('game_ended');
            s.off('lover_linked');
        };
    }, []);

    const createRoom = (name) => {
        return new Promise((resolve) => {
            socket.emit('create_room', { name }, resolve);
        });
    };

    const joinRoom = (code, name) => {
        return new Promise((resolve) => {
            socket.emit('join_room', { code, name }, resolve);
        });
    };

    const checkRoom = (code) => {
        return new Promise((resolve) => {
            socket.emit('check_room', { code }, resolve);
        });
    };

    const rejoinGame = (code, targetPlayerId, adminPin) => {
        return new Promise((resolve) => {
            socket.emit('rejoin_game', { code, targetPlayerId, adminPin }, (result) => {
                if (result.success) {
                    // Update playerId to new socket.id after rejoin
                    setPlayerId(socket.id);
                }
                resolve(result);
            });
        });
    };

    const updateSettings = (code, settings) => {
        socket.emit('update_settings', { code, settings });
    };

    const startGame = (code) => {
        socket.emit('start_game', { code });
    };

    const startVoting = (code) => {
        socket.emit('start_voting', { code });
    };

    const submitVote = (code, targetId) => {
        socket.emit('submit_vote', { code, targetId });
    };

    const nextRound = (code) => {
        socket.emit('next_round', { code });
    };

    const generateAIWords = (code, theme, count) => {
        return new Promise((resolve) => {
            socket.emit('generate_ai_words', { code, theme, count }, resolve);
        });
    };

    const endGame = (code) => {
        socket.emit('end_game', { code });
    };

    const restartGame = (code) => {
        socket.emit('restart_game', { code });
    };

    const startRandomGame = (code) => {
        socket.emit('start_random_game', { code });
    };

    // ===== WEREWOLF MODE FUNCTIONS =====

    const startWerewolfGame = (code) => {
        socket.emit('start_werewolf_game', { code });
    };

    const cupidLink = (code, player1Id, player2Id) => {
        return new Promise((resolve) => {
            socket.emit('cupid_link', { code, player1Id, player2Id }, resolve);
        });
    };

    const markNightVictim = (code, victimId) => {
        return new Promise((resolve) => {
            socket.emit('mark_night_victim', { code, victimId }, resolve);
        });
    };

    const useLifePotion = (code) => {
        return new Promise((resolve) => {
            socket.emit('witch_use_life_potion', { code }, resolve);
        });
    };

    const useDeathPotion = (code, targetId) => {
        return new Promise((resolve) => {
            socket.emit('witch_use_death_potion', { code, targetId }, resolve);
        });
    };

    const endNight = (code) => {
        socket.emit('end_night', { code });
    };

    const hunterShoots = (code, targetId) => {
        return new Promise((resolve) => {
            socket.emit('hunter_shoots', { code, targetId }, resolve);
        });
    };

    const startWerewolfVoting = (code) => {
        socket.emit('start_werewolf_voting', { code });
    };

    const castWerewolfVote = (code, targetId) => {
        return new Promise((resolve) => {
            socket.emit('cast_werewolf_vote', { code, targetId }, resolve);
        });
    };

    const getAllRoles = (code) => {
        return new Promise((resolve) => {
            socket.emit('get_all_roles', { code }, resolve);
        });
    };

    return (
        <GameContext.Provider value={{
            gameState,
            createRoom,
            joinRoom,
            checkRoom,
            rejoinGame,
            updateSettings,
            generateAIWords,
            startGame,
            startRandomGame,
            startVoting,
            submitVote,
            nextRound,
            endGame,
            restartGame,
            // Werewolf mode state
            myRole,
            nightDeaths,
            hunterRevengeActive,
            votedOutData,
            gameEndedData,
            // Werewolf mode functions
            startWerewolfGame,
            cupidLink,
            markNightVictim,
            useLifePotion,
            useDeathPotion,
            endNight,
            hunterShoots,
            startWerewolfVoting,
            castWerewolfVote,
            getAllRoles,
            socket,
            playerId
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
