import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { formatCurrency, formatDate, getDueStatus } from '@/lib/penalty';
import { LoanWithUser } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import SendReminderModal from './SendReminderModal';

interface BorrowerCardProps {
    loanWithUser: LoanWithUser;
    onRecordPayment: (loanWithUser: LoanWithUser) => void;
    onViewDetails: (loanWithUser: LoanWithUser) => void;
}

export default function BorrowerCard({
    loanWithUser,
    onRecordPayment,
    onViewDetails,
}: BorrowerCardProps) {
    const { user } = loanWithUser;
    const dueStatus = getDueStatus(loanWithUser);
    const [reminderVisible, setReminderVisible] = useState(false);

    const getDueStatusStyle = () => {
        switch (dueStatus) {
            case 'overdue':
                return { bg: Colors.dangerBg, text: Colors.danger, label: '⚠️ OVERDUE' };
            case 'upcoming':
                return { bg: Colors.warningBg, text: Colors.warning, label: '⏰ DUE SOON' };
            default:
                return { bg: Colors.successBg, text: Colors.success, label: '✅ ON TRACK' };
        }
    };

    const statusStyle = getDueStatusStyle();

    return (
        <>
            <TouchableOpacity
                style={styles.card}
                onPress={() => onViewDetails(loanWithUser)}
                activeOpacity={0.85}
            >
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                    </Text>
                </View>

                {/* Header: Avatar + User Info */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        {user.photo_url ? (
                            <Image source={{ uri: user.photo_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>
                                    {user.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <View style={styles.phoneRow}>
                            <Ionicons name="call-outline" size={12} color={Colors.textMuted} />
                            <Text style={styles.phoneText}>{user.mobile_number}</Text>
                        </View>
                    </View>
                </View>

                {/* Amount Section */}
                <View style={styles.amountSection}>
                    <View style={styles.amountBlock}>
                        <Text style={styles.amountLabel}>Principal</Text>
                        <Text style={styles.amountValue}>
                            {formatCurrency(loanWithUser.total_principal)}
                        </Text>
                    </View>
                    <View style={styles.amountDivider} />
                    <View style={styles.amountBlock}>
                        <Text style={styles.amountLabel}>Current Due</Text>
                        <Text style={[styles.amountValue, styles.dueAmount]}>
                            {formatCurrency(loanWithUser.current_due_amount)}
                        </Text>
                    </View>
                    <View style={styles.amountDivider} />
                    <View style={styles.amountBlock}>
                        <Text style={styles.amountLabel}>Hafta</Text>
                        <Text style={styles.amountValue}>
                            {formatCurrency(loanWithUser.installment_amount)}
                        </Text>
                    </View>
                </View>

                {/* Due Date + Installment Stats */}
                <View style={styles.statsRow}>
                    {/* Due Date */}
                    <View style={[styles.statChip, { backgroundColor: statusStyle.bg }]}>
                        <Ionicons name="calendar" size={14} color={statusStyle.text} />
                        <Text style={[styles.statChipText, { color: statusStyle.text }]}>
                            {formatDate(loanWithUser.next_due_date)}
                        </Text>
                    </View>

                    {/* Missed Haftas */}
                    <View style={[styles.statChip, { backgroundColor: Colors.dangerBg }]}>
                        <Ionicons name="close-circle" size={14} color={Colors.danger} />
                        <Text style={[styles.statChipText, { color: Colors.danger }]}>
                            {loanWithUser.missed_installments_count} चुकवलेले
                        </Text>
                    </View>

                    {/* Paid Haftas */}
                    <View style={[styles.statChip, { backgroundColor: Colors.successBg }]}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={[styles.statChipText, { color: Colors.success }]}>
                            {loanWithUser.paid_installments_count} भरलेले
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => onRecordPayment(loanWithUser)}
                    >
                        <Ionicons name="cash-outline" size={16} color={Colors.white} />
                        <Text style={styles.payButtonText}>Record Payment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.remindButton}
                        onPress={() => setReminderVisible(true)}
                    >
                        <Ionicons name="notifications-outline" size={16} color={Colors.warning} />
                        <Text style={styles.remindButtonText}>Remind</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Reminder Modal */}
            <SendReminderModal
                visible={reminderVisible}
                user={user}
                loan={loanWithUser}
                onClose={() => setReminderVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder + '30',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.md,
    },
    statusText: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatarContainer: {
        marginRight: Spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.white,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    amountSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated + '60',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    amountBlock: {
        flex: 1,
        alignItems: 'center',
    },
    amountDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.surfaceBorder,
    },
    amountLabel: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    amountValue: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
    },
    dueAmount: {
        color: Colors.warning,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
    },
    statChipText: {
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    payButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    payButtonText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    remindButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.warningBg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    remindButtonText: {
        color: Colors.warning,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
});
