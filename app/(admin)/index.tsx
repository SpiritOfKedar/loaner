import BorrowerCard from '@/components/BorrowerCard';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { applyPenaltyToLoan, useAllLoans } from '@/hooks/useLoans';
import { formatCurrency } from '@/lib/penalty';
import { LoanWithUser } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdminDashboard() {
    const { logout, appUser } = useAuth();
    const { loans, loading, error } = useAllLoans();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLoan, setSelectedLoan] = useState<LoanWithUser | null>(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const penaltiesApplied = useRef(false);

    // Apply penalties only once on first data load (not on every snapshot update)
    React.useEffect(() => {
        if (loans.length > 0 && !penaltiesApplied.current) {
            penaltiesApplied.current = true;
            loans.forEach(async (loan) => {
                try {
                    await applyPenaltyToLoan(loan);
                } catch (err) {
                    console.error('Error applying penalty:', err);
                }
            });
        }
    }, [loans]);

    const filteredLoans = loans.filter(
        (loan) =>
            loan.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loan.user.mobile_number.includes(searchQuery)
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const handleRecordPayment = (loanWithUser: LoanWithUser) => {
        setSelectedLoan(loanWithUser);
        setPaymentModalVisible(true);
    };

    const handleViewDetails = (loanWithUser: LoanWithUser) => {
        router.push(`/(admin)/loan/${loanWithUser.id}`);
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    // Summary stats
    const totalOutstanding = loans.reduce((sum, l) => sum + l.current_due_amount, 0);
    const totalBorrowers = loans.length;
    const overdueCount = loans.filter(
        (l) => l.next_due_date.toDate() < new Date()
    ).length;

    return (
        <View style={styles.container}>
            {/* Header with actions */}
            <View style={styles.headerBar}>
                <View>
                    <Text style={styles.greeting}>Hi, {appUser?.name || 'Admin'} 👋</Text>
                    <Text style={styles.headerSubtext}>Manage your loans</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
                </TouchableOpacity>
            </View>

            {/* Stats Banner */}
            <View style={styles.statsBanner}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalBorrowers}</Text>
                    <Text style={styles.statLabel}>Borrowers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.warning }]}>
                        {formatCurrency(totalOutstanding)}
                    </Text>
                    <Text style={styles.statLabel}>Outstanding</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.danger }]}>
                        {overdueCount}
                    </Text>
                    <Text style={styles.statLabel}>Overdue</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={Colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by name or mobile..."
                    placeholderTextColor={Colors.textMuted}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Loans List */}
            {error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="cloud-offline-outline" size={48} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredLoans}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BorrowerCard
                            loanWithUser={item}
                            onRecordPayment={handleRecordPayment}
                            onViewDetails={handleViewDetails}
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
                                <Text style={styles.emptyTitle}>No Borrowers Found</Text>
                                <Text style={styles.emptySubtext}>
                                    {searchQuery
                                        ? 'Try a different search term'
                                        : 'Add borrowers in Firestore to see them here'}
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Record Payment Modal */}
            <RecordPaymentModal
                visible={paymentModalVisible}
                loanWithUser={selectedLoan}
                onClose={() => {
                    setPaymentModalVisible(false);
                    setSelectedLoan(null);
                }}
                onSuccess={() => { }}
            />

            {/* Floating Action Button for Adding Borrower */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(admin)/add-borrower')}
            >
                <Ionicons name="add" size={30} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    greeting: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.text,
    },
    headerSubtext: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginTop: 2,
    },
    logoutButton: {
        padding: Spacing.sm,
        backgroundColor: Colors.dangerBg,
        borderRadius: BorderRadius.md,
    },
    statsBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder + '30',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
    },
    statLabel: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.surfaceBorder,
        marginVertical: Spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder + '30',
    },
    searchInput: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.text,
        paddingVertical: Spacing.md,
    },
    listContent: {
        paddingBottom: Spacing.xxxl * 2,
        paddingTop: Spacing.sm,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    errorText: {
        fontSize: FontSize.md,
        color: Colors.danger,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Spacing.xxxl * 3,
        gap: Spacing.sm,
    },
    emptyTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    emptySubtext: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: Spacing.xl,
        bottom: Spacing.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
});
