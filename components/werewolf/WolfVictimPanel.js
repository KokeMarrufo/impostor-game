'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './CupidPanel.module.css'; // Reutilizamos los estilos de CupidPanel

export default function WolfVictimPanel({ code, players, onClose }) {
    const { markNightVictim } = useGame();
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!selectedId) return;

        setLoading(true);
        const result = await markNightVictim(code, selectedId);

        if (result.success) {
            const victim = players.find(p => p.id === selectedId);
            alert(`${victim.name} ha sido marcado como víctima de los lobos 🐺`);
            onClose();
        } else {
            alert('Error al marcar víctima');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>🐺 Víctima de los Lobos</h2>
                <p className={styles.subtitle}>Selecciona a quién atacarán los lobos esta noche</p>

                <div className={styles.playerList}>
                    {players.map(player => (
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

                <div className={styles.actions}>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={!selectedId || loading}
                        style={{ opacity: selectedId ? 1 : 0.5, background: '#dc2626' }}
                    >
                        {loading ? 'Marcando...' : selectedId ? `Marcar a ${players.find(p => p.id === selectedId)?.name}` : 'Selecciona una víctima'}
                    </button>
                    <button className="btn" onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
