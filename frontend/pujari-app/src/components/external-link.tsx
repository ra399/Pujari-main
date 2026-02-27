import { Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

export function ExternalLink({ href, ...rest }: React.ComponentProps<typeof Link>) {
    return (
        <Link
            target="_blank"
            {...rest}
            href={href as any}
            onPress={(e) => {
                if (Platform.OS !== 'web') {
                    // Prevent the default behavior of linking to the default browser on native.
                    e.preventDefault();
                    // Open the link in an in-app browser.
                    openBrowserAsync(href as string);
                }
            }}
        />
    );
}
