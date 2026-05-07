'use client';
import Link from 'next/link';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <div className={styles.page} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <div className="container">
        <h1 className="gradient-text" style={{ fontSize: '120px', marginBottom: '20px' }}>404</h1>
        <h2 style={{ fontSize: '32px', marginBottom: '20px', color: 'white' }}>Sahifa topilmadi</h2>
        <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 40px' }}>
          Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan bo'lishi mumkin.
        </p>
        <Link href="/" className="btn btn-primary btn-lg">
          Asosiy sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
