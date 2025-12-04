'use client';
import styles from './GameResult.module.css';

export default function GameResult({ winner, survivors, allPlayers }) {
    const isWolvesWin = winner === 'WEREWOLVES';

    return (
        <div className={`${styles.overlay} ${isWolvesWin ? styles.wolvesWin : styles.villagersWin}`}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.icon}>
                        {isWolvesWin ? '🐺' : '🎉'}
                    </div>
                    <h1 className={styles.title}>
                        {isWolvesWin ? '¡LOS LOBOS GANAN!' : '¡LOS ALDEANOS GANAN!'}
                    </h1>
                    <p className={styles.subtitle}>
                        {isWolvesWin
                            ? 'Los lobos han eliminado a todos los aldeanos'
                            : 'Los aldeanos han eliminado a todos los lobos'}
                    </p>
                </div>

                {/* Survivors */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        🎖️ Sobrevivientes ({survivors?.length || 0})
                    </h2>
                    <div className={styles.playerList}>
                        {survivors && survivors.length > 0 ? (
                            survivors.map(player => (
                                <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerAvatar}>
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerName}>{player.name}</span>
                                        <span className={styles.playerRole}>{player.role}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyMessage}>No hay sobrevivientes</p>
                        )}
                    </div>
                </div>

                {/* All Players */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        👥 Todos los Jugadores
                    </h2>
                    <div className={styles.allPlayersList}>
                        {allPlayers && allPlayers.map(player => {
                            const isAlive = survivors?.some(s => s.id === player.id);
                            const isWolf = player.role === 'Lobo';

                            return (
                                <div
                                    key={player.id}
                                    className={`${styles.playerRow} ${!isAlive ? styles.dead : ''}`}
                                >
                                    <span className={styles.playerName}>{player.name}</span>
                                    <span
                                        className={styles.roleTag}
                                        style={{
                                            background: isWolf ? '#dc2626' : '#10b981',
                                            opacity: isAlive ? 1 : 0.5
                                        }}
                                    >
                                        {player.role}
                                    </span>
                                    <span className={styles.status}>
                                        {isAlive ? '✅ Vivo' : '💀 Muerto'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
