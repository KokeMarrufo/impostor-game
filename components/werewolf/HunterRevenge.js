'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './HunterRevenge.module.css';

export default function HunterRevenge({ code, alivePlayers }) {
    const { hunterShoots } = useGame();
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShoot = async () => {
        if (!selectedId || loading) return;

        if (!confirm('¿Estás seguro de disparar a este jugador? Esta es tu última acción.')) return;

        setLoading(true);
        const result = await hunterShoots(code, selectedId);

        if (!result.success) {
            alert('Error al disparar');
            setLoading(false);
        }
        // Si es exitoso, el componente se desmontará cuando cambie la fase
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.icon}>🏹</div>
                    <h1 className={styles.title}>ÚLTIMA VENGANZA</h1>
                    <p className={styles.subtitle}>
                        Como Cazador, puedes disparar a un jugador antes de morir
                    </p>
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
                                <div className={styles.target}>🎯</div>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    className={styles.shootButton}
                    onClick={handleShoot}
                    disabled={!selectedId || loading}
                    style={{ opacity: selectedId ? 1 : 0.5 }}
                >
                    {loading ? 'Disparando...' : selectedId ? `Disparar a ${alivePlayers.find(p => p.id === selectedId)?.name}` : 'Selecciona un objetivo'}
                </button>

                {!selectedId && (
                    <p className={styles.hint}>Selecciona a quién disparar</p>
                )}
            </div>
        </div>
    );
}
