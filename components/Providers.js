'use client';
import { GameProvider } from '@/context/GameContext';

export function Providers({ children }) {
    return <GameProvider>{children}</GameProvider>;
}
