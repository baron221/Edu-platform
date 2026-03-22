'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';
import { toast } from 'react-hot-toast';

interface PromoCode {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    expiresAt: string | null;
    usageLimit: number | null;
    usageCount: number;
    isActive: boolean;
    createdAt: string;
}

export default function PromoCodesPage() {
    const { t } = useLanguage();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCode, setNewCode] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        expiresAt: '',
        usageLimit: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const fetchPromoCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/promo-codes');
            const data = await res.json();
            if (res.ok) {
                setPromoCodes(data);
            } else {
                toast.error(data.error || 'Failed to fetch promo codes');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching promo codes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/promo-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCode),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(t.adminPromo.successCreate);
                setShowCreateForm(false);
                setNewCode({
                    code: '',
                    discountType: 'PERCENTAGE',
                    discountValue: 0,
                    expiresAt: '',
                    usageLimit: '',
                });
                fetchPromoCodes();
            } else {
                toast.error(data.error || 'Failed to create promo code');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error creating promo code');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;

        try {
            const res = await fetch(`/api/admin/promo-codes/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success(t.adminPromo.successDelete);
                fetchPromoCodes();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete promo code');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error deleting promo code');
        }
    };

    if (loading && promoCodes.length === 0) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t.adminPromo.title}</h1>
                    <p className={styles.subtitle}>{t.adminPromo.desc}</p>
                </div>
                <button
                    className={styles.createBtn}
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? t.admin.cancel : t.adminPromo.create}
                </button>
            </div>

            {showCreateForm && (
                <div className={styles.formCard}>
                    <form onSubmit={handleCreate}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>{t.adminPromo.code}</label>
                                <input
                                    type="text"
                                    value={newCode.code}
                                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. SUMMER2026"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t.adminPromo.type}</label>
                                <select
                                    value={newCode.discountType}
                                    onChange={(e) => setNewCode({ ...newCode, discountType: e.target.value })}
                                >
                                    <option value="PERCENTAGE">{t.adminPromo.percentage}</option>
                                    <option value="FIXED">{t.adminPromo.fixed}</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t.adminPromo.value}</label>
                                <input
                                    type="number"
                                    value={newCode.discountValue}
                                    onChange={(e) => setNewCode({ ...newCode, discountValue: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t.adminPromo.expiry}</label>
                                <input
                                    type="date"
                                    value={newCode.expiresAt}
                                    onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t.adminPromo.limit}</label>
                                <input
                                    type="number"
                                    value={newCode.usageLimit}
                                    onChange={(e) => setNewCode({ ...newCode, usageLimit: e.target.value })}
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                {submitting ? t.admin.saving : t.adminPromo.create}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.tableCard}>
                <div className={styles.table}>
                    <div className={styles.tableHead}>
                        <span>{t.adminPromo.code}</span>
                        <span>{t.adminPromo.type}</span>
                        <span>{t.adminPromo.value}</span>
                        <span>{t.adminPromo.expiry}</span>
                        <span>{t.adminPromo.limit}</span>
                        <span>{t.adminPromo.used}</span>
                        <span>{t.adminPromo.status}</span>
                        <span></span>
                    </div>
                    {promoCodes.length === 0 ? (
                        <div className={styles.empty}>{t.adminPromo.empty}</div>
                    ) : (
                        promoCodes.map((promo) => (
                            <div key={promo.id} className={styles.tableRow}>
                                <span className={styles.promoCodeText}>{promo.code}</span>
                                <span>{promo.discountType === 'PERCENTAGE' ? t.adminPromo.percentage : t.adminPromo.fixed}</span>
                                <span>
                                    {promo.discountType === 'PERCENTAGE'
                                        ? `${promo.discountValue}%`
                                        : `${promo.discountValue.toLocaleString()} UZS`}
                                </span>
                                <span>{promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : '∞'}</span>
                                <span>{promo.usageLimit || '∞'}</span>
                                <span>{promo.usageCount}</span>
                                <span>
                                    <span className={`${styles.statusBadge} ${promo.isActive ? styles.statusActive : styles.statusInactive}`}>
                                        {promo.isActive ? t.adminPromo.active : t.adminPromo.inactive}
                                    </span>
                                </span>
                                <span className={styles.actions}>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(promo.id)}
                                    >
                                        🗑️
                                    </button>
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
