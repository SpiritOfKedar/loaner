import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { updateLoan, updateUser } from '@/hooks/useLoans';
import { AppUser, Loan } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EditLoanModalProps {
    visible: boolean;
    loan: Loan | null;
    user: AppUser | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditLoanModal({
    visible,
    loan,
    user,
    onClose,
    onSuccess,
}: EditLoanModalProps) {
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    // User fields
    const [name, setName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');

    // Loan fields
    const [principal, setPrincipal] = useState('');
    const [installment, setInstallment] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [currentDue, setCurrentDue] = useState('');

    // Initialize fields when modal opens
    useEffect(() => {
        if (loan && user && visible) {
            setName(user.name);
            setMobileNumber(user.mobile_number);
            setPrincipal(loan.total_principal.toString());
            setInstallment(loan.installment_amount.toString());
            setInterestRate(loan.interest_rate.toString());
            setCurrentDue(loan.current_due_amount.toString());
            setStatusMessage(null);
        }
    }, [loan, user, visible]);

    const handleSave = async () => {
        if (!loan || !user) return;

        if (!name.trim() || !mobileNumber.trim()) {
            setStatusMessage({ type: 'error', text: 'Name and phone number are required.' });
            return;
        }

        const parsedPrincipal = parseFloat(principal);
        const parsedInstallment = parseFloat(installment);
        const parsedInterest = parseFloat(interestRate);
        const parsedDue = parseFloat(currentDue);

        if (isNaN(parsedPrincipal) || parsedPrincipal <= 0) {
            setStatusMessage({ type: 'error', text: 'Enter a valid principal amount.' });
            return;
        }
        if (isNaN(parsedInstallment) || parsedInstallment <= 0) {
            setStatusMessage({ type: 'error', text: 'Enter a valid installment amount.' });
            return;
        }
        if (isNaN(parsedInterest) || parsedInterest < 0) {
            setStatusMessage({ type: 'error', text: 'Enter a valid interest rate.' });
            return;
        }
        if (isNaN(parsedDue) || parsedDue < 0) {
            setStatusMessage({ type: 'error', text: 'Enter a valid current due amount.' });
            return;
        }

        setLoading(true);
        setStatusMessage(null);

        try {
            // Update user
            await updateUser(user.id, {
                name: name.trim(),
                mobile_number: mobileNumber.trim(),
            });

            // Update loan
            await updateLoan(loan.id, {
                total_principal: parsedPrincipal,
                installment_amount: parsedInstallment,
                interest_rate: parsedInterest,
                current_due_amount: parsedDue,
            });

            setStatusMessage({ type: 'success', text: 'Details updated successfully!' });
            onSuccess();

            setTimeout(() => {
                setStatusMessage(null);
                onClose();
            }, 1000);
        } catch (error: any) {
            setStatusMessage({
                type: 'error',
                text: error.message || 'Failed to update. Try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStatusMessage(null);
        onClose();
    };

    if (!loan || !user) return null;

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
                        <Text style={styles.title}>Edit Details</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Status */}
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
                                size={16}
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

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* User Section */}
                        <Text style={styles.sectionLabel}>BORROWER INFO</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mobile Number</Text>
                            <TextInput
                                style={styles.input}
                                value={mobileNumber}
                                onChangeText={setMobileNumber}
                                keyboardType="phone-pad"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        {/* Loan Section */}
                        <Text style={styles.sectionLabel}>LOAN DETAILS</Text>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Principal</Text>
                                <TextInput
                                    style={styles.input}
                                    value={principal}
                                    onChangeText={setPrincipal}
                                    keyboardType="numeric"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Current Due</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currentDue}
                                    onChangeText={setCurrentDue}
                                    keyboardType="numeric"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Hafta (₹)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={installment}
                                    onChangeText={setInstallment}
                                    keyboardType="numeric"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Interest (%)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={interestRate}
                                    onChangeText={setInterestRate}
                                    keyboardType="numeric"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                                <Text style={styles.saveButtonText}>Save Changes</Text>
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
        maxHeight: '85%',
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
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.text,
    },
    closeButton: {
        padding: Spacing.xs,
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
    sectionLabel: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
        marginLeft: 2,
    },
    input: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: Colors.text,
        fontSize: FontSize.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
});
