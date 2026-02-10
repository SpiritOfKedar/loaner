import { Timestamp } from 'firebase/firestore';

export interface AppUser {
    id: string;
    name: string;
    mobile_number: string;
    photo_url: string;
    role: 'admin' | 'user';
}

export interface Loan {
    id: string;
    user_id: string;
    total_principal: number;
    current_due_amount: number;
    installment_amount: number; // hafta
    next_due_date: Timestamp;
    paid_installments_count: number;
    missed_installments_count: number;
    interest_rate: number;
    status: 'active' | 'completed' | 'defaulted';
}

export interface Transaction {
    id: string;
    loan_id: string;
    amount_paid: number;
    date: Timestamp;
}

export interface LoanWithUser extends Loan {
    user: AppUser;
}
