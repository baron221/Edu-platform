'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import styles from './page.module.css';

interface ManualPayment {
    id: string;
    userId: string;
    courseId: string | null;
    planId: string | null;
    receiptUrl: string;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string | null;
    };
    course: {
        title: string;
        price: number;
    } | null;
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<ManualPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/manual-payments');
            if (res.ok) {
                const data = await res.json();
                setPayments(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this payment?`)) return;

        try {
            const res = await fetch('/api/admin/manual-payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });

            if (res.ok) {
                toast.success(`Payment ${status} successfully!`);
                fetchPayments(); // Refresh list
            } else {
                toast.error('Failed to update status');
            }
        } catch (err) {
            toast.error('An error occurred');
        }
    };

    if (loading) return <div className={styles.page}>Loading payments...</div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Manual Payments</h1>
                    <p className={styles.subtitle}>Review and approve bank transfer receipts from students and instructors.</p>
                </div>
                <Link href="/admin" className="btn btn-secondary">
                    Back to Dashboard
                </Link>
            </div>

            <div className={styles.table}>
                <div className={styles.tableHeader}>
                    <span>User</span>
                    <span>Item</span>
                    <span>Receipt</span>
                    <span>Status</span>
                    <span>Actions</span>
                </div>

                {payments.length === 0 ? (
                    <div className={styles.empty}>No manual payments found.</div>
                ) : (
                    payments.map(p => (
                        <div key={p.id} className={styles.tableRow}>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{p.user.name || 'Unknown'}</span>
                                <span className={styles.userEmail}>{p.user.email}</span>
                            </div>

                            <div className={styles.itemInfo}>
                                {p.courseId ? (
                                    <>
                                        <strong>📚 Course:</strong> {p.course?.title}<br/>
                                        <small>{p.course?.price.toLocaleString()} UZS</small>
                                    </>
                                ) : (
                                    <>
                                        <strong>⭐ Subscription</strong><br/>
                                        <small>Plan: {p.planId}</small>
                                    </>
                                )}
                            </div>

                            <div>
                                <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className={styles.viewReceipt}>
                                    📄 View Receipt
                                </a>
                            </div>

                            <div>
                                <span className={`${styles.statusBadge} ${styles['status' + p.status]}`}>
                                    {p.status}
                                </span>
                            </div>

                            <div className={styles.actions}>
                                {p.status === 'pending' && (
                                    <>
                                        <button className={styles.approveBtn} onClick={() => handleStatusUpdate(p.id, 'approved')}>
                                            ✅ Approve
                                        </button>
                                        <button className={styles.rejectBtn} onClick={() => handleStatusUpdate(p.id, 'rejected')}>
                                            ❌ Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
