import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface InfoNoticeBoxProps {
    title: string;
    message: string;
}

const InfoNoticeBox: React.FC<InfoNoticeBoxProps> = ({ title, message }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name="lock" size={16} color={colors.notice.text} />
                <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.notice.bg,
        borderWidth: 1,
        borderColor: colors.notice.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: typography.sizes.subtext,
        fontWeight: typography.weights.bold,
        color: colors.notice.text,
        marginLeft: 8,
    },
    message: {
        fontSize: 13,
        color: colors.notice.subText,
        lineHeight: 18,
        fontWeight: typography.weights.regular,
    },
});

export default InfoNoticeBox;
