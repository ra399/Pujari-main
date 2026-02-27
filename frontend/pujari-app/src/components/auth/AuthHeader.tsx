import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface AuthHeaderProps {
    title: string;
    subtitle: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.secondary, colors.accent]}
                style={styles.logoContainer}
            >
                <Ionicons name="sparkles" size={32} color="white" />
            </LinearGradient>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        marginBottom: 40,
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: typography.sizes.h1,
        fontWeight: typography.weights.bold,
        color: colors.primary,
        marginBottom: 8,
        lineHeight: typography.lineHeights.h1,
    },
    subtitle: {
        fontSize: typography.sizes.body,
        fontWeight: typography.weights.regular,
        color: colors.text.secondary,
        lineHeight: typography.lineHeights.body,
    },
});

export default AuthHeader;
