import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search, Plus, LogOut } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { NewExpenseForm } from '../components/NewExpenseForm';
import { expenseApi } from '../lib/expense';
import { authApi } from '../lib/auth';

export default function ExpenseLogging() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [groupBy, setGroupBy] = useState('none');
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch expenses from backend
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await expenseApi.getAllExpenses();
      
      if (response.success && response.data) {
        const formattedExpenses = response.data.map((expense, index) => ({
          id: `EXP${String(index + 1).padStart(3, '0')}`,
          vehicleId: expense.vehicleId,
          vehicleName: expense.vehicle?.licensePlate ? `${expense.vehicle.licensePlate} - ${expense.vehicle.model}` : 'Unknown Vehicle',
          driver: 'N/A', // Would need trip data to get driver
          fuelCost: expense.fuelCost || 0,
          miscExpense: expense.maintenanceCost || 0,
          totalCost: expense.totalExpense || 0,
          date: new Date().toISOString().split('T')[0],
          status: 'Completed',
          ...expense
        }));
        setExpenses(formattedExpenses);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '🚗', label: 'Vehicle Registry', href: '/vehicle-registry' },
    { icon: '📍', label: 'Trip Dispatcher', href: '/trip-dispatcher' },
    { icon: '🔧', label: 'Maintenance', href: '/maintenance' },
    { icon: '💰', label: 'Expense Logging', href: '/expense-logging' },
    { icon: '📈', label: 'Performance', href: '/driver-performance' },
    { icon: '📊', label: 'Analytics', href: '/analytics' },
  ];

  const getStatusColor = (status) => {
    return status === 'Completed'
      ? 'bg-green-500/20 text-green-400'
      : 'bg-yellow-500/20 text-yellow-400';
  };

  // Filter expenses
  let filteredExpenses = expenses;

  if (searchQuery) {
    filteredExpenses = filteredExpenses.filter(
      (expense) =>
        expense.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.driver.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filterStatus !== 'all') {
    filteredExpenses = filteredExpenses.filter((expense) => expense.status === filterStatus);
  }

  // Sort expenses
  if (sortBy === 'date') {
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'cost') {
    filteredExpenses.sort((a, b) => b.totalCost - a.totalCost);
  } else if (sortBy === 'id') {
    filteredExpenses.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Group expenses
  const groupedExpenses = {};
  if (groupBy === 'status') {
    filteredExpenses.forEach((expense) => {
      if (!groupedExpenses[expense.status]) {
        groupedExpenses[expense.status] = [];
      }
      groupedExpenses[expense.status].push(expense);
    });
  } else if (groupBy === 'driver') {
    filteredExpenses.forEach((expense) => {
      if (!groupedExpenses[expense.driver]) {
        groupedExpenses[expense.driver] = [];
      }
      groupedExpenses[expense.driver].push(expense);
    });
  } else {
    groupedExpenses['All Expenses'] = filteredExpenses;
  }

  const handleExpenseSubmit = (formData) => {
    console.log('New expense:', formData);
    // API call would go here
    fetchExpenses(); // Refresh the list
  };

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-center border-b border-slate-700">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center bg-slate-950">
            <span className="text-amber-500 font-bold text-lg">FF</span>
          </div>
          {sidebarOpen && <span className="ml-3 font-bold text-amber-500">FleetFlow</span>}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.label === 'Expense Logging'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-amber-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-500">Fleet Flow</h1>
              <p className="text-slate-400 text-sm mt-1">Expense & Fuel Logging</p>
            </div>
            <Button
              onClick={() => setShowNewExpenseForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              Add an Expense
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-3 m-4 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading expenses...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Controls Bar */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 sticky top-0 z-40">
            <div className="flex gap-3 items-center flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>

            {/* Group By */}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm font-medium hover:border-amber-500 transition-colors"
            >
              <option value="none">Group by</option>
              <option value="status">Status</option>
              <option value="driver">Driver</option>
            </select>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm font-medium hover:border-amber-500 transition-colors"
            >
              <option value="all">Filter</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm font-medium hover:border-amber-500 transition-colors"
            >
              <option value="date">Sort by Date</option>
              <option value="cost">Sort by Cost</option>
              <option value="id">Sort by ID</option>
            </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-800 border-b border-slate-700 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Vehicle</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Driver</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Fuel Expense</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Misc Expense</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Total Cost</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {Object.entries(groupedExpenses).map(([group, expenses]) => (
                  expenses.map((expense, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                      {idx === 0 && groupBy !== 'none' && (
                        <td colSpan="7" className="px-6 py-2 bg-slate-700/20">
                          <span className="text-amber-400 font-semibold text-xs">{group}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-medium text-slate-100">{expense.vehicleName}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{expense.driver}</td>
                      <td className="px-6 py-4 text-sm text-amber-400">₹{expense.fuelCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-amber-400">₹{expense.miscExpense.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-amber-400">₹{expense.totalCost.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-amber-400 hover:text-amber-300 font-medium">Edit</button>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No expenses found</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* New Expense Form Modal */}
      <NewExpenseForm
        isOpen={showNewExpenseForm}
        onClose={() => setShowNewExpenseForm(false)}
        vehicles={[]}
        drivers={[]}
        onSubmit={handleExpenseSubmit}
      />
    </div>
  );
}
