'use client';
import { useGame } from '@/context/GameContext';

export default function Voting() {
    const { gameState, playerId, submitVote } = useGame();
    const { players, votes } = gameState;
    const hasVoted = votes && votes[playerId];

    const handleVote = (targetId) => {
        if (hasVoted) return;
        submitVote(gameState.code, targetId);
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <div className="card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2>Who is the Impostor?</h2>
                <p style={{ color: '#94a3b8' }}>{hasVoted ? 'Waiting for others...' : 'Tap a player to vote'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {players.map((p) => {
                    if (p.id === playerId) return null; // Can't vote for self? Usually yes.

                    const isSelected = votes && votes[playerId] === p.id;

                    return (
                        <div
                            key={p.id}
                            onClick={() => handleVote(p.id)}
                            style={{
                                background: isSelected ? 'var(--primary)' : 'var(--surface)',
                                border: isSelected ? '2px solid var(--primary-hover)' : '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                cursor: hasVoted ? 'default' : 'pointer',
                                opacity: hasVoted && !isSelected ? 0.5 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                            <div style={{ fontWeight: '600', color: isSelected ? 'white' : 'var(--foreground)' }}>{p.name}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
