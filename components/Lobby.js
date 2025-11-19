'use client';
import { useState } from 'react';
import { useGame } from '@/context/GameContext';

export default function Lobby({ code }) {
    const { gameState, playerId, updateSettings, startGame } = useGame();
    const { players, adminId, settings } = gameState;
    const isAdmin = playerId === adminId;
    const [newWord, setNewWord] = useState('');

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        alert('Room code copied!');
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

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                            Number of Rounds
                        </label>
                        {isAdmin ? (
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={settings.rounds}
                                onChange={handleRoundsChange}
                                style={{ width: '100px' }}
                            />
                        ) : (
                            <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{settings.rounds}</div>
                        )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                            Secret Words ({settings.words.length}/{settings.rounds})
                        </label>

                        {isAdmin && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter a secret word"
                                    value={newWord}
                                    onChange={(e) => setNewWord(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                                />
                                <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleAddWord}>Add</button>
                            </div>
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
                                    {isAdmin ? word : '???'}
                                    {isAdmin && (
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

                    {isAdmin ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => startGame(code)}
                            disabled={!canStart}
                            style={{ opacity: canStart ? 1 : 0.5 }}
                        >
                            Start Game
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
