'use client';
import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './NarratorPanel.module.css';
import RoleModal from './RoleModal';
import CupidPanel from './CupidPanel';
import WitchPanel from './WitchPanel';
import WolfVictimPanel from './WolfVictimPanel';

export default function NarratorPanel({ code }) {
    const { gameState, getAllRoles, endNight, startWerewolfVoting, markNightVictim, socket } = useGame();

    const startNight = () => {
        socket.emit('start_night', { code });
    };
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showCupidPanel, setShowCupidPanel] = useState(false);
    const [showWitchPanel, setShowWitchPanel] = useState(false);
    const [showWolfVictimPanel, setShowWolfVictimPanel] = useState(false);
    const [showSheriffPanel, setShowSheriffPanel] = useState(false);

    const setSheriff = (playerId) => {
        if (!socket) return;
        socket.emit('set_sheriff', { code, playerId });
        setShowSheriffPanel(false);
    };

    useEffect(() => {
        loadRoles();
    }, [gameState]); // Reload when gameState changes

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
            {/* Header */}
            <div className={styles.header}>
                <h2>🎭 Panel del Narrador</h2>
                <p>Fase: {gameState.currentPhase || 'SETUP'} | Noche #{gameState.nightNumber || 0}</p>
                <button
                    className="btn"
                    onClick={loadRoles}
                    style={{
                        marginTop: '0.5rem',
                        background: '#64748b',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '0.5rem 1rem'
                    }}
                >
                    🔄 Refrescar Vista
                </button>
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
                    style={{
                        background: gameState.cupidLinked ? '#64748b' : '#ec4899',
                        color: 'white',
                        opacity: gameState.cupidLinked ? 0.5 : 1
                    }}
                >
                    💘 Llamar a Cupido {gameState.cupidLinked && '✓'}
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
                    disabled={gameState.witchPotions?.lifePotionUsed && gameState.witchPotions?.deathPotionUsed}
                    style={{
                        background: '#a855f7',
                        color: 'white',
                        opacity: (gameState.witchPotions?.lifePotionUsed && gameState.witchPotions?.deathPotionUsed) ? 0.5 : 1
                    }}
                >
                    🧙‍♀️ Llamar a Bruja {(gameState.witchPotions?.lifePotionUsed && gameState.witchPotions?.deathPotionUsed) && '✓'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => endNight(code)}
                    disabled={gameState.currentPhase !== 'NIGHT'}
                >
                    ☀️ Terminar Noche
                </button>
                <button
                    className="btn"
                    onClick={() => startWerewolfVoting(code)}
                    disabled={gameState.currentPhase !== 'DAY'}
                    style={{ background: '#f59e0b', color: 'white' }}
                >
                    🗳️ Iniciar Votación
                </button>
                <button
                    className="btn"
                    onClick={startNight}
                    disabled={gameState.currentPhase === 'NIGHT' || gameState.currentPhase === 'VOTING'}
                    style={{ background: '#1e293b', color: 'white' }}
                >
                    🌙 Iniciar Noche
                </button>
                <button
                    className="btn"
                    onClick={() => setShowSheriffPanel(true)}
                    style={{
                        background: gameState.werewolfConfig?.sheriffId ? '#10b981' : '#6366f1',
                        color: 'white'
                    }}
                >
                    🎖️ {gameState.werewolfConfig?.sheriffId ? 'Cambiar' : 'Seleccionar'} Sheriff
                </button>
            </div>

            {/* Alive Players */}
            <div className={styles.section}>
                <h3>Jugadores Vivos ({alivePlayers.length})</h3>
                <div className={styles.playerList}>
                    {alivePlayers.map(player => {
                        const loverPartner = player.isLover && player.linkedTo
                            ? roles.find(p => p.id === player.linkedTo)
                            : null;

                        return (
                            <div key={player.id} className={styles.playerCard}>
                                <div className={styles.playerInfo}>
                                    <span className={styles.playerName}>
                                        {player.name}
                                        {player.isLover && <span className={styles.loverIcon}>❤️</span>}
                                        {gameState.werewolfConfig?.sheriffId === player.id && (
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                fontSize: '1.2rem',
                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                            }}>
                                                🎖️
                                            </span>
                                        )}
                                    </span>
                                    {loverPartner && (
                                        <span style={{ fontSize: '0.75rem', color: '#ec4899', marginTop: '0.25rem' }}>
                                            💕 Enamorado de {loverPartner.name}
                                        </span>
                                    )}
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
                        );
                    })}
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
                                    <span className={styles.playerName}>
                                        {player.name}
                                        {gameState.werewolfConfig?.sheriffId === player.id && (
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                fontSize: '1.2rem',
                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                            }}>
                                                🎖️
                                            </span>
                                        )}
                                    </span>
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

            {showSheriffPanel && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>🎖️ Seleccionar Sheriff</h3>
                        <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
                            El Sheriff rompe empates en votaciones
                        </p>
                        <div className={styles.playerList}>
                            {alivePlayers.map(player => (
                                <button
                                    key={player.id}
                                    className="btn"
                                    onClick={() => setSheriff(player.id)}
                                    style={{
                                        background: gameState.werewolfConfig?.sheriffId === player.id ? '#10b981' : '#6366f1',
                                        color: 'white',
                                        marginBottom: '0.5rem'
                                    }}
                                >
                                    {player.name} {gameState.werewolfConfig?.sheriffId === player.id && '✓'}
                                </button>
                            ))}
                        </div>
                        <button
                            className="btn"
                            onClick={() => setShowSheriffPanel(false)}
                            style={{ marginTop: '1rem', background: '#64748b', color: 'white' }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
