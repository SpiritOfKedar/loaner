import ConfirmModal from '@/components/ConfirmModal';
import EditLoanModal from '@/components/EditLoanModal';
import LoanDetailView from '@/components/LoanDetailView';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import SendReminderModal from '@/components/SendReminderModal';
import TransactionList from '@/components/TransactionList';
import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import {
    deleteBorrower,
    deleteLoan,
    toggleLoanStatus,
    useTransactions,
} from '@/hooks/useLoans';
import { db } from '@/lib/firebase';
import { AppUser, Loan, LoanWithUser } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type ModalType =
    | 'none'
    | 'payment'
    | 'reminder'
    | 'edit'
    | 'deleteLoan'
    | 'deleteBorrower'
    | 'toggleStatus';

export default function LoanDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { transactions, loading: txLoading } = useTransactions(id || '');
    const [loan, setLoan] = useState<Loan | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

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

    useEffect(() => {
        fetchLoan();
    }, [id]);

    // ---- Admin Actions ----

    const handleDeleteLoan = async () => {
        if (!loan) return;
        setActionLoading(true);
        try {
            await deleteLoan(loan.id);
            setActiveModal('none');
            router.back();
        } catch (err: any) {
            setStatusMessage({ type: 'error', text: err.message || 'Failed to delete loan.' });
            setActiveModal('none');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBorrower = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            await deleteBorrower(user.id);
            setActiveModal('none');
            router.back();
        } catch (err: any) {
            setStatusMessage({ type: 'error', text: err.message || 'Failed to delete borrower.' });
            setActiveModal('none');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!loan) return;
        setActionLoading(true);
        try {
            const newStatus = await toggleLoanStatus(loan);
            setLoan({ ...loan, status: newStatus });
            setStatusMessage({
                type: 'success',
                text: `Loan marked as ${newStatus}.`,
            });
            setActiveModal('none');
        } catch (err: any) {
            setStatusMessage({ type: 'error', text: err.message || 'Failed to update status.' });
            setActiveModal('none');
        } finally {
            setActionLoading(false);
        }
    };

    // ---- Rendering ----

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

    const isActive = loan.status === 'active';

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

                {/* Admin Menu Toggle */}
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setAdminMenuOpen(!adminMenuOpen)}
                >
                    <Ionicons
                        name={adminMenuOpen ? 'close' : 'ellipsis-vertical'}
                        size={22}
                        color={Colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            {/* Admin Actions Menu (dropdown) */}
            {adminMenuOpen && (
                <View style={styles.adminMenu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setAdminMenuOpen(false);
                            setActiveModal('edit');
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color={Colors.accent} />
                        <Text style={[styles.menuItemText, { color: Colors.accent }]}>
                            Edit Details
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setAdminMenuOpen(false);
                            setActiveModal('toggleStatus');
                        }}
                    >
                        <Ionicons
                            name={isActive ? 'checkmark-done-outline' : 'play-outline'}
                            size={18}
                            color={isActive ? Colors.success : Colors.warning}
                        />
                        <Text
                            style={[
                                styles.menuItemText,
                                { color: isActive ? Colors.success : Colors.warning },
                            ]}
                        >
                            {isActive ? 'Close Loan' : 'Reopen Loan'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setAdminMenuOpen(false);
                            setActiveModal('deleteLoan');
                        }}
                    >
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        <Text style={[styles.menuItemText, { color: Colors.danger }]}>
                            Delete This Loan
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setAdminMenuOpen(false);
                            setActiveModal('deleteBorrower');
                        }}
                    >
                        <Ionicons name="person-remove-outline" size={18} color={Colors.danger} />
                        <Text style={[styles.menuItemText, { color: Colors.danger }]}>
                            Delete Borrower & All Loans
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

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
                    <TouchableOpacity onPress={() => setStatusMessage(null)}>
                        <Ionicons name="close" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Loan Status Badge */}
            {!isActive && (
                <View style={styles.closedBadge}>
                    <Ionicons name="checkmark-done" size={16} color={Colors.success} />
                    <Text style={styles.closedBadgeText}>
                        LOAN {loan.status.toUpperCase()}
                    </Text>
                </View>
            )}

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
                    style={[styles.actionButton, !isActive && styles.disabledAction]}
                    onPress={() => setActiveModal('payment')}
                    disabled={!isActive}
                >
                    <Ionicons name="cash-outline" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Record Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.remindAction}
                    onPress={() => setActiveModal('reminder')}
                >
                    <Ionicons name="notifications-outline" size={20} color={Colors.warning} />
                </TouchableOpacity>
            </View>

            {/* ---- MODALS ---- */}

            {/* Payment Modal */}
            <RecordPaymentModal
                visible={activeModal === 'payment'}
                loanWithUser={loanWithUser}
                onClose={() => setActiveModal('none')}
                onSuccess={fetchLoan}
            />

            {/* Reminder Modal */}
            <SendReminderModal
                visible={activeModal === 'reminder'}
                user={user}
                loan={loan}
                onClose={() => setActiveModal('none')}
            />

            {/* Edit Modal */}
            <EditLoanModal
                visible={activeModal === 'edit'}
                loan={loan}
                user={user}
                onClose={() => setActiveModal('none')}
                onSuccess={fetchLoan}
            />

            {/* Delete Loan Confirm */}
            <ConfirmModal
                visible={activeModal === 'deleteLoan'}
                title="Delete Loan"
                message={`This will permanently delete this loan and all ${transactions.length} payment records. This cannot be undone.`}
                confirmLabel="Delete Loan"
                danger
                loading={actionLoading}
                icon="trash-outline"
                onConfirm={handleDeleteLoan}
                onCancel={() => setActiveModal('none')}
            />

            {/* Delete Borrower Confirm */}
            <ConfirmModal
                visible={activeModal === 'deleteBorrower'}
                title="Delete Borrower"
                message={`This will permanently delete ${user?.name || 'this borrower'} and ALL their loans + payment records. This cannot be undone.`}
                confirmLabel="Delete Everything"
                danger
                loading={actionLoading}
                icon="person-remove-outline"
                onConfirm={handleDeleteBorrower}
                onCancel={() => setActiveModal('none')}
            />

            {/* Toggle Status Confirm */}
            <ConfirmModal
                visible={activeModal === 'toggleStatus'}
                title={isActive ? 'Close Loan' : 'Reopen Loan'}
                message={
                    isActive
                        ? `Mark this loan as completed? It will be removed from the active dashboard.`
                        : `Reopen this loan? It will appear on the active dashboard again.`
                }
                confirmLabel={isActive ? 'Close Loan' : 'Reopen Loan'}
                loading={actionLoading}
                icon={isActive ? 'checkmark-done-outline' : 'play-outline'}
                onConfirm={handleToggleStatus}
                onCancel={() => setActiveModal('none')}
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
    menuButton: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    adminMenu: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder + '30',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
    },
    menuItemText: {
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    menuDivider: {
        height: 1,
        backgroundColor: Colors.surfaceBorder + '40',
        marginVertical: Spacing.xs,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    statusText: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    closedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.successBg,
        paddingVertical: Spacing.sm,
    },
    closedBadgeText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.success,
        letterSpacing: 0.5,
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
    disabledAction: {
        opacity: 0.5,
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
