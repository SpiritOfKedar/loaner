import { Linking, Platform } from 'react-native';
import { formatCurrency, formatDate, getDueStatus } from './penalty';
import { AppUser, Loan } from './types';

/**
 * Build a reminder message based on the loan's due status.
 */
export function buildReminderMessage(user: AppUser, loan: Loan): string {
    const status = getDueStatus(loan);
    const amount = formatCurrency(loan.installment_amount);
    const date = formatDate(loan.next_due_date);

    if (status === 'overdue') {
        return `Hello ${user.name}, your hafta of ${amount} was due on ${date}. Please pay immediately to avoid penalty. - VickyFinance`;
    }

    if (status === 'upcoming') {
        return `Hello ${user.name}, friendly reminder that your hafta of ${amount} is due on ${date}. - VickyFinance`;
    }

    return `Hello ${user.name}, your next hafta of ${amount} is scheduled for ${date}. - VickyFinance`;
}

/**
 * Open the default SMS app with a pre-filled message.
 * On web, falls back to opening a new window with the sms: URL.
 */
export async function openSMS(phoneNumber: string, message: string): Promise<void> {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${phoneNumber}${separator}body=${encodeURIComponent(message)}`;

    if (Platform.OS === 'web') {
        // On web, try opening the sms: link directly via window.open
        window.open(url, '_blank');
        return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
        await Linking.openURL(url);
    } else {
        // Fallback — try without body
        await Linking.openURL(`sms:${phoneNumber}`);
    }
}

/**
 * Open WhatsApp with a pre-filled message.
 * Uses wa.me URL which works on both web and mobile.
 */
export async function openWhatsApp(phoneNumber: string, message: string): Promise<void> {
    // Ensure phone starts with country code (default India +91)
    let phone = phoneNumber.replace(/[^0-9]/g, '');
    if (phone.length === 10) {
        phone = `91${phone}`;
    }

    // wa.me URLs work universally — they open WhatsApp Web on desktop browsers
    // and the WhatsApp app on mobile
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    if (Platform.OS === 'web') {
        window.open(url, '_blank');
        return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
        await Linking.openURL(url);
    } else {
        // Fallback to whatsapp:// protocol
        await Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
    }
}
