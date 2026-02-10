import TransactionList from '@/components/TransactionList';
import { Colors } from '@/constants/theme';
import { useTransactions } from '@/hooks/useLoans';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function PaymentHistoryScreen() {
    const { loanId } = useLocalSearchParams<{ loanId: string }>();
    const { transactions, loading } = useTransactions(loanId || '');

    return (
        <View style={styles.container}>
            <TransactionList transactions={transactions} loading={loading} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
});
