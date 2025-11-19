'use client';
import { use, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import Lobby from '@/components/Lobby';
import CardReveal from '@/components/CardReveal';
import Voting from '@/components/Voting';
import RoundResult from '@/components/RoundResult';
import GameResult from '@/components/GameResult';

export default function Room({ params }) {
    const { code } = use(params);
    const { gameState } = useGame();

    if (!gameState) {
        return (
            <main className="container" style={{ alignItems: 'center' }}>
                <div className="card">
                    <h2>Connecting...</h2>
                    <p>Room: {code}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="container">
            {gameState.state === 'LOBBY' && <Lobby code={code} />}
            {gameState.state === 'PLAYING' && <CardReveal />}
            {gameState.state === 'VOTING' && <Voting />}
            {gameState.state === 'ROUND_END' && <RoundResult />}
            {gameState.state === 'GAME_END' && <GameResult />}
        </main>
    );
}
