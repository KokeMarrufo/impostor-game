'use client';
import { useGame } from '@/context/GameContext';
import styles from './DeathScreen.module.css';

export default function DeathScreen({ deathData }) {
    const { playerId } = useGame();

    if (!deathData) return null;

    // Handle both single death and array of deaths
    const deaths = Array.isArray(deathData) ? deathData : [deathData];
    const myDeath = deaths.find(d => d.playerId === playerId);
    const isMe = !!myDeath;

    const getBackgroundClass = () => {
        if (myDeath) {
            if (myDeath.reason === 'Love') return styles.loveBackground;
            if (myDeath.isWerewolf) return styles.werewolfBackground;
            return styles.villagerBackground;
        }
        // For others, use first death's background
        if (deaths[0].reason === 'Love') return styles.loveBackground;
        if (deaths[0].isWerewolf) return styles.werewolfBackground;
        return styles.villagerBackground;
    };

    const getReasonText = (reason) => {
        switch (reason) {
            case 'Vote': return 'Eliminado por votación del pueblo';
            case 'Night': return 'Eliminado durante la noche';
            case 'Witch': return 'Eliminado por la Bruja';
            case 'Hunter': return 'Eliminado por el Cazador';
            case 'Love': return 'Murió de pena de amor';
            default: return 'Eliminado';
        }
    };

    return (
        <div className={`${styles.overlay} ${getBackgroundClass()}`}>
            <div className={styles.container}>
                {isMe ? (
                    <>
                        <div className={styles.icon}>
                            {myDeath.reason === 'Love' ? '💔' : '💀'}
                        </div>
                        <h1 className={styles.title}>Has sido eliminado</h1>
                        <div className={styles.roleReveal}>
                            <p className={styles.roleLabel}>Tu rol era:</p>
                            <h2 className={styles.roleName}>{myDeath.role}</h2>
                        </div>
                        <p className={styles.reason}>
                            {getReasonText(myDeath.reason)}
                        </p>
                        {myDeath.isWerewolf && myDeath.reason !== 'Love' && (
                            <div className={styles.werewolfMessage}>
                                <p>🐺 ¡Eras un LOBO!</p>
                                <p className={styles.hint}>Muestra esta pantalla al grupo</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className={styles.icon}>
                            {deaths.some(d => d.reason === 'Love') ? '💔' : '⚰️'}
                        </div>
                        {deaths.length === 1 ? (
                            <>
                                <h1 className={styles.title}>{deaths[0].playerName} ha sido eliminado</h1>
                                <div className={styles.roleReveal}>
                                    <p className={styles.roleLabel}>Su rol era:</p>
                                    <h2 className={styles.roleName}>{deaths[0].role}</h2>
                                </div>
                                <p className={styles.reason}>
                                    {getReasonText(deaths[0].reason)}
                                </p>
                                {deaths[0].isWerewolf && deaths[0].reason !== 'Love' && (
                                    <div className={styles.werewolfMessage}>
                                        <p>🐺 ¡Era un LOBO!</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h1 className={styles.title}>¡Múltiples muertes esta noche!</h1>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', width: '100%' }}>
                                    {deaths.map((death, idx) => (
                                        <div key={idx} style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: death.isWerewolf ? '2px solid #dc2626' : '2px solid #64748b'
                                        }}>
                                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                                {death.playerName}
                                                {death.isWerewolf && ' 🐺'}
                                            </h3>
                                            <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                                                Rol: <strong>{death.role}</strong>
                                            </p>
                                            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem' }}>
                                                {getReasonText(death.reason)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
