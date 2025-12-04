'use client';
import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './NarratorPanel.module.css';
import RoleModal from './RoleModal';
import CupidPanel from './CupidPanel';
import WitchPanel from './WitchPanel';
import WolfVictimPanel from './WolfVictimPanel';

export default function NarratorPanel({ code }) {
    const { gameState, getAllRoles, endNight, startWerewolfVoting, markNightVictim } = useGame();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showCupidPanel, setShowCupidPanel] = useState(false);
    const [showWitchPanel, setShowWitchPanel] = useState(false);
    const [showWolfVictimPanel, setShowWolfVictimPanel] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        const result = await getAllRoles(code);
        if (result.success) {
            setRoles(result.roles);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <h2>Panel del Narrador</h2>
                <p>Cargando...</p>
            </div>
        );
    }

    const alivePlayers = roles.filter(p => p.isAlive);
    const deadPlayers = roles.filter(p => !p.isAlive);
    const aliveWolves = alivePlayers.filter(p => p.role === 'Lobo').length;
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Lobo').length;

    const getRoleColor = (role) => {
        switch (role) {
            case 'Lobo': return '#dc2626';
            case 'Vidente': return '#8b5cf6';
            case 'Bruja': return '#a855f7';
            case 'Cazador': return '#f59e0b';
            case 'Cupido': return '#ec4899';
            case 'Aldeano': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getRoleEmoji = (role) => {
        switch (role) {
            case 'Lobo': return '🐺';
            case 'Vidente': return '🔮';
            case 'Bruja': return '🧙‍♀️';
            case 'Cazador': return '🏹';
            case 'Cupido': return '💘';
            case 'Aldeano': return '👤';
            default: return '❓';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>🎭 Panel del Narrador</h2>
                <p className={styles.subtitle}>Solo tú puedes ver esta información</p>
            </div>

            {/* Game Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Lobos Vivos</span>
                    <span className={styles.statValue} style={{ color: '#dc2626' }}>{aliveWolves}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Aldeanos Vivos</span>
                    <span className={styles.statValue} style={{ color: '#10b981' }}>{aliveVillagers}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Fase</span>
                    <span className={styles.statValue}>{gameState.currentPhase}</span>
                </div>
            </div>

            {/* Phase Controls */}
            <div className={styles.controls}>
                <button
                    className="btn"
                    onClick={() => setShowCupidPanel(true)}
                    disabled={gameState.cupidLinked || gameState.nightNumber !== 1}
                    style={{ background: '#ec4899', color: 'white' }}
                >
                    💘 Llamar a Cupido
                </button>
                <button
                    className="btn"
                    onClick={() => setShowWolfVictimPanel(true)}
                    style={{ background: '#dc2626', color: 'white' }}
                >
                    🐺 Marcar Víctima de Lobos
                </button>
                <button
                    className="btn"
                    onClick={() => setShowWitchPanel(true)}
                    style={{ background: '#a855f7', color: 'white' }}
                >
                    🧙‍♀️ Llamar a Bruja
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => endNight(code)}
                >
                    ☀️ Terminar Noche
                </button>
                <button
                    className="btn"
                    onClick={() => startWerewolfVoting(code)}
                    style={{ background: '#f59e0b', color: 'white' }}
                >
                    🗳️ Iniciar Votación
                </button>
            </div>

            {/* Alive Players */}
            <div className={styles.section}>
                <h3>Jugadores Vivos ({alivePlayers.length})</h3>
                <div className={styles.playerList}>
                    {alivePlayers.map(player => (
                        <div key={player.id} className={styles.playerCard}>
                            <div className={styles.playerInfo}>
                                <span className={styles.playerName}>
                                    {player.name}
                                    {player.isLover && <span className={styles.loverIcon}>❤️</span>}
                                </span>
                                <button
                                    className={styles.viewRoleButton}
                                    onClick={() => setSelectedPlayer(player)}
                                >
                                    Ver Rol
                                </button>
                            </div>
                            <div
                                className={styles.roleTag}
                                style={{ background: getRoleColor(player.role) }}
                            >
                                <span>{getRoleEmoji(player.role)}</span>
                                <span>{player.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dead Players */}
            {deadPlayers.length > 0 && (
                <div className={styles.section}>
                    <h3>Jugadores Eliminados ({deadPlayers.length})</h3>
                    <div className={styles.playerList}>
                        {deadPlayers.map(player => (
                            <div key={player.id} className={`${styles.playerCard} ${styles.dead}`}>
                                <div className={styles.playerInfo}>
                                    <span className={styles.playerName}>{player.name}</span>
                                    <div
                                        className={styles.roleTag}
                                        style={{ background: getRoleColor(player.role) }}
                                    >
                                        <span>{getRoleEmoji(player.role)}</span>
                                        <span>{player.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedPlayer && (
                <RoleModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}

            {showCupidPanel && (
                <CupidPanel
                    code={code}
                    players={alivePlayers}
                    onClose={() => setShowCupidPanel(false)}
                />
            )}

            {showWitchPanel && (
                <WitchPanel
                    code={code}
                    gameState={gameState}
                    players={alivePlayers}
                    onClose={() => setShowWitchPanel(false)}
                />
            )}

            {showWolfVictimPanel && (
                <WolfVictimPanel
                    code={code}
                    players={alivePlayers}
                    onClose={() => setShowWolfVictimPanel(false)}
                />
            )}
        </div>
    );
}
