import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { buildReminderMessage, openSMS, openWhatsApp } from '@/lib/messaging';
import { AppUser, Loan } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SendReminderModalProps {
    visible: boolean;
    user: AppUser | null;
    loan: Loan | null;
    onClose: () => void;
}

export default function SendReminderModal({
    visible,
    user,
    loan,
    onClose,
}: SendReminderModalProps) {
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    if (!user || !loan) return null;

    const message = buildReminderMessage(user, loan);

    const handleSMS = async () => {
        try {
            await openSMS(user.mobile_number, message);
            setStatusMessage({ type: 'success', text: 'SMS app opened!' });
            setTimeout(() => {
                setStatusMessage(null);
                onClose();
            }, 1000);
        } catch (err: any) {
            setStatusMessage({
                type: 'error',
                text: 'Could not open SMS. Try WhatsApp instead.',
            });
        }
    };

    const handleWhatsApp = async () => {
        try {
            await openWhatsApp(user.mobile_number, message);
            setStatusMessage({ type: 'success', text: 'WhatsApp opened!' });
            setTimeout(() => {
                setStatusMessage(null);
                onClose();
            }, 1000);
        } catch (err: any) {
            setStatusMessage({
                type: 'error',
                text: 'Could not open WhatsApp. Try SMS instead.',
            });
        }
    };

    const handleCopyMessage = async () => {
        // Web-compatible copy using the clipboard API
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(message);
                setStatusMessage({ type: 'success', text: 'Message copied to clipboard!' });
                setTimeout(() => setStatusMessage(null), 2000);
            } catch {
                setStatusMessage({ type: 'error', text: 'Could not copy message.' });
            }
        } else {
            // For native, we'd use Clipboard from expo-clipboard,
            // but fallback to just showing the message
            setStatusMessage({
                type: 'error',
                text: 'Copy not supported. Use SMS or WhatsApp.',
            });
        }
    };

    const handleClose = () => {
        setStatusMessage(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <TouchableOpacity
                    style={styles.container}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Send Reminder</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* User info */}
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarInitial}>
                                {user.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName}>{user.name}</Text>
                            <Text style={styles.userPhone}>{user.mobile_number}</Text>
                        </View>
                    </View>

                    {/* Message preview */}
                    <View style={styles.messagePreview}>
                        <Text style={styles.messageLabel}>MESSAGE PREVIEW</Text>
                        <Text style={styles.messageText}>{message}</Text>
                    </View>

                    {/* Status */}
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
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={22} color={Colors.white} />
                            <Text style={styles.actionButtonText}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.smsButton} onPress={handleSMS}>
                            <Ionicons name="chatbubble-outline" size={20} color={Colors.white} />
                            <Text style={styles.actionButtonText}>SMS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Copy fallback for web */}
                    <TouchableOpacity style={styles.copyButton} onPress={handleCopyMessage}>
                        <Ionicons name="copy-outline" size={16} color={Colors.accent} />
                        <Text style={styles.copyButtonText}>Copy Message</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        paddingBottom: Spacing.xxxl + 16,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: Colors.surfaceBorder,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.text,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surfaceElevated + '80',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.lg,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 9999,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.white,
    },
    userName: {
        fontSize: FontSize.lg,
        fontWeight: '600',
        color: Colors.text,
    },
    userPhone: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    messagePreview: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    messageLabel: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
    },
    messageText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    statusText: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    whatsappButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: '#25D366',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    smsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    actionButtonText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.white,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.md,
    },
    copyButtonText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.accent,
    },
});
