'use client';
import { use, useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import Lobby from '@/components/Lobby';
import CardReveal from '@/components/CardReveal';
import Voting from '@/components/Voting';
import RoundResult from '@/components/RoundResult';
import GameResult from '@/components/GameResult';
// Werewolf components
import RoleCard from '@/components/werewolf/RoleCard';
import NightScreen from '@/components/werewolf/NightScreen';
import VotingPanel from '@/components/werewolf/VotingPanel';
import DeathScreen from '@/components/werewolf/DeathScreen';
import HunterRevenge from '@/components/werewolf/HunterRevenge';
import NarratorPanel from '@/components/werewolf/NarratorPanel';
import WerewolfGameResult from '@/components/werewolf/GameResult';

export default function Room({ params }) {
    const { code } = use(params);
    const {
        gameState,
        socket,
        checkRoom,
        joinRoom,
        rejoinGame,
        playerId,
        endGame,
        restartGame,
        // Werewolf state
        myRole,
        nightDeaths,
        hunterRevengeActive,
        votedOutData,
        gameEndedData
    } = useGame();
    const [status, setStatus] = useState('loading'); // loading, join, rejoin, error
    const [roomInfo, setRoomInfo] = useState(null);
    const [name, setName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (gameState) {
            setStatus('playing');
            return;
        }

        if (socket && code) {
            checkRoom(code).then((result) => {
                if (!result.exists) {
                    setStatus('error');
                    setErrorMsg('Room not found');
                } else if (result.state === 'LOBBY' || result.state === 'GAME_END') {
                    setStatus('join');
                } else {
                    // Game in progress
                    setRoomInfo(result);
                    setStatus('rejoin');
                }
            });
        }
    }, [socket, code, gameState]);

    const handleJoin = async () => {
        if (!name.trim()) return;
        const { success, error } = await joinRoom(code, name);
        if (!success) {
            alert(error);
        }
    };

    const handleRejoin = async (targetId) => {
        // Find the player being rejoined
        const targetPlayer = roomInfo?.players.find(p => p.id === targetId);

        // Check if this player is the admin by comparing names
        const isAdmin = targetPlayer && roomInfo?.adminPlayerName && targetPlayer.name === roomInfo.adminPlayerName;
        let adminPin = null;

        if (isAdmin) {
            adminPin = prompt('Enter Admin PIN to rejoin as narrator:');
            if (!adminPin) return; // User cancelled
        }

        const { success, error } = await rejoinGame(code, targetId, adminPin);
        if (!success) {
            alert(error);
            // Refresh room info
            const result = await checkRoom(code);
            if (result.exists) setRoomInfo(result);
        }
    };

    if (status === 'loading') {
        return (
            <main className="container" style={{ alignItems: 'center' }}>
                <div className="card">
                    <h2>Connecting...</h2>
                    <p>Room: {code}</p>
                </div>
            </main>
        );
    }

    if (status === 'error') {
        return (
            <main className="container" style={{ alignItems: 'center' }}>
                <div className="card">
                    <h2 style={{ color: 'var(--error)' }}>Error</h2>
                    <p>{errorMsg}</p>
                    <a href="/" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Go Home</a>
                </div>
            </main>
        );
    }

    if (status === 'join') {
        return (
            <main className="container" style={{ alignItems: 'center' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                    <h2>Join Room {code}</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Enter your name to join</p>
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        maxLength={12}
                        autoFocus
                    />
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                        onClick={handleJoin}
                        disabled={!name.trim()}
                    >
                        Join Game
                    </button>
                </div>
            </main>
        );
    }

    if (status === 'rejoin') {
        const disconnectedPlayers = roomInfo?.players.filter(p => !p.connected) || [];
        const activePlayers = roomInfo?.players.filter(p => p.connected) || [];

        return (
            <main className="container" style={{ alignItems: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                    <h2>Game in Progress</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                        The game has already started. You can rejoin as a disconnected player.
                    </p>

                    {disconnectedPlayers.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem' }}>Select your session to rejoin:</h3>
                            {disconnectedPlayers.map(p => (
                                <button
                                    key={p.id}
                                    className="btn btn-secondary"
                                    onClick={() => handleRejoin(p.id)}
                                    style={{ justifyContent: 'space-between' }}
                                >
                                    <span>{p.name}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Disconnected</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>
                            <p>No disconnected players found.</p>
                        </div>
                    )}

                    {activePlayers.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Active Players</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {activePlayers.map(p => (
                                    <span key={p.id} style={{ padding: '4px 12px', background: 'var(--surface-hover)', borderRadius: '16px', fontSize: '0.875rem', opacity: 0.7 }}>
                                        {p.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // status === 'playing' (gameState is present)
    const isWerewolfMode = gameState?.gameMode === 'LOBO';
    const isAdmin = gameState?.adminId === playerId;

    // Werewolf mode rendering
    if (isWerewolfMode) {
        const currentPhase = gameState.currentPhase;
        const myPlayer = gameState.players?.find(p => p.id === playerId);
        const isAlive = myPlayer?.isAlive;

        return (
            <main className="container">
                {/* Lobby */}
                {gameState.state === 'LOBBY' && <Lobby code={code} />}

                {/* Game Started */}
                {gameState.state === 'WEREWOLF_PLAYING' && (
                    <>
                        {/* Phase Indicator - Show to all players */}
                        {!isAdmin && (
                            <div style={{
                                position: 'fixed',
                                top: '1rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.9)',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '999px',
                                border: '2px solid',
                                borderColor: gameState.currentPhase === 'NIGHT' ? '#1e293b' : gameState.currentPhase === 'VOTING' ? '#f59e0b' : '#10b981',
                                zIndex: 100,
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: 'white'
                            }}>
                                {gameState.currentPhase === 'NIGHT' && '🌙 Noche'}
                                {gameState.currentPhase === 'DAY' && '☀️ Día'}
                                {gameState.currentPhase === 'VOTING' && '🗳️ Votación'}
                                {gameState.currentPhase === 'HUNTER_REVENGE' && '🏹 Venganza del Cazador'}
                            </div>
                        )}

                        {/* Role Card - Show to players during night (not admin/narrator) */}
                        {myRole && !isAdmin && currentPhase === 'NIGHT' && (
                            <RoleCard
                                roleData={myRole}
                                isSheriff={gameState.werewolfConfig?.sheriffId === playerId}
                            />
                        )}

                        {/* Night Phase */}
                        {currentPhase === 'NIGHT' && !isAdmin && <NightScreen />}

                        {/* Narrator Panel - Always visible to admin */}
                        {isAdmin && <NarratorPanel code={code} />}

                        {/* Voting Phase */}
                        {currentPhase === 'VOTING' && !isAdmin && (
                            <VotingPanel code={code} />
                        )}

                        {/* Hunter Revenge - Only hunter receives this event */}
                        {hunterRevengeActive && (
                            <HunterRevenge
                                code={code}
                                alivePlayers={gameState.players.filter(p => gameState.isAlive[p.id])}
                            />
                        )}

                        {/* Death Screen - Show when player dies (not admin, not during hunter revenge or voting) */}
                        {!isAdmin && !isAlive && votedOutData && !hunterRevengeActive && currentPhase !== 'VOTING' && <DeathScreen deathData={votedOutData} />}

                        {/* Night Deaths - Show all deaths after night ends (not admin, not during hunter revenge or voting) */}
                        {!isAdmin && nightDeaths && nightDeaths.length > 0 && !hunterRevengeActive && currentPhase !== 'VOTING' && (
                            <DeathScreen deathData={nightDeaths} />
                        )}
                    </>
                )}

                {/* Game Ended */}
                {gameState.state === 'WEREWOLF_ENDED' && gameEndedData && (
                    <WerewolfGameResult
                        winner={gameEndedData.winner}
                        survivors={gameEndedData.survivors}
                        allPlayers={gameState.players}
                    />
                )}
            </main>
        );
    }

    // Impostor mode rendering (original)
    return (
        <main className="container">
            {gameState.state === 'LOBBY' && <Lobby code={code} />}
            {gameState.state === 'PLAYING' && <CardReveal />}
            {gameState.state === 'VOTING' && <Voting />}
            {gameState.state === 'ROUND_END' && <RoundResult />}
            {gameState.state === 'GAME_END' && <GameResult />}

            {gameState.adminId === playerId &&
                ['PLAYING', 'VOTING', 'ROUND_END'].includes(gameState.state) && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--surface-hover)', paddingTop: '1rem', width: '100%', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Admin Controls</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                            <button
                                className="btn"
                                style={{ background: 'var(--error)', color: 'white', fontSize: '0.875rem', padding: '8px 16px', width: '200px' }}
                                onClick={() => {
                                    if (confirm('Are you sure you want to end the game prematurely?')) {
                                        endGame(code);
                                    }
                                }}
                            >
                                End Game
                            </button>
                            <button
                                className="btn"
                                style={{ background: '#8b5cf6', color: 'white', fontSize: '0.875rem', padding: '8px 16px', width: '200px' }}
                                onClick={() => {
                                    if (confirm('Are you sure you want to RESTART the game? This will clear all scores and return to lobby.')) {
                                        restartGame(code);
                                    }
                                }}
                            >
                                Restart Game
                            </button>
                        </div>
                    </div>
                )}
        </main>
    );
}
