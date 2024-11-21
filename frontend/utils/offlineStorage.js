// utils/offlineStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const saveOfflineData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
};

export const syncOfflineData = async () => {
  try {
    const isConnected = await NetInfo.fetch();
    if (isConnected.isConnected) {
      const pendingTransactions = await AsyncStorage.getItem('pendingTransactions');
      if (pendingTransactions) {
        const transactions = JSON.parse(pendingTransactions);
        // Sync each transaction with the server
        for (const transaction of transactions) {
          await fetch(`${API_URL}/api/split/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
          });
        }
        await AsyncStorage.removeItem('pen')}
    }
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
};
