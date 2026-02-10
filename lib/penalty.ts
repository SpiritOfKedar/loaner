import { Timestamp } from 'firebase/firestore';
import { Loan } from './types';

const DEFAULT_PENALTY_RATE = 0.02; // 2% penalty

export interface PenaltyResult {
    shouldApply: boolean;
    newDueAmount: number;
    penaltyAmount: number;
    newMissedCount: number;
}

/**
 * Check if a loan is overdue and calculate the penalty.
 * If current_date > next_due_date, apply penalty interest to remaining due amount.
 */
export function checkAndApplyPenalty(loan: Loan): PenaltyResult {
    const now = new Date();
    const dueDate = loan.next_due_date.toDate();

    if (now <= dueDate || loan.status !== 'active') {
        return {
            shouldApply: false,
            newDueAmount: loan.current_due_amount,
            penaltyAmount: 0,
            newMissedCount: loan.missed_installments_count,
        };
    }

    const penaltyRate = loan.interest_rate > 0 ? loan.interest_rate / 100 : DEFAULT_PENALTY_RATE;
    const penaltyAmount = Math.round(loan.current_due_amount * penaltyRate);
    const newDueAmount = loan.current_due_amount + penaltyAmount;
    const newMissedCount = loan.missed_installments_count + 1;

    return {
        shouldApply: true,
        newDueAmount,
        penaltyAmount,
        newMissedCount,
    };
}

/**
 * Get the due status of a loan for display purposes.
 */
export function getDueStatus(loan: Loan): 'overdue' | 'upcoming' | 'normal' {
    const now = new Date();
    const dueDate = loan.next_due_date.toDate();

    if (now > dueDate) {
        return 'overdue';
    }

    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) {
        return 'upcoming';
    }

    return 'normal';
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format a Firestore Timestamp or Date to a readable date string
 */
export function formatDate(date: Timestamp | Date): string {
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Calculate next due date (advance by 7 days for weekly hafta)
 */
export function getNextDueDate(currentDueDate: Date): Date {
    const next = new Date(currentDueDate);
    next.setDate(next.getDate() + 7);
    return next;
}
