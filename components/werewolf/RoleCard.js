'use client';
import { useState } from 'react';
import styles from './RoleCard.module.css';

export default function RoleCard({ roleData }) {
    const [isRevealed, setIsRevealed] = useState(false);

    if (!roleData) return null;

    const { roleName, description, allies } = roleData;

    const getRoleEmoji = (role) => {
        switch (role) {
            case 'Lobo': return '🐺';
            case 'Vidente': return '🔮';
            case 'Bruja': return '🧙‍♀️';
            case 'Cazador': return '🏹';
            case 'Cupido': return '💘';
            case 'Niña Pequeña': return '👧';
            case 'Aldeano': return '👤';
            default: return '❓';
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <h2 className={styles.title}>Tu Rol Secreto</h2>
                <p className={styles.instruction}>
                    Mantén presionado para ver tu rol
                </p>

                <div
                    className={`${styles.card} ${isRevealed ? styles.revealed : ''}`}
                    onMouseDown={() => setIsRevealed(true)}
                    onMouseUp={() => setIsRevealed(false)}
                    onMouseLeave={() => setIsRevealed(false)}
                    onTouchStart={() => setIsRevealed(true)}
                    onTouchEnd={() => setIsRevealed(false)}
                >
                    <div className={styles.cardInner}>
                        {/* Card Back */}
                        <div className={styles.cardBack}>
                            <div className={styles.cardBackContent}>
                                <span className={styles.questionMark}>?</span>
                                <p>Presiona para revelar</p>
                            </div>
                        </div>

                        {/* Card Front */}
                        <div className={styles.cardFront}>
                            <div className={styles.roleEmoji}>{getRoleEmoji(roleName)}</div>
                            <h3 className={styles.roleName}>{roleName}</h3>
                            <p className={styles.roleDescription}>{description}</p>

                            {allies && allies.length > 0 && (
                                <div className={styles.allies}>
                                    <p className={styles.alliesTitle}>Tus aliados lobos:</p>
                                    <ul className={styles.alliesList}>
                                        {allies.map((allyName, idx) => (
                                            <li key={idx}>{allyName}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className={styles.warning}>
                    ⚠️ No compartas tu rol con nadie
                </p>
            </div>
        </div>
    );
}
