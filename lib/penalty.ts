import { Timestamp } from 'firebase/firestore';
import { Loan } from './types';

const DEFAULT_PENALTY_RATE = 0.02; // 2% penalty
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface PenaltyResult {
    shouldApply: boolean;
    newDueAmount: number;
    penaltyAmount: number;
    newMissedCount: number;
    newNextDueDate: Date;
}

/**
 * Check if a loan is overdue and calculate the penalty.
 * Calculates how many full 7-day periods have been missed since next_due_date,
 * applies compound penalty for all missed periods at once, and advances
 * next_due_date forward so the penalty isn't re-applied on the next render.
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
            newNextDueDate: dueDate,
        };
    }

    // How many full 7-day hafta periods have been missed
    const missedPeriods = Math.floor((now.getTime() - dueDate.getTime()) / WEEK_MS);
    if (missedPeriods <= 0) {
        return {
            shouldApply: false,
            newDueAmount: loan.current_due_amount,
            penaltyAmount: 0,
            newMissedCount: loan.missed_installments_count,
            newNextDueDate: dueDate,
        };
    }

    const penaltyRate = loan.interest_rate > 0 ? loan.interest_rate / 100 : DEFAULT_PENALTY_RATE;

    // Apply compound penalty for each missed period
    let currentDue = loan.current_due_amount;
    let totalPenalty = 0;
    for (let i = 0; i < missedPeriods; i++) {
        const periodPenalty = Math.round(currentDue * penaltyRate);
        totalPenalty += periodPenalty;
        currentDue += periodPenalty;
    }

    // Advance due date past all missed periods so it's in the future
    const newNextDueDate = new Date(dueDate.getTime() + missedPeriods * WEEK_MS);

    return {
        shouldApply: true,
        newDueAmount: currentDue,
        penaltyAmount: totalPenalty,
        newMissedCount: loan.missed_installments_count + missedPeriods,
        newNextDueDate,
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
