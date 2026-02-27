import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'user_auth_token';

/**
 * Saves the authentication token to AsyncStorage.
 * @param {string} token - The token to be saved.
 */
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

/**
 * Retrieves the authentication token from AsyncStorage.
 * @returns {Promise<string|null>} The saved token or null if not found.
 */
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Removes the authentication token from AsyncStorage.
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};
