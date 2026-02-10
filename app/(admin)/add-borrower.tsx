import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { createLoan, createUser } from '@/hooks/useLoans';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddBorrowerScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    // User State
    const [name, setName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');

    // Loan State
    const [principal, setPrincipal] = useState('');
    const [installment, setInstallment] = useState('');
    const [interestRate, setInterestRate] = useState('2');

    const resetForm = () => {
        setName('');
        setMobileNumber('');
        setPrincipal('');
        setInstallment('');
        setInterestRate('2');
    };

    const handleSave = async () => {
        // Validate
        if (!name.trim() || !mobileNumber.trim() || !principal.trim() || !installment.trim() || !interestRate.trim()) {
            setStatusMessage({ type: 'error', text: 'Please fill all fields.' });
            return;
        }

        const parsedPrincipal = parseFloat(principal);
        const parsedInstallment = parseFloat(installment);
        const parsedInterest = parseFloat(interestRate);

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

        setLoading(true);
        setStatusMessage(null);

        try {
            // 1. Create User in Firestore
            const userId = await createUser({
                name: name.trim(),
                mobile_number: mobileNumber.trim(),
                photo_url: '',
                role: 'user',
            });

            // 2. Calculate first due date (7 days from today for the weekly hafta)
            const firstDueDate = new Date();
            firstDueDate.setDate(firstDueDate.getDate() + 7);

            // 3. Create Loan linked to the user
            await createLoan({
                user_id: userId,
                total_principal: parsedPrincipal,
                current_due_amount: parsedPrincipal,
                installment_amount: parsedInstallment,
                interest_rate: parsedInterest,
                next_due_date: Timestamp.fromDate(firstDueDate),
                paid_installments_count: 0,
                missed_installments_count: 0,
                status: 'active',
            });

            setStatusMessage({
                type: 'success',
                text: `${name.trim()} added with a loan of ₹${parsedPrincipal.toLocaleString('en-IN')}`,
            });
            resetForm();

            // Navigate back to dashboard after a short delay
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error: any) {
            console.error('Error adding borrower:', error);
            setStatusMessage({
                type: 'error',
                text: error.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Message */}
                {statusMessage && (
                    <View
                        style={[
                            styles.statusBanner,
                            {
                                backgroundColor:
                                    statusMessage.type === 'success'
                                        ? Colors.successBg
                                        : Colors.dangerBg,
                            },
                        ]}
                    >
                        <Ionicons
                            name={
                                statusMessage.type === 'success'
                                    ? 'checkmark-circle'
                                    : 'alert-circle'
                            }
                            size={20}
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

                {/* User Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>User Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={(t) => {
                                setName(t);
                                setStatusMessage(null);
                            }}
                            placeholder="e.g. Rahul Sharma"
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            value={mobileNumber}
                            onChangeText={(t) => {
                                setMobileNumber(t);
                                setStatusMessage(null);
                            }}
                            placeholder="e.g. 9876543210"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Loan Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loan Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Total Principal (Amount Given)</Text>
                        <TextInput
                            style={styles.input}
                            value={principal}
                            onChangeText={(t) => {
                                setPrincipal(t);
                                setStatusMessage(null);
                            }}
                            placeholder="e.g. 50000"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Weekly Installment (Hafta)</Text>
                        <TextInput
                            style={styles.input}
                            value={installment}
                            onChangeText={(t) => {
                                setInstallment(t);
                                setStatusMessage(null);
                            }}
                            placeholder="e.g. 2000"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Interest Rate (%)</Text>
                        <TextInput
                            style={styles.input}
                            value={interestRate}
                            onChangeText={(t) => {
                                setInterestRate(t);
                                setStatusMessage(null);
                            }}
                            placeholder="e.g. 2"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.infoNote}>
                        <Ionicons
                            name="information-circle-outline"
                            size={16}
                            color={Colors.textMuted}
                        />
                        <Text style={styles.infoText}>
                            First payment due date will be set to 7 days from today.
                        </Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color={Colors.white}
                            />
                            <Text style={styles.saveButtonText}>
                                Add Borrower & Loan
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxxl,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.lg,
    },
    statusText: {
        flex: 1,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    section: {
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
        color: Colors.primaryLight,
        marginBottom: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
        marginLeft: 4,
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
    infoNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.xs,
    },
    infoText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
        marginTop: Spacing.sm,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
});
