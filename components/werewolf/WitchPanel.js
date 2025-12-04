'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './WitchPanel.module.css';

export default function WitchPanel({ code, gameState, players, onClose }) {
    const { useLifePotion, useDeathPotion } = useGame();
    const [deathTarget, setDeathTarget] = useState('');
    const [loading, setLoading] = useState(false);

    const nightVictim = players.find(p => p.id === gameState.nightVictimId);
    const { lifePotionUsed, deathPotionUsed } = gameState.witchPotions;

    const handleUseLifePotion = async () => {
        if (lifePotionUsed || !nightVictim) return;

        setLoading(true);
        const result = await useLifePotion(code);

        if (result.success) {
            alert(`${nightVictim.name} ha sido salvado! 💚`);
            onClose();
        } else {
            alert('Error al usar la poción');
        }
        setLoading(false);
    };

    const handleUseDeathPotion = async () => {
        if (deathPotionUsed || !deathTarget) return;

        const targetPlayer = players.find(p => p.id === deathTarget);
        if (!confirm(`¿Usar poción de muerte en ${targetPlayer.name}?`)) return;

        setLoading(true);
        const result = await useDeathPotion(code, deathTarget);

        if (result.success) {
            alert(`${targetPlayer.name} será eliminado al amanecer ☠️`);
            onClose();
        } else {
            alert('Error al usar la poción');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>🧙‍♀️ Turno de la Bruja</h2>

                {nightVictim && (
                    <div className={styles.victimCard}>
                        <p className={styles.victimLabel}>Víctima de los Lobos:</p>
                        <p className={styles.victimName}>{nightVictim.name}</p>
                    </div>
                )}

                {/* Life Potion */}
                <div className={styles.potionCard}>
                    <div className={styles.potionHeader}>
                        <h3>💚 Poción de Vida</h3>
                        {lifePotionUsed && <span className={styles.usedBadge}>✓ Usada</span>}
                    </div>
                    {!lifePotionUsed && nightVictim ? (
                        <button
                            className={styles.lifePotionButton}
                            onClick={handleUseLifePotion}
                            disabled={loading}
                        >
                            Salvar a {nightVictim.name}
                        </button>
                    ) : (
                        <p className={styles.disabledText}>
                            {lifePotionUsed ? 'Ya fue utilizada en una noche anterior' : 'No hay víctima para salvar'}
                        </p>
                    )}
                </div>

                {/* Death Potion */}
                <div className={styles.potionCard}>
                    <div className={styles.potionHeader}>
                        <h3>☠️ Poción de Muerte</h3>
                        {deathPotionUsed && <span className={styles.usedBadge}>✓ Usada</span>}
                    </div>
                    {!deathPotionUsed ? (
                        <>
                            <select
                                value={deathTarget}
                                onChange={(e) => setDeathTarget(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">-- Seleccionar objetivo --</option>
                                {players.map(player => (
                                    <option key={player.id} value={player.id}>
                                        {player.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                className={styles.deathPotionButton}
                                onClick={handleUseDeathPotion}
                                disabled={!deathTarget || loading}
                                style={{ opacity: deathTarget ? 1 : 0.5 }}
                            >
                                {deathTarget ? `Matar a ${players.find(p => p.id === deathTarget)?.name}` : 'Selecciona un objetivo'}
                            </button>
                        </>
                    ) : (
                        <p className={styles.disabledText}>
                            Ya fue utilizada en una noche anterior
                        </p>
                    )}
                </div>

                <button className="btn" onClick={onClose}>
                    Continuar sin usar pociones
                </button>
            </div>
        </div>
    );
}
