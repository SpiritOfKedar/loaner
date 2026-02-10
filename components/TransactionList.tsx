import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/lib/penalty';
import { Transaction } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface TransactionListProps {
    transactions: Transaction[];
    loading: boolean;
}

export default function TransactionList({
    transactions,
    loading,
}: TransactionListProps) {
    if (loading) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>Loading transactions...</Text>
            </View>
        );
    }

    if (transactions.length === 0) {
        return (
            <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No payments recorded yet</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
                <View style={styles.row}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="arrow-down-circle" size={24} color={Colors.success} />
                    </View>
                    <View style={styles.txInfo}>
                        <Text style={styles.txAmount}>{formatCurrency(item.amount_paid)}</Text>
                        <Text style={styles.txDate}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={styles.txIndex}>
                        <Text style={styles.txIndexText}>#{transactions.length - index}</Text>
                    </View>
                </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        padding: Spacing.lg,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxxl * 2,
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    iconContainer: {
        marginRight: Spacing.md,
    },
    txInfo: {
        flex: 1,
    },
    txAmount: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.success,
    },
    txDate: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginTop: 2,
    },
    txIndex: {
        backgroundColor: Colors.surfaceElevated,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    txIndexText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    separator: {
        height: Spacing.sm,
    },
});
