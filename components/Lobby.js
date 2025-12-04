'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';

export default function Lobby({ code }) {
    const { gameState, playerId, updateSettings, generateAIWords, startGame, startRandomGame, startWerewolfGame } = useGame();
    const { players, adminId, settings } = gameState;
    const isAdmin = playerId === adminId;
    const [newWord, setNewWord] = useState('');
    const [aiTheme, setAiTheme] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        alert('Room code copied!');
    };

    const copyRoomLink = () => {
        const roomUrl = `${window.location.origin}/room/${code}`;
        navigator.clipboard.writeText(roomUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleAddWord = () => {
        if (!newWord.trim()) return;
        const updatedWords = [...settings.words, newWord.trim()];
        updateSettings(code, { words: updatedWords });
        setNewWord('');
    };

    const handleRemoveWord = (index) => {
        const updatedWords = settings.words.filter((_, i) => i !== index);
        updateSettings(code, { words: updatedWords });
    };

    const handleRoundsChange = (e) => {
        const rounds = parseInt(e.target.value) || 1;
        updateSettings(code, { rounds });
    };

    const handleGenerateAI = async () => {
        if (!aiTheme.trim()) {
            alert('Please enter a theme for AI word generation');
            return;
        }

        setAiGenerating(true);
        try {
            const result = await generateAIWords(code, aiTheme.trim(), settings.rounds);
            if (result.success) {
                alert(`✨ AI generated ${result.count} words based on "${aiTheme}"!`);
                setAiTheme('');
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert('Failed to generate words. Please try again.');
        } finally {
            setAiGenerating(false);
        }
    };

    const canStart = settings.words.length >= settings.rounds && players.length >= 3;

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {/* Header and Code */}
            <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2 style={{ color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Room Code</h2>
                <div
                    onClick={copyCode}
                    style={{
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        margin: '0.5rem 0'
                    }}
                >
                    {code}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Tap code to copy</p>

                {/* Share Room Link */}
                <div
                    onClick={copyRoomLink}
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'var(--surface-hover)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <span style={{ fontSize: '1.2rem' }}>🔗</span>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        {linkCopied ? '✓ Link copied!' : 'Click to copy the Room link to share'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {/* Players List */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Players ({players.length})</h3>
                        {isAdmin && <span style={{ fontSize: '0.75rem', background: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', color: 'white' }}>You are Admin</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {players.map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    padding: '12px',
                                    background: 'var(--surface-hover)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: p.id === playerId ? '1px solid var(--primary)' : 'none'
                                }}
                            >
                                <span style={{ fontWeight: '500' }}>{p.name} {p.id === playerId && '(You)'}</span>
                                {p.id === adminId && <span style={{ fontSize: '1.2rem' }}>👑</span>}
                            </div>
                        ))}
                    </div>
                    {players.length < 3 && (
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--error)' }}>
                            Need at least 3 players to start.
                        </p>
                    )}
                </div>

                {/* Game Settings */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Game Settings</h3>

                    {/* Game Mode Selector */}
                    {isAdmin && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#94a3b8', fontWeight: '600' }}>
                                🎮 Modo de Juego
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn"
                                    onClick={() => updateSettings(code, { gameMode: 'IMPOSTOR' })}
                                    style={{
                                        flex: 1,
                                        background: gameState.gameMode === 'IMPOSTOR' ? 'var(--primary)' : 'var(--surface)',
                                        color: gameState.gameMode === 'IMPOSTOR' ? 'white' : 'var(--text)',
                                        border: gameState.gameMode === 'IMPOSTOR' ? 'none' : '1px solid var(--border)'
                                    }}
                                >
                                    🕵️ Impostor
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => updateSettings(code, { gameMode: 'LOBO' })}
                                    style={{
                                        flex: 1,
                                        background: gameState.gameMode === 'LOBO' ? 'var(--primary)' : 'var(--surface)',
                                        color: gameState.gameMode === 'LOBO' ? 'white' : 'var(--text)',
                                        border: gameState.gameMode === 'LOBO' ? 'none' : '1px solid var(--border)'
                                    }}
                                >
                                    🐺 Lobo
                                </button>
                            </div>
                        </div>
                    )}

                    {!isAdmin && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '8px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                                Modo: <strong>{gameState.gameMode === 'LOBO' ? '🐺 Lobo' : '🕵️ Impostor'}</strong>
                            </p>
                        </div>
                    )}

                    {/* Werewolf Role Configuration */}
                    {gameState.gameMode === 'LOBO' && isAdmin && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                            <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#dc2626', fontWeight: '600' }}>
                                🐺 Configuración de Roles
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                                        Lobos
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={gameState.werewolfConfig.numWolves}
                                        onChange={(e) => updateSettings(code, {
                                            werewolfConfig: { ...gameState.werewolfConfig, numWolves: parseInt(e.target.value) || 1 }
                                        })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                                        Videntes
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="2"
                                        value={gameState.werewolfConfig.numSeers}
                                        onChange={(e) => updateSettings(code, {
                                            werewolfConfig: { ...gameState.werewolfConfig, numSeers: parseInt(e.target.value) || 0 }
                                        })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                                        Brujas
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1"
                                        value={gameState.werewolfConfig.numWitches}
                                        onChange={(e) => updateSettings(code, {
                                            werewolfConfig: { ...gameState.werewolfConfig, numWitches: parseInt(e.target.value) || 0 }
                                        })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                                        Cazadores
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="2"
                                        value={gameState.werewolfConfig.numHunters}
                                        onChange={(e) => updateSettings(code, {
                                            werewolfConfig: { ...gameState.werewolfConfig, numHunters: parseInt(e.target.value) || 0 }
                                        })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={gameState.werewolfConfig.hasCupid}
                                        onChange={(e) => updateSettings(code, {
                                            werewolfConfig: { ...gameState.werewolfConfig, hasCupid: e.target.checked }
                                        })}
                                    />
                                    💘 Cupido
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={gameState.werewolfConfig.hasLittleGirl}
                                        onChange={(e) => updateSettings(code, {
                                            werewolfConfig: { ...gameState.werewolfConfig, hasLittleGirl: e.target.checked }
                                        })}
                                    />
                                    👧 Niña Pequeña
                                </label>
                            </div>
                        </div>
                    )}


                    {/* Only show Impostor settings if in Impostor mode */}
                    {gameState.gameMode === 'IMPOSTOR' && (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                                    Number of Rounds
                                </label>
                                {isAdmin ? (
                                    <>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={settings.rounds}
                                            onChange={handleRoundsChange}
                                            style={{ width: '100px' }}
                                        />
                                        <button
                                            className="btn"
                                            onClick={() => startRandomGame(code)}
                                            style={{
                                                marginTop: '0.5rem',
                                                background: '#10b981',
                                                color: 'white',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                justifyContent: 'center'
                                            }}
                                            disabled={players.length < 3}
                                        >
                                            <span>🎲</span>
                                            Start random game
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{settings.rounds}</div>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                                    Secret Words ({settings.words.length}/{settings.rounds})
                                    {settings.aiGenerated && <span style={{ marginLeft: '0.5rem', color: 'var(--primary)' }}>✨ AI Generated</span>}
                                </label>

                                {isAdmin && (
                                    <>
                                        {/* AI Word Generation */}
                                        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '1rem' }}>✨</span>
                                                <strong style={{ fontSize: '0.875rem' }}>AI Word Generation</strong>
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                                                Words will be hidden from everyone, including you!
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Enter theme (e.g., 'travel', 'food', 'movies')"
                                                    value={aiTheme}
                                                    onChange={(e) => setAiTheme(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                                                    disabled={aiGenerating}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: 'auto', whiteSpace: 'nowrap' }}
                                                    onClick={handleGenerateAI}
                                                    disabled={aiGenerating}
                                                >
                                                    {aiGenerating ? 'Generating...' : 'Generate'}
                                                </button>
                                            </div>
                                            {settings.aiGenerated && (
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }}
                                                    onClick={() => updateSettings(code, { words: [], aiGenerated: false, theme: null })}
                                                >
                                                    Clear & Generate New Words
                                                </button>
                                            )}
                                        </div>

                                        {/* Manual Word Input */}
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                                Or add words manually:
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Enter a secret word"
                                                    value={newWord}
                                                    onChange={(e) => setNewWord(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                                                />
                                                <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleAddWord}>Add</button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {settings.words.map((word, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                background: 'var(--surface-hover)',
                                                padding: '4px 12px',
                                                borderRadius: '16px',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {settings.aiGenerated ? '???' : (isAdmin ? word : '???')}
                                            {isAdmin && !settings.aiGenerated && (
                                                <span
                                                    style={{ cursor: 'pointer', color: 'var(--error)' }}
                                                    onClick={() => handleRemoveWord(index)}
                                                >
                                                    ×
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {settings.words.length === 0 && (
                                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>No words added yet.</span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Start Game Button */}
                    {isAdmin ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (gameState.gameMode === 'LOBO') {
                                    startWerewolfGame(code);
                                } else {
                                    startGame(code);
                                }
                            }}
                            disabled={gameState.gameMode === 'IMPOSTOR' ? !canStart : players.length < 3}
                            style={{ opacity: (gameState.gameMode === 'IMPOSTOR' ? canStart : players.length >= 3) ? 1 : 0.5 }}
                        >
                            {gameState.gameMode === 'LOBO' ? '🐺 Iniciar Juego Lobo' : 'Start Game'}
                        </button>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                            Waiting for admin to start...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
