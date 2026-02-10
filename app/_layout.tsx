import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import "../global.css";

function RootNavigator() {
  const { firebaseUser, appUser, loading, isAdmin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!firebaseUser) {
      // Not signed in → go to login
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else if (appUser) {
      // Signed in → route based on role
      if (inAuthGroup) {
        if (isAdmin) {
          router.replace('/(admin)');
        } else {
          router.replace('/(user)');
        }
      }
    }
  }, [firebaseUser, appUser, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
