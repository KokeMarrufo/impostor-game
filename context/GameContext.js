'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [gameState, setGameState] = useState(null);
    const [socket, setSocket] = useState(null);
    const [playerId, setPlayerId] = useState(null);

    useEffect(() => {
        const s = getSocket();
        setSocket(s);

        s.on('connect', () => {
            setPlayerId(s.id);
        });

        s.on('room_update', (state) => {
            setGameState(state);
        });

        return () => {
            s.off('connect');
            s.off('room_update');
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

    return (
        <GameContext.Provider value={{ gameState, createRoom, joinRoom, updateSettings, generateAIWords, startGame, startVoting, submitVote, nextRound, socket, playerId }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
