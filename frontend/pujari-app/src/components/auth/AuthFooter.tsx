import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const AuthFooter = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                By continuing, you agree to our{' '}
                <Text style={styles.link}>Terms of Service</Text> and{' '}
                <Text style={styles.link}>Privacy Policy</Text>
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    text: {
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: typography.lineHeights.caption,
        paddingHorizontal: 40,
        fontWeight: typography.weights.regular,
    },
    link: {
        color: colors.primary,
        fontWeight: typography.weights.bold,
    },
});

export default AuthFooter;
