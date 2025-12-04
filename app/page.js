'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';

export default function Home() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const { createRoom, joinRoom } = useGame();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return alert('Please enter your name');
    setLoading(true);
    const { success, code, adminPin } = await createRoom(name);
    setLoading(false);
    if (success) {
      alert(`Room created!\n\nRoom Code: ${code}\nAdmin PIN: ${adminPin}\n\n⚠️ Save this PIN! You'll need it to rejoin as admin if you refresh.`);
      router.push(`/room/${code}`);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return alert('Please enter name and room code');
    setLoading(true);
    const { success, error } = await joinRoom(roomCode.toUpperCase(), name);
    setLoading(false);
    if (success) router.push(`/room/${roomCode.toUpperCase()}`);
    else alert(error || 'Failed to join room');
  };

  return (
    <main className="container">
      <div className="card" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Impostor
        </h1>
        <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>
          Find the impostor among your friends.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create New Room'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <input
              type="text"
              placeholder="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              maxLength={4}
              style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '2px' }}
            />
            <button
              className="btn btn-secondary"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
