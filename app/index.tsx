import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
    const { firebaseUser, appUser, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!firebaseUser) {
        return <Redirect href="/login" />;
    }

    if (isAdmin) {
        return <Redirect href="/(admin)" />;
    }

    return <Redirect href="/(user)" />;
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});
