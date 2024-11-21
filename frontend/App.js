// App.js
import { ExpenseProvider } from './context/ExpenseContext';
import { syncOfflineData } from './utils/offlineStorage';

export default function App() {
  useEffect(() => {
    syncOfflineData();
  }, []);

  return (
    <ExpenseProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
          <Stack.Screen name="SplitHistory" component={SplitHistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ExpenseProvider>
  );
}
