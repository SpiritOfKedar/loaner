import { Colors } from '@/constants/theme';
import { Stack } from 'expo-router';

export default function UserLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.background,
                },
                headerTintColor: Colors.text,
                headerTitleStyle: {
                    fontWeight: '700',
                },
                contentStyle: {
                    backgroundColor: Colors.background,
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'My Loans',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="history"
                options={{
                    title: 'Payment History',
                    headerShown: true,
                }}
            />
        </Stack>
    );
}
