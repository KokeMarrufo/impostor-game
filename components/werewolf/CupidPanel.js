'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './CupidPanel.module.css';

export default function CupidPanel({ code, players, onClose }) {
    const { cupidLink } = useGame();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);

    const toggleSelection = (playerId) => {
        if (selected.includes(playerId)) {
            setSelected(selected.filter(id => id !== playerId));
        } else if (selected.length < 2) {
            setSelected([...selected, playerId]);
        }
    };

    const handleConfirm = async () => {
        if (selected.length !== 2) return;

        setLoading(true);
        const result = await cupidLink(code, selected[0], selected[1]);

        if (result.success) {
            alert(`${result.player1Name} y ${result.player2Name} son ahora enamorados ❤️`);
            onClose();
        } else {
            alert('Error al enlazar enamorados');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>💘 Cupido - Enlazar Enamorados</h2>
                <p className={styles.subtitle}>Selecciona exactamente 2 jugadores</p>

                <div className={styles.playerList}>
                    {players.map(player => (
                        <div
                            key={player.id}
                            className={`${styles.playerCard} ${selected.includes(player.id) ? styles.selected : ''}`}
                            onClick={() => toggleSelection(player.id)}
                        >
                            <div className={styles.playerAvatar}>
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={styles.playerName}>{player.name}</span>
                            {selected.includes(player.id) && (
                                <div className={styles.checkmark}>✓</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className={styles.actions}>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={selected.length !== 2 || loading}
                        style={{ opacity: selected.length === 2 ? 1 : 0.5 }}
                    >
                        {loading ? 'Enlazando...' : `Confirmar Enlace (${selected.length}/2)`}
                    </button>
                    <button className="btn" onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
