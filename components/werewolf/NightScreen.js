'use client';
import styles from './NightScreen.module.css';

export default function NightScreen() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.moon}>🌙</div>
                <h1 className={styles.title}>Es de noche...</h1>
                <p className={styles.subtitle}>Cierra los ojos</p>
            </div>
        </div>
    );
}
