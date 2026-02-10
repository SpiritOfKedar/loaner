import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { recordPayment } from '@/hooks/useLoans';
import { formatCurrency } from '@/lib/penalty';
import { LoanWithUser } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface RecordPaymentModalProps {
    visible: boolean;
    loanWithUser: LoanWithUser | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RecordPaymentModal({
    visible,
    loanWithUser,
    onClose,
    onSuccess,
}: RecordPaymentModalProps) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const handleSubmit = async () => {
        if (!loanWithUser) return;

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setStatusMessage({ type: 'error', text: 'Please enter a valid payment amount.' });
            return;
        }

        if (parsedAmount > loanWithUser.current_due_amount) {
            setStatusMessage({
                type: 'error',
                text: `Payment exceeds the current due of ${formatCurrency(loanWithUser.current_due_amount)}.`,
            });
            return;
        }

        setLoading(true);
        setStatusMessage(null);
        try {
            await recordPayment(loanWithUser.id, parsedAmount);
            setStatusMessage({
                type: 'success',
                text: `${formatCurrency(parsedAmount)} recorded for ${loanWithUser.user.name}.`,
            });
            setAmount('');
            onSuccess();
            // Auto-close after short delay to show success
            setTimeout(() => {
                setStatusMessage(null);
                onClose();
            }, 1200);
        } catch (error: any) {
            setStatusMessage({
                type: 'error',
                text: error.message || 'Failed to record payment.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStatusMessage(null);
        setAmount('');
        onClose();
    };

    const setPresetAmount = () => {
        if (loanWithUser) {
            setAmount(loanWithUser.installment_amount.toString());
        }
    };

    if (!loanWithUser) return null;


    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Record Payment</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Status Message */}
                    {statusMessage && (
                        <View
                            style={[
                                styles.statusBanner,
                                {
                                    backgroundColor:
                                        statusMessage.type === 'success'
                                            ? 'rgba(34,197,94,0.15)'
                                            : 'rgba(239,68,68,0.15)',
                                },
                            ]}
                        >
                            <Ionicons
                                name={
                                    statusMessage.type === 'success'
                                        ? 'checkmark-circle'
                                        : 'alert-circle'
                                }
                                size={18}
                                color={
                                    statusMessage.type === 'success'
                                        ? Colors.success
                                        : Colors.danger
                                }
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    {
                                        color:
                                            statusMessage.type === 'success'
                                                ? Colors.success
                                                : Colors.danger,
                                    },
                                ]}
                            >
                                {statusMessage.text}
                            </Text>
                        </View>
                    )}

                    {/* Borrower Info */}
                    <View style={styles.borrowerInfo}>
                        <View style={styles.avatarSmall}>
                            <Text style={styles.avatarInitial}>
                                {loanWithUser.user.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.borrowerName}>{loanWithUser.user.name}</Text>
                            <Text style={styles.borrowerDue}>
                                Due: {formatCurrency(loanWithUser.current_due_amount)}
                            </Text>
                        </View>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>Payment Amount (₹)</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                autoFocus
                            />
                        </View>

                        {/* Quick Fill Button */}
                        <TouchableOpacity style={styles.quickFill} onPress={setPresetAmount}>
                            <Ionicons name="flash" size={14} color={Colors.accent} />
                            <Text style={styles.quickFillText}>
                                Fill Hafta Amount: {formatCurrency(loanWithUser.installment_amount)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary */}
                    <View style={styles.summary}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Current Due</Text>
                            <Text style={styles.summaryValue}>
                                {formatCurrency(loanWithUser.current_due_amount)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>This Payment</Text>
                            <Text style={[styles.summaryValue, { color: Colors.success }]}>
                                - {formatCurrency(parseFloat(amount) || 0)}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabelBold}>Remaining</Text>
                            <Text style={styles.summaryValueBold}>
                                {formatCurrency(
                                    Math.max(0, loanWithUser.current_due_amount - (parseFloat(amount) || 0))
                                )}
                            </Text>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                                <Text style={styles.submitButtonText}>Confirm Payment</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        paddingBottom: Spacing.xxxl + 16,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: Colors.surfaceBorder,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.text,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    borrowerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surfaceElevated + '80',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xl,
    },
    avatarSmall: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.white,
    },
    borrowerName: {
        fontSize: FontSize.lg,
        fontWeight: '600',
        color: Colors.text,
    },
    borrowerDue: {
        fontSize: FontSize.sm,
        color: Colors.warning,
    },
    inputSection: {
        marginBottom: Spacing.xl,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: Colors.primary + '40',
        paddingHorizontal: Spacing.lg,
    },
    currencySymbol: {
        fontSize: FontSize.xxxl,
        color: Colors.textMuted,
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: FontSize.xxxl,
        fontWeight: '700',
        color: Colors.text,
        paddingVertical: Spacing.lg,
    },
    quickFill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    quickFillText: {
        fontSize: FontSize.sm,
        color: Colors.accent,
        fontWeight: '500',
    },
    summary: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    summaryLabel: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: FontSize.md,
        color: Colors.text,
        fontWeight: '500',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: Colors.surfaceBorder,
        marginVertical: Spacing.sm,
    },
    summaryLabelBold: {
        fontSize: FontSize.lg,
        color: Colors.text,
        fontWeight: '700',
    },
    summaryValueBold: {
        fontSize: FontSize.lg,
        color: Colors.primary,
        fontWeight: '700',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    statusText: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.white,
    },
});
