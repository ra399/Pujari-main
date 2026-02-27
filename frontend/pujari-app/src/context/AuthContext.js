import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { auth, onAuthStateChanged, signOut } from '../lib/firebase';
import { getToken, saveToken, removeToken } from '../storage/tokenStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Backend user profile
  const [token, setToken] = useState(null); // Backend JWT Token
  const [role, setRole] = useState(null); // User role from backend
  const [currentMode, setCurrentMode] = useState('USER'); // 'USER' or 'PROVIDER'
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token;

  useEffect(() => {
    if (user && user.role) {
      setRole(user.role);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Check for stored token FIRST (before Firebase listener)
    const initializeAuth = async () => {
      console.log('🔍 Checking for stored token...');
      const storedToken = await getToken();
      
      if (storedToken && isMounted) {
        console.log('✅ Found stored token, validating with backend...');
        
        try {
          let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
          
          if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
            apiUrl = apiUrl.replace('localhost', '10.0.2.2');
          }

          const response = await fetch(`${apiUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log('✅ Token validation response:', responseData);
            
            // Response structure: { success: true, message: '...', data: { user: {...} } }
            const userData = responseData.data?.user || responseData.user;
            
            if (userData) {
              console.log('✅ Token is valid, user authenticated:', userData.role);
              
              if (isMounted) {
                setToken(storedToken);
                setUser(userData);
                setRole(userData.role);
                // Set default mode based on role
                if (userData.role === 'PROVIDER') {
                  setCurrentMode('PROVIDER');
                }
                setIsLoading(false);
              }
              // Do NOT return here. We must still setup the Firebase listener to handle
              // future auth changes (e.g. logging out and logging in as a different user).
            } else {
              console.log('⚠️ No user data in response, removing token...');
              await removeToken();
            }
          } else {
            console.log('⚠️ Stored token is invalid, removing...');
            await removeToken();
          }
        } catch (error) {
          console.error('❌ Error validating stored token:', error);
          await removeToken();
        }
      }
      
      // 2. Setup Firebase listener (Always!)
      console.log('📢 Setting up Firebase auth listener...');
      setupFirebaseListener();
    };

    const setupFirebaseListener = () => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        
        console.log('👤 Firebase auth state changed. User:', firebaseUser ? firebaseUser.uid : 'null');
        
        if (firebaseUser) {
          try {
            // Get ID Token from Firebase
            console.log('🔑 Fetching Firebase ID Token...');
            const firebaseIdToken = await firebaseUser.getIdToken();
            
            // Sync with Backend
            let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
            
            if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
              apiUrl = apiUrl.replace('localhost', '10.0.2.2');
            }

            const syncUrl = `${apiUrl}/api/auth/firebase-login`;
            console.log('🔄 Syncing with backend:', syncUrl);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
              console.log('📡 Sending POST request to backend...');
              const response = await fetch(syncUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  idToken: firebaseIdToken,
                  uid: firebaseUser.uid,
                  phoneNumber: firebaseUser.phoneNumber,
                  email: firebaseUser.email,
                }),
                signal: controller.signal
              });

              clearTimeout(timeoutId);
              console.log('📥 Backend response status:', response.status);

              if (response.ok) {
                const backendData = await response.json();
                const profile = backendData.data.user;
                const backendJwt = backendData.data.token;
                
                console.log('✅ Backend sync successful:', profile?.role);
                
                if (isMounted) {
                  setToken(backendJwt);
                  setUser(profile);
                  setRole(profile?.role);
                  if (profile?.role === 'PROVIDER') {
                    setCurrentMode('PROVIDER');
                  }
                  await saveToken(backendJwt);
                }
              } else {
                const errorText = await response.text();
                console.error('❌ Backend validation failed:', response.status, errorText);
                await logout();
              }
            } catch (fetchError) {
              clearTimeout(timeoutId);
              if (fetchError.name === 'AbortError') {
                console.error('❌ Backend sync timed out');
              } else {
                console.error('❌ Network Error (Backend unreachable):', fetchError.message);
              }
            }
          } catch (error) {
            console.error('🔑 Auth synchronization error:', error);
            await logout();
          }
        } else {
          // Firebase says logged out (or not initialized yet).
          // BUT, we might have a valid stored token (JWT Only Session).
          // We only clear state if the stored token is also gone (explicit logout).
          const storedToken = await getToken();
          if (!storedToken) {
              console.log('👋 User is logged out (no stored token)');
              if (isMounted) {
                setToken(null);
                setUser(null);
                setRole(null);
                // removeToken is redundant here as getToken() was null, but safe to call
                await removeToken(); 
              }
          } else {
              console.log('ℹ️ Firebase is not signed in, but stored token exists. Keeping session active.');
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      });

      return unsubscribe;
    };

    // Start initialization
    let unsubscribe;
    initializeAuth().then((unsub) => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      await removeToken();
      setToken(null);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        role,
        setRole,
        currentMode,
        setCurrentMode,
        isLoading,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
