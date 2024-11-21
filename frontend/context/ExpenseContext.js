// context/ExpenseContext.js
import React, { createContext, useReducer, useContext } from 'react';

const ExpenseContext = createContext();

const initialState = {
  expenses: [],
  splits: [],
  loading: false,
  error: null
};

function expenseReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SPLITS':
      return { ...state, splits: action.payload };
    case 'ADD_SPLIT':
      return { ...state, splits: [action.payload, ...state.splits] };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  return (
    <ExpenseContext.Provider value={{ state, dispatch }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpense = () => useContext(ExpenseContext);
