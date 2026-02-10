import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { formatCurrency, formatDate, getDueStatus } from '@/lib/penalty';
import { Loan } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LoanDetailViewProps {
    loan: Loan;
}

export default function LoanDetailView({ loan }: LoanDetailViewProps) {
    const dueStatus = getDueStatus(loan);
    const progress = loan.total_principal > 0
        ? ((loan.total_principal - loan.current_due_amount) / loan.total_principal) * 100
        : 0;

    return (
        <View style={styles.container}>
            {/* Progress Card */}
            <View style={styles.progressCard}>
                <Text style={styles.sectionTitle}>Repayment Progress</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {progress.toFixed(1)}% paid — {formatCurrency(loan.total_principal - loan.current_due_amount)} of {formatCurrency(loan.total_principal)}
                </Text>
            </View>

            {/* Detail Grid */}
            <View style={styles.grid}>
                <DetailItem
                    icon="cash-outline"
                    label="Total Principal"
                    value={formatCurrency(loan.total_principal)}
                    color={Colors.text}
                />
                <DetailItem
                    icon="alert-circle-outline"
                    label="Current Due"
                    value={formatCurrency(loan.current_due_amount)}
                    color={Colors.warning}
                />
                <DetailItem
                    icon="wallet-outline"
                    label="Hafta Amount"
                    value={formatCurrency(loan.installment_amount)}
                    color={Colors.accent}
                />
                <DetailItem
                    icon="trending-up-outline"
                    label="Interest Rate"
                    value={`${loan.interest_rate}%`}
                    color={Colors.primaryLight}
                />
                <DetailItem
                    icon="calendar-outline"
                    label="Next Due Date"
                    value={formatDate(loan.next_due_date)}
                    color={dueStatus === 'overdue' ? Colors.danger : dueStatus === 'upcoming' ? Colors.warning : Colors.success}
                />
                <DetailItem
                    icon="flag-outline"
                    label="Status"
                    value={loan.status.toUpperCase()}
                    color={loan.status === 'active' ? Colors.success : loan.status === 'completed' ? Colors.primary : Colors.danger}
                />
                <DetailItem
                    icon="checkmark-circle-outline"
                    label="Bharlele Hafte"
                    value={loan.paid_installments_count.toString()}
                    color={Colors.success}
                />
                <DetailItem
                    icon="close-circle-outline"
                    label="Chukvlele Hafte"
                    value={loan.missed_installments_count.toString()}
                    color={Colors.danger}
                />
            </View>
        </View>
    );
}

function DetailItem({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <View style={styles.detailItem}>
            <View style={styles.detailHeader}>
                <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
                <Text style={styles.detailLabel}>{label}</Text>
            </View>
            <Text style={[styles.detailValue, { color }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
    },
    progressCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder + '30',
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.success,
        borderRadius: 4,
    },
    progressText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    detailItem: {
        width: '47%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder + '20',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.xs,
    },
    detailLabel: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
});
