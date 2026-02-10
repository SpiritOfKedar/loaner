import LoanDetailView from '@/components/LoanDetailView';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import TransactionList from '@/components/TransactionList';
import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { useTransactions } from '@/hooks/useLoans';
import { db } from '@/lib/firebase';
import { buildReminderMessage, openSMS, openWhatsApp } from '@/lib/messaging';
import { AppUser, Loan, LoanWithUser } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoanDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { transactions, loading: txLoading } = useTransactions(id || '');
    const [loan, setLoan] = useState<Loan | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    useEffect(() => {
        const fetchLoan = async () => {
            if (!id) return;
            try {
                const loanDoc = await getDoc(doc(db, 'Loans', id));
                if (loanDoc.exists()) {
                    const loanData = { id: loanDoc.id, ...loanDoc.data() } as Loan;
                    setLoan(loanData);

                    const userDoc = await getDoc(doc(db, 'Users', loanData.user_id));
                    if (userDoc.exists()) {
                        setUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
                    }
                }
            } catch (error) {
                console.error('Error fetching loan:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLoan();
    }, [id]);

    const handleRemind = () => {
        if (!user || !loan) return;
        const message = buildReminderMessage(user, loan);
        Alert.alert('Send Reminder', `Remind ${user.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: '💬 SMS', onPress: () => openSMS(user.mobile_number, message) },
            {
                text: '📱 WhatsApp',
                onPress: () => openWhatsApp(user.mobile_number, message),
            },
        ]);
    };

    if (loading || !loan) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const loanWithUser: LoanWithUser = {
        ...loan,
        user: user || {
            id: loan.user_id,
            name: 'Unknown',
            mobile_number: '',
            photo_url: '',
            role: 'user',
        },
    };

    return (
        <View style={styles.container}>
            {/* User Header */}
            <View style={styles.userHeader}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarInitialLarge}>
                        {user?.name.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={styles.userHeaderInfo}>
                    <Text style={styles.userName}>{user?.name || 'Unknown User'}</Text>
                    <View style={styles.phoneRow}>
                        <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.phoneText}>{user?.mobile_number || 'N/A'}</Text>
                    </View>
                </View>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'details' && styles.activeTab]}
                    onPress={() => setActiveTab('details')}
                >
                    <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={activeTab === 'details' ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'details' && styles.activeTabText,
                        ]}
                    >
                        Details
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Ionicons
                        name="receipt-outline"
                        size={16}
                        color={activeTab === 'history' ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'history' && styles.activeTabText,
                        ]}
                    >
                        Payments ({transactions.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'details' ? (
                    <LoanDetailView loan={loan} />
                ) : (
                    <TransactionList transactions={transactions} loading={txLoading} />
                )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setPaymentModalVisible(true)}
                >
                    <Ionicons name="cash-outline" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Record Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.remindAction} onPress={handleRemind}>
                    <Ionicons name="notifications-outline" size={20} color={Colors.warning} />
                </TouchableOpacity>
            </View>

            {/* Payment Modal */}
            <RecordPaymentModal
                visible={paymentModalVisible}
                loanWithUser={loanWithUser}
                onClose={() => setPaymentModalVisible(false)}
                onSuccess={() => {
                    // Re-fetch loan data
                    const fetchLoan = async () => {
                        const loanDoc = await getDoc(doc(db, 'Loans', id!));
                        if (loanDoc.exists()) {
                            setLoan({ id: loanDoc.id, ...loanDoc.data() } as Loan);
                        }
                    };
                    fetchLoan();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        color: Colors.textMuted,
        fontSize: FontSize.md,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder + '30',
    },
    avatarLarge: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.primaryLight,
    },
    avatarInitialLarge: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.white,
    },
    userHeaderInfo: {
        flex: 1,
    },
    userName: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    phoneText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder + '30',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    activeTabText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    bottomActions: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder + '30',
        paddingBottom: Spacing.xxxl,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    actionButtonText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.white,
    },
    remindAction: {
        backgroundColor: Colors.warningBg,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
