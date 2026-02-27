import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import SplashScreen from '../screens/SplashScreen';
import ProfileCompletionScreen from '../screens/ProfileCompletionScreen';
import MainNavigator from './MainNavigator';
import ProviderTabNavigator from './ProviderTabNavigator';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import ProvidersListScreen from '../screens/ProvidersListScreen';
import ProviderDetailsScreen from '../screens/ProviderDetailsScreen';
import SelectServiceScreen from '../screens/SelectServiceScreen';
import SelectDateTimeScreen from '../screens/SelectDateTimeScreen';
import ConfirmBookingScreen from '../screens/ConfirmBookingScreen';
import BookingSuccessScreen from '../screens/BookingSuccessScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ApplyProviderScreen from '../screens/ApplyProviderScreen';
import ManageAvailabilityScreen from '../screens/ManageAvailabilityScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, currentMode } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            user?.isProfileComplete ? (
              <>
                <Stack.Screen 
                  name="Main" 
                  component={currentMode === 'PROVIDER' ? ProviderTabNavigator : MainNavigator} 
                />
                <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
                <Stack.Screen name="ProvidersList" component={ProvidersListScreen} />
                <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
                <Stack.Screen name="SelectService" component={SelectServiceScreen} />
                <Stack.Screen name="SelectDateTime" component={SelectDateTimeScreen} />
                <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} />
                <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} options={{ headerShown: false }} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="ApplyProvider" component={ApplyProviderScreen} />
                <Stack.Screen name="ManageAvailability" component={ManageAvailabilityScreen} />
              </>
            ) : (
              <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
            )
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="OTP" component={OtpScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default AppNavigator;
