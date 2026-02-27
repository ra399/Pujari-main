import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface AuthInputProps extends TextInputProps {
    label: string;
    icon?: React.ComponentProps<typeof Feather>['name'];
    countryCode?: string;
    isPhone?: boolean;
}

const AuthInput: React.FC<AuthInputProps> = ({
    label,
    icon,
    countryCode,
    isPhone,
    style,
    multiline,
    ...otherProps
}) => {

    return (
        <View style={styles.container} >
            <Text style={styles.label}>{label}</Text>
            <View style={[
                styles.inputWrapper,
                multiline && { height: 'auto', minHeight: 120, alignItems: 'flex-start', paddingTop: 16 }
            ]}>
                {icon && <Feather name={icon} size={20} color={colors.text.muted} style={[styles.icon, multiline && { marginTop: 4 }]} />}

                {isPhone && countryCode && (
                    <View style={styles.phonePrefix}>
                        <Text style={styles.countryCode}>{countryCode}</Text>
                        <View style={styles.separator} />
                    </View>
                )}

                <TextInput
                    style={[styles.input, style, multiline && { height: '100%', textAlignVertical: 'top' }]}
                    placeholderTextColor={colors.text.muted}
                    multiline={multiline}
                    {...otherProps}
                />
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: typography.sizes.subtext,
        fontWeight: typography.weights.semibold,
        color: colors.primary,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 60,
    },
    icon: {
        marginRight: 12,
    },
    phonePrefix: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryCode: {
        fontSize: 16,
        fontWeight: typography.weights.bold,
        color: colors.primary,
        marginRight: 10,
    },
    separator: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
        marginRight: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: typography.weights.medium,
    },
});

export default AuthInput;
