import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface OtpInputProps {
    code: string[];
    setCode: (code: string[]) => void;
    length?: number;
}

const OtpInput: React.FC<OtpInputProps> = ({ code, setCode, length = 6 }) => {
    const inputs = useRef<(TextInput | null)[]>([]);

    const handleChangeText = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto focus next input
        if (text !== '' && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {Array(length).fill(0).map((_, index) => (
                <View key={index} style={[
                    styles.inputContainer,
                    code[index] !== '' && styles.activeInputContainer
                ]}>
                    <TextInput
                        ref={(ref) => { inputs.current[index] = ref; }}
                        style={styles.input}
                        maxLength={1}
                        keyboardType="number-pad"
                        onChangeText={(text) => handleChangeText(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        value={code[index]}
                        selectionColor={colors.secondary}
                        caretHidden={true}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginVertical: 30,
    },
    inputContainer: {
        width: 44,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    activeInputContainer: {
        borderColor: colors.secondary,
        backgroundColor: '#FFFFFF',
    },
    input: {
        fontSize: 22,
        fontWeight: '700',
        color: '#001F3F',
        textAlign: 'center',
        width: '100%',
        height: '100%',
    },
});

export default OtpInput;
