import { db } from '@/lib/firebase';
import { checkAndApplyPenalty, getNextDueDate } from '@/lib/penalty';
import { AppUser, Loan, LoanWithUser, Transaction } from '@/lib/types';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch all loans with user details (for Admin)
 */
export function useAllLoans() {
    const [loans, setLoans] = useState<LoanWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loansRef = collection(db, 'Loans');
        const q = query(loansRef, where('status', '==', 'active'));

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                try {
                    const loanData: LoanWithUser[] = [];

                    for (const loanDoc of snapshot.docs) {
                        const loan = { id: loanDoc.id, ...loanDoc.data() } as Loan;

                        // Fetch associated user
                        const userDoc = await getDoc(doc(db, 'Users', loan.user_id));
                        const user = userDoc.exists()
                            ? ({ id: userDoc.id, ...userDoc.data() } as AppUser)
                            : {
                                id: loan.user_id,
                                name: 'Unknown User',
                                mobile_number: '',
                                photo_url: '',
                                role: 'user' as const,
                            };

                        loanData.push({ ...loan, user });
                    }

                    setLoans(loanData);
                    setError(null);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    return { loans, loading, error };
}

/**
 * Hook to fetch loans for a specific user (for User view)
 */
export function useUserLoans(userId: string) {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const loansRef = collection(db, 'Loans');
        const q = query(loansRef, where('user_id', '==', userId));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const loanData = snapshot.docs.map(
                    (d) => ({ id: d.id, ...d.data() } as Loan)
                );
                setLoans(loanData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [userId]);

    return { loans, loading, error };
}

/**
 * Record a payment for a loan
 */
export async function recordPayment(
    loanId: string,
    amount: number
): Promise<void> {
    const loanRef = doc(db, 'Loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error('Loan not found');
    }

    const loan = { id: loanSnap.id, ...loanSnap.data() } as Loan;

    // Add transaction record
    await addDoc(collection(db, 'Transactions'), {
        loan_id: loanId,
        amount_paid: amount,
        date: Timestamp.now(),
    });

    // Update loan
    const newDueAmount = Math.max(0, loan.current_due_amount - amount);
    const newPaidCount = loan.paid_installments_count + 1;
    const nextDueDate = getNextDueDate(loan.next_due_date.toDate());
    const newStatus = newDueAmount <= 0 ? 'completed' : 'active';

    await updateDoc(loanRef, {
        current_due_amount: newDueAmount,
        paid_installments_count: newPaidCount,
        next_due_date: Timestamp.fromDate(nextDueDate),
        status: newStatus,
    });
}

/**
 * Apply penalty to an overdue loan
 */
export async function applyPenaltyToLoan(loan: Loan): Promise<boolean> {
    const penalty = checkAndApplyPenalty(loan);

    if (!penalty.shouldApply) return false;

    const loanRef = doc(db, 'Loans', loan.id);
    await updateDoc(loanRef, {
        current_due_amount: penalty.newDueAmount,
        missed_installments_count: penalty.newMissedCount,
    });

    return true;
}

/**
 * Hook to fetch transactions for a specific loan
 */
export function useTransactions(loanId: string) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loanId) return;

        const txRef = collection(db, 'Transactions');
        const q = query(
            txRef,
            where('loan_id', '==', loanId),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txData = snapshot.docs.map(
                (d) => ({ id: d.id, ...d.data() } as Transaction)
            );
            setTransactions(txData);
            setLoading(false);
        });

        return unsubscribe;
    }, [loanId]);

    return { transactions, loading };
}
