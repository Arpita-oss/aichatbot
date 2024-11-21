// screens/AddExpenseScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { API_URL } from '../config';

const AddExpenseScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [expenses, setExpenses] = useState([
    { userName: '', description: '', amount: '' },
  ]);

  const addExpense = () => {
    setExpenses([...expenses, { userName: '', description: '', amount: '' }]);
  };

  const updateExpense = (index, field, value) => {
    const updatedExpenses = [...expenses];
    updatedExpenses[index][field] = value;
    setExpenses(updatedExpenses);
  };

  const calculateSplit = async () => {
    try {
      const formattedExpenses = expenses.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount),
      }));

      const response = await fetch(`${API_URL}/api/split/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName,
          expenses: formattedExpenses,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Split calculated successfully');
        // Handle the split result
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate split');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Group Name:</Text>
      <TextInput
        style={styles.input}
        value={groupName}
        onChangeText={setGroupName}
        placeholder="Enter group name"
      />

      {expenses.map((expense, index) => (
        <View key={index} style={styles.expenseContainer}>
          <Text style={styles.label}>Expense {index + 1}</Text>
          <TextInput
            style={styles.input}
            value={expense.userName}
            onChangeText={(value) => updateExpense(index, 'userName', value)}
            placeholder="Person name"
          />
          <TextInput
            style={styles.input}
            value={expense.description}
            onChangeText={(value) => updateExpense(index, 'description', value)}
            placeholder="Description"
          />
          <TextInput
            style={styles.input}
            value={expense.amount}
            onChangeText={(value) => updateExpense(index, 'amount', value)}
            placeholder="Amount"
            keyboardType="numeric"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={addExpense}>
        <Text style={styles.buttonText}>Add Another Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.calculateButton]} 
        onPress={calculateSplit}
      >
        <Text style={styles.buttonText}>Calculate Split</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  expenseContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  calculateButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});
// screens/AddExpenseScreen.js
// Add this to your existing AddExpenseScreen component

const validateForm = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return false;
    }
  
    for (const expense of expenses) {
      if (!expense.userName.trim() || !expense.description.trim() || !expense.amount) {
        Alert.alert('Error', 'Please fill in all expense details');
        return false;
      }
      if (isNaN(expense.amount) || parseFloat(expense.amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return false;
      }
    }
  
    return true;
  };
  
  // Update calculateSplit function
  const calculateSplit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // ... rest of your existing code
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  

export default AddExpenseScreen;
