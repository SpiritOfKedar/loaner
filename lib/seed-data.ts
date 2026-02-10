/**
 * Firestore Seed Data Script
 * 
 * Run this manually via Firebase Console or a Node.js script
 * to populate your Firestore with test data.
 * 
 * INSTRUCTIONS:
 * 1. Go to Firebase Console → Firestore
 * 2. Create the following collections and documents manually,
 *    OR use the Firebase Admin SDK with this data.
 * 
 * FIREBASE AUTH SETUP:
 * Create these users in Firebase Auth (Authentication → Users):
 *   - admin@vickyfinance.com / admin123   (UID: use the auto-generated one)
 *   - rahul@example.com / user123         (UID: use the auto-generated one)
 *   - priya@example.com / user123         (UID: use the auto-generated one)
 */

export const SEED_USERS = [
    {
        // Document ID should match Firebase Auth UID for admin
        id: "ADMIN_AUTH_UID_HERE",
        name: "Vicky Admin",
        mobile_number: "9876543210",
        photo_url: "",
        role: "admin",
    },
    {
        id: "USER1_AUTH_UID_HERE",
        name: "Rahul Sharma",
        mobile_number: "9876543211",
        photo_url: "",
        role: "user",
    },
    {
        id: "USER2_AUTH_UID_HERE",
        name: "Priya Patil",
        mobile_number: "9876543212",
        photo_url: "",
        role: "user",
    },
    {
        id: "USER3_AUTH_UID_HERE",
        name: "Amit Deshmukh",
        mobile_number: "9876543213",
        photo_url: "",
        role: "user",
    },
];

/**
 * Loans Collection
 * 
 * Create these as documents in the "Loans" collection.
 * Use Firestore Timestamps for date fields.
 */
export const SEED_LOANS = [
    {
        user_id: "USER1_AUTH_UID_HERE",
        total_principal: 50000,
        current_due_amount: 32000,
        installment_amount: 2000,  // weekly hafta
        next_due_date: "2026-02-12T00:00:00",  // Use Firestore Timestamp
        paid_installments_count: 9,
        missed_installments_count: 0,
        interest_rate: 2,
        status: "active",
    },
    {
        user_id: "USER2_AUTH_UID_HERE",
        total_principal: 100000,
        current_due_amount: 85000,
        installment_amount: 5000,
        next_due_date: "2026-02-08T00:00:00",  // Overdue (past date for testing)
        paid_installments_count: 3,
        missed_installments_count: 2,
        interest_rate: 2,
        status: "active",
    },
    {
        user_id: "USER3_AUTH_UID_HERE",
        total_principal: 25000,
        current_due_amount: 10000,
        installment_amount: 1500,
        next_due_date: "2026-02-11T00:00:00",  // Due in 1 day (upcoming)
        paid_installments_count: 10,
        missed_installments_count: 1,
        interest_rate: 2,
        status: "active",
    },
];

/**
 * Transactions Collection
 * 
 * Sample payment transactions.
 */
export const SEED_TRANSACTIONS = [
    {
        loan_id: "LOAN1_ID_HERE",
        amount_paid: 2000,
        date: "2026-01-27T10:00:00",
    },
    {
        loan_id: "LOAN1_ID_HERE",
        amount_paid: 2000,
        date: "2026-02-03T10:00:00",
    },
    {
        loan_id: "LOAN2_ID_HERE",
        amount_paid: 5000,
        date: "2026-01-20T10:00:00",
    },
    {
        loan_id: "LOAN3_ID_HERE",
        amount_paid: 1500,
        date: "2026-01-30T10:00:00",
    },
];
