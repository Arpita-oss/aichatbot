// screens/SplitHistoryScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const SplitHistoryScreen = () => {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSplits = async () => {
    try {
      // Try to get cached data first
      const cachedSplits = await AsyncStorage.getItem('splitHistory');
      if (cachedSplits) {
        setSplits(JSON.parse(cachedSplits));
      }

      // Fetch fresh data from API
      const response = await fetch(`${API_URL}/api/split/history`);
      const data = await response.json();
      
      setSplits(data);
      await AsyncStorage.setItem('splitHistory', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching splits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSplits();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.splitItem}>
      <Text style={styles.groupName}>{item.groupName}</Text>
      <Text>Total Amount: ₹{item.totalAmount}</Text>
      <Text>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />;
  }

  return (
    <FlatList
      data={splits}
      renderItem={renderItem}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSplits();
          }}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default SplitHistoryScreen;
