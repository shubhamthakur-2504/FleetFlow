import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getAllExpenses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const getExpenseById = async (expenseId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/expenses/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching expense ${expenseId}:`, error);
    throw error;
  }
};

export const createExpense = async (expenseData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/expenses`, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId, expenseData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/expenses/${expenseId}`, expenseData);
    return response.data;
  } catch (error) {
    console.error(`Error updating expense ${expenseId}:`, error);
    throw error;
  }
};

export const updateExpenseStatus = async (expenseId, status) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/expenses/${expenseId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating expense status:`, error);
    throw error;
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/expenses/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting expense ${expenseId}:`, error);
    throw error;
  }
};

export const getTripsExpenceHistory = async (tripId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/expenses/trip/${tripId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching expense history for trip ${tripId}:`, error);
    throw error;
  }
};
