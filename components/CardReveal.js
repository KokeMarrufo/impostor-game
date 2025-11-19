'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';

export default function CardReveal() {
    const { gameState, playerId, startVoting } = useGame();
    const player = gameState.players.find(p => p.id === playerId);
    const [revealed, setRevealed] = useState(false);

    if (!player) return null;

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ perspective: '1000px', width: '100%', maxWidth: '300px', height: '400px' }}>
                <div
                    onClick={() => setRevealed(!revealed)}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transition: 'transform 0.6s',
                        transformStyle: 'preserve-3d',
                        transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        cursor: 'pointer'
                    }}
                >
                    {/* Front (Hidden) */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                    }}>
                        TAP TO REVEAL
                    </div>

                    {/* Back (Revealed) */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        background: player.isImpostor ? '#ef4444' : 'var(--surface)',
                        borderRadius: '20px',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--border)',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
                            {player.isImpostor ? 'YOUR ROLE' : 'SECRET WORD'}
                        </h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>
                            {player.isImpostor ? 'IMPOSTOR' : player.word}
                        </div>
                        {player.isImpostor && (
                            <p style={{ marginTop: '1rem', color: 'white', opacity: 0.9 }}>
                                Blend in. Don't get caught.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                    {gameState.adminId === playerId ? 'When discussion is done:' : 'Waiting for voting...'}
                </p>
                {gameState.adminId === playerId && (
                    <button
                        className="btn btn-primary"
                        onClick={() => startVoting(gameState.code)}
                    >
                        Start Voting
                    </button>
                )}
            </div>
        </div>
    );
}
