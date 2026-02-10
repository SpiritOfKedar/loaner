import { db } from '@/lib/firebase';
import { checkAndApplyPenalty, getNextDueDate } from '@/lib/penalty';
import { AppUser, Loan, LoanWithUser, Transaction } from '@/lib/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
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
        next_due_date: Timestamp.fromDate(penalty.newNextDueDate),
    });

    return true;
}

/**
 * Create a new user in Firestore
 */
export async function createUser(userData: Omit<AppUser, 'id'>): Promise<string> {
    const usersRef = collection(db, 'Users');
    const docRef = await addDoc(usersRef, {
        ...userData,
        role: userData.role || 'user',
    });
    return docRef.id;
}

/**
 * Create a new loan in Firestore
 */
export async function createLoan(loanData: Omit<Loan, 'id'>): Promise<string> {
    const loansRef = collection(db, 'Loans');
    const docRef = await addDoc(loansRef, {
        ...loanData,
        next_due_date: loanData.next_due_date || Timestamp.now(),
        status: loanData.status || 'active',
        paid_installments_count: loanData.paid_installments_count || 0,
        missed_installments_count: loanData.missed_installments_count || 0,
    });
    return docRef.id;
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

// ============================================================
// ADMIN CRUD OPERATIONS
// ============================================================

/**
 * Delete a borrower and ALL their loans + transactions (cascade delete)
 */
export async function deleteBorrower(userId: string): Promise<void> {
    // 1. Find all loans for this user
    const loansRef = collection(db, 'Loans');
    const loansQuery = query(loansRef, where('user_id', '==', userId));
    const loansSnap = await getDocs(loansQuery);

    // 2. For each loan, delete all transactions, then delete the loan
    for (const loanDoc of loansSnap.docs) {
        await deleteLoan(loanDoc.id);
    }

    // 3. Delete the user document
    await deleteDoc(doc(db, 'Users', userId));
}

/**
 * Delete a single loan and all its transactions
 */
export async function deleteLoan(loanId: string): Promise<void> {
    // Delete all transactions for this loan
    const txRef = collection(db, 'Transactions');
    const txQuery = query(txRef, where('loan_id', '==', loanId));
    const txSnap = await getDocs(txQuery);

    for (const txDoc of txSnap.docs) {
        await deleteDoc(doc(db, 'Transactions', txDoc.id));
    }

    // Delete the loan itself
    await deleteDoc(doc(db, 'Loans', loanId));
}

/**
 * Update loan fields (partial update)
 */
export async function updateLoan(
    loanId: string,
    updates: Partial<Omit<Loan, 'id'>>
): Promise<void> {
    const loanRef = doc(db, 'Loans', loanId);
    await updateDoc(loanRef, updates);
}

/**
 * Update user fields (partial update)
 */
export async function updateUser(
    userId: string,
    updates: Partial<Omit<AppUser, 'id'>>
): Promise<void> {
    const userRef = doc(db, 'Users', userId);
    await updateDoc(userRef, updates);
}

/**
 * Toggle loan status between active ↔ completed
 */
export async function toggleLoanStatus(loan: Loan): Promise<'active' | 'completed'> {
    const newStatus = loan.status === 'active' ? 'completed' : 'active';
    const loanRef = doc(db, 'Loans', loan.id);
    await updateDoc(loanRef, { status: newStatus });
    return newStatus;
}
