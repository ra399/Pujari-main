import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export function IconSymbol({
    name,
    size,
    color,
    style
}: {
    name: string;
    size: number;
    color: string;
    style?: any;
}) {
    // Map SF Symbols to Ionicons for cross-platform support
    const iconMap: Record<string, any> = {
        'house.fill': 'home',
        'paperplane.fill': 'send',
        'chevron.left.forwardslash.chevron.right': 'code-slash',
        'chevron.right': 'chevron-forward',
    };

    return (
        <Ionicons
            name={iconMap[name] || 'help-circle'}
            size={size}
            color={color}
            style={style}
        />
    );
}
