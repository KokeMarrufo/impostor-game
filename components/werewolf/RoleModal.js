'use client';
import styles from './RoleModal.module.css';

export default function RoleModal({ player, onClose }) {
    const isWolf = player.role === 'Lobo';

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
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.container} ${isWolf ? styles.wolf : styles.villager}`}>
                <h1 className={styles.playerName}>{player.name}</h1>
                <div className={styles.roleEmoji}>{getRoleEmoji(player.role)}</div>
                <h2 className={styles.roleName}>{player.role}</h2>
                <button className={styles.closeButton} onClick={onClose}>
                    [Tocar para cerrar]
                </button>
            </div>
        </div>
    );
}
