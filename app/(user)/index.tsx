import LoanDetailView from '@/components/LoanDetailView';
import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useUserLoans } from '@/hooks/useLoans';
import { getDueStatus } from '@/lib/penalty';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserDashboard() {
    const { appUser, logout } = useAuth();
    const { loans, loading, error } = useUserLoans(appUser?.id || '');
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* User Header */}
            <View style={styles.headerCard}>
                <View style={styles.headerRow}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarInitial}>
                                {appUser?.name.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userName}>{appUser?.name || 'User'}</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Loading your loans...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cloud-offline-outline" size={48} color={Colors.danger} />
                        <Text style={styles.emptyText}>{error}</Text>
                    </View>
                ) : loans.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={64} color={Colors.success} />
                        <Text style={styles.emptyTitle}>No Active Loans</Text>
                        <Text style={styles.emptyText}>You don't have any active loans.</Text>
                    </View>
                ) : (
                    loans.map((loan) => {
                        const dueStatus = getDueStatus(loan);
                        return (
                            <View key={loan.id}>
                                {/* Status Banner */}
                                <View
                                    style={[
                                        styles.statusBanner,
                                        {
                                            backgroundColor:
                                                dueStatus === 'overdue'
                                                    ? Colors.dangerBg
                                                    : dueStatus === 'upcoming'
                                                        ? Colors.warningBg
                                                        : Colors.successBg,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            dueStatus === 'overdue'
                                                ? 'alert-circle'
                                                : dueStatus === 'upcoming'
                                                    ? 'time'
                                                    : 'checkmark-circle'
                                        }
                                        size={20}
                                        color={
                                            dueStatus === 'overdue'
                                                ? Colors.danger
                                                : dueStatus === 'upcoming'
                                                    ? Colors.warning
                                                    : Colors.success
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.statusBannerText,
                                            {
                                                color:
                                                    dueStatus === 'overdue'
                                                        ? Colors.danger
                                                        : dueStatus === 'upcoming'
                                                            ? Colors.warning
                                                            : Colors.success,
                                            },
                                        ]}
                                    >
                                        {dueStatus === 'overdue'
                                            ? 'Your payment is overdue!'
                                            : dueStatus === 'upcoming'
                                                ? 'Payment due soon'
                                                : 'All payments on track'}
                                    </Text>
                                </View>

                                {/* Loan Details */}
                                <LoanDetailView loan={loan} />

                                {/* View History Button */}
                                <TouchableOpacity
                                    style={styles.historyButton}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/(user)/history',
                                            params: { loanId: loan.id },
                                        })
                                    }
                                >
                                    <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
                                    <Text style={styles.historyButtonText}>View Payment History</Text>
                                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerCard: {
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder + '30',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatarContainer: {},
    avatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.white,
    },
    headerInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    userName: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    logoutBtn: {
        padding: Spacing.sm,
        backgroundColor: Colors.dangerBg,
        borderRadius: BorderRadius.md,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xxxl * 2,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    statusBannerText: {
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder + '30',
    },
    historyButtonText: {
        flex: 1,
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Spacing.xxxl * 4,
        gap: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    emptyText: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
        textAlign: 'center',
    },
});
