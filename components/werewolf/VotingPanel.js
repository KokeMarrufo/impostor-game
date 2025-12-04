'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './VotingPanel.module.css';

export default function VotingPanel({ code }) {
    const { gameState, playerId, castWerewolfVote } = useGame();
    const [selectedId, setSelectedId] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!gameState) return null;

    const { players, votes, isAlive } = gameState;
    const isPlayerAlive = isAlive && isAlive[playerId];

    // Filter only alive players
    const alivePlayers = players.filter(p => isAlive && isAlive[p.id] && p.id !== playerId);

    const votedCount = Object.keys(votes || {}).filter(id => isAlive && isAlive[id]).length;
    const aliveCount = players.filter(p => isAlive && isAlive[p.id]).length;

    const handleVote = async () => {
        if (!selectedId || hasVoted || loading) return;

        setLoading(true);
        const result = await castWerewolfVote(code, selectedId);

        if (result.success) {
            setHasVoted(true);
        } else {
            alert(result.error || 'Error al votar');
        }
        setLoading(false);
    };

    if (!isPlayerAlive) {
        return (
            <div className={styles.container}>
                <div className={styles.deadMessage}>
                    <h2>💀 Has sido eliminado</h2>
                    <p>No puedes votar, pero puedes observar el juego</p>
                    <div className={styles.voteCount}>
                        <p>Votos recibidos: {votedCount} / {aliveCount}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (hasVoted) {
        return (
            <div className={styles.container}>
                <div className={styles.votedMessage}>
                    <h2>✅ Voto Registrado</h2>
                    <p>Esperando a que todos voten...</p>
                    <div className={styles.voteCount}>
                        <p>Votos recibidos: {votedCount} / {aliveCount}</p>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${(votedCount / aliveCount) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>🗳️ Votación del Pueblo</h2>
                <p>¿Quién crees que es el lobo?</p>
            </div>

            <div className={styles.voteCount}>
                <p>Votos recibidos: {votedCount} / {aliveCount}</p>
            </div>

            <div className={styles.playerGrid}>
                {alivePlayers.map(player => (
                    <div
                        key={player.id}
                        className={`${styles.playerCard} ${selectedId === player.id ? styles.selected : ''}`}
                        onClick={() => setSelectedId(player.id)}
                    >
                        <div className={styles.playerAvatar}>
                            {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.playerName}>{player.name}</span>
                        {selectedId === player.id && (
                            <div className={styles.checkmark}>✓</div>
                        )}
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary"
                onClick={handleVote}
                disabled={!selectedId || loading}
                style={{ opacity: selectedId ? 1 : 0.5 }}
            >
                {loading ? 'Votando...' : 'Confirmar Voto'}
            </button>

            {!selectedId && (
                <p className={styles.hint}>Selecciona un jugador para votar</p>
            )}
        </div>
    );
}
