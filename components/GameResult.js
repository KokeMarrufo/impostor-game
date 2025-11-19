'use client';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';

export default function GameResult() {
    const { gameState } = useGame();
    const { players } = gameState;
    const router = useRouter();

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
        <div className="card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Game Over</h2>

            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</div>

            <h3 style={{ marginBottom: '0.5rem' }}>Winner</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '2rem' }}>
                {winner.name}
            </div>

            <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                <h4 style={{ marginBottom: '1rem' }}>Final Standings</h4>
                {sortedPlayers.map((p, i) => (
                    <div
                        key={p.id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: i === 0 ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            marginBottom: '4px',
                            border: i === 0 ? '1px solid var(--primary)' : 'none'
                        }}
                    >
                        <span style={{ fontWeight: i === 0 ? 'bold' : 'normal' }}>
                            {i + 1}. {p.name}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>{p.score}</span>
                    </div>
                ))}
            </div>

            <button className="btn btn-secondary" onClick={() => router.push('/')}>
                Back to Home
            </button>
        </div>
    );
}
