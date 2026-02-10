import { Colors } from '@/constants/theme';
import { Stack } from 'expo-router';

export default function AdminLayout() {
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
                    title: 'VickyFinance',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="loan/[id]"
                options={{
                    title: 'Loan Details',
                    headerShown: true,
                }}
            />
        </Stack>
    );
}
