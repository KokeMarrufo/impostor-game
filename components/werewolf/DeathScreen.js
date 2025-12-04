'use client';
import { useGame } from '@/context/GameContext';
import styles from './DeathScreen.module.css';

export default function DeathScreen({ deathData }) {
    const { playerId } = useGame();

    if (!deathData) return null;

    const isMe = deathData.playerId === playerId;
    const isWerewolf = deathData.isWerewolf;
    const reason = deathData.reason;

    const getBackgroundClass = () => {
        if (reason === 'Love') return styles.loveBackground;
        if (isWerewolf) return styles.werewolfBackground;
        return styles.villagerBackground;
    };

    return (
        <div className={`${styles.overlay} ${getBackgroundClass()}`}>
            <div className={styles.container}>
                {isMe ? (
                    <>
                        <div className={styles.icon}>
                            {reason === 'Love' ? '💔' : '💀'}
                        </div>
                        <h1 className={styles.title}>Has sido eliminado</h1>
                        <div className={styles.roleReveal}>
                            <p className={styles.roleLabel}>Tu rol era:</p>
                            <h2 className={styles.roleName}>{deathData.role}</h2>
                        </div>
                        <p className={styles.reason}>
                            {reason === 'Vote' && 'Eliminado por votación del pueblo'}
                            {reason === 'Night' && 'Eliminado durante la noche'}
                            {reason === 'Witch' && 'Eliminado por la Bruja'}
                            {reason === 'Hunter' && 'Eliminado por el Cazador'}
                            {reason === 'Love' && 'Moriste de pena de amor'}
                        </p>
                        {isWerewolf && reason !== 'Love' && (
                            <div className={styles.werewolfMessage}>
                                <p>🐺 ¡Eras un LOBO!</p>
                                <p className={styles.hint}>Muestra esta pantalla al grupo</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className={styles.icon}>
                            {reason === 'Love' ? '💔' : '⚰️'}
                        </div>
                        <h1 className={styles.title}>{deathData.playerName} ha sido eliminado</h1>
                        <div className={styles.roleReveal}>
                            <p className={styles.roleLabel}>Su rol era:</p>
                            <h2 className={styles.roleName}>{deathData.role}</h2>
                        </div>
                        <p className={styles.reason}>
                            {reason === 'Vote' && 'Eliminado por votación del pueblo'}
                            {reason === 'Night' && 'Eliminado durante la noche'}
                            {reason === 'Witch' && 'Eliminado por la Bruja'}
                            {reason === 'Hunter' && 'Eliminado por el Cazador'}
                            {reason === 'Love' && 'Murió de pena de amor'}
                        </p>
                        {isWerewolf && reason !== 'Love' && (
                            <div className={styles.werewolfMessage}>
                                <p>🐺 ¡Era un LOBO!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
