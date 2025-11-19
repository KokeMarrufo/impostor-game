'use client';
import { useGame } from '@/context/GameContext';

export default function RoundResult() {
    const { gameState, playerId, nextRound } = useGame();
    const { lastRoundResult, players, adminId } = gameState;

    if (!lastRoundResult) return null;

    const { impostor, votedOutId, impostorCaught } = lastRoundResult;
    const votedOutName = players.find(p => p.id === votedOutId)?.name || 'No one';

    return (
        <div className="card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Round Over</h2>

            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                {impostorCaught ? '🎉' : '😈'}
            </div>

            <h3 style={{ color: impostorCaught ? 'var(--success)' : 'var(--error)', marginBottom: '1rem', fontSize: '1.5rem' }}>
                {impostorCaught ? 'Impostor Caught!' : 'Impostor Escaped!'}
            </h3>

            <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
                {votedOutId ? (
                    <><strong>{votedOutName}</strong> was voted out.</>
                ) : (
                    <>No one was voted out.</>
                )}
                <br />
                The impostor was <strong>{impostor.name}</strong>.
            </p>

            <div style={{ marginBottom: '2rem', textAlign: 'left', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Current Scores</h4>
                {players.sort((a, b) => b.score - a.score).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span>{p.name}</span>
                        <span style={{ fontWeight: 'bold' }}>{p.score}</span>
                    </div>
                ))}
            </div>

            {playerId === adminId ? (
                <button className="btn btn-primary" onClick={() => nextRound(gameState.code)}>
                    Next Round
                </button>
            ) : (
                <p style={{ color: '#94a3b8' }}>Waiting for admin...</p>
            )}
        </div>
    );
}
