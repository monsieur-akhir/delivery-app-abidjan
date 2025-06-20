import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Composant de test simple
const TestScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Test Screen</Text>
  </View>
);

function TestTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIcon: ({ focused, color, size }) => {
          return <Ionicons name="home-outline" size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Test" component={TestScreen} />
    </Tab.Navigator>
  );
}

export default function TestNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestMain" component={TestTabs} />
    </Stack.Navigator>
  );
} 