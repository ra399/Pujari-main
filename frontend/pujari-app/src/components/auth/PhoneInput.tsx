import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PhoneInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    countryCode?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
    label,
    value,
    onChangeText,
    placeholder = "98765 43210",
    countryCode = "+91"
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
                <Feather name="smartphone" size={20} color="#999" style={styles.icon} />
                <Text style={styles.countryCode}>{countryCode}</Text>
                <View style={styles.separator} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#BBB"
                    keyboardType="phone-pad"
                    maxLength={10}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 60,
    },
    icon: {
        marginRight: 12,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginRight: 10,
    },
    separator: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
        marginRight: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
});

export default PhoneInput;
