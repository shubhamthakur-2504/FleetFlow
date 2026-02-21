import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export const NewExpenseForm = ({ isOpen, onClose, vehicles, drivers, onSubmit }) => {
  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleId: '',
    driver: '',
    fuelCost: '',
    miscExpense: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    
    // Prevent negative values for fuel cost and misc expense
    if ((name === 'fuelCost' || name === 'miscExpense') && value < 0) {
      alert('Values cannot be negative');
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset vehicleId when type changes
    if (name === 'vehicleType') {
      setFormData((prev) => ({ ...prev, vehicleId: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.vehicleType || !formData.vehicleId || !formData.driver) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate fuel cost and misc expense are not negative
    if (formData.fuelCost && parseFloat(formData.fuelCost) < 0) {
      setError('Fuel Cost cannot be negative');
      return;
    }

    if (formData.miscExpense && parseFloat(formData.miscExpense) < 0) {
      setError('Misc Expense cannot be negative');
      return;
    }

    onSubmit(formData);
    setFormData({
      vehicleType: '',
      vehicleId: '',
      driver: '',
      fuelCost: '',
      miscExpense: '',
    });
    onClose();
  };

  // Get unique vehicle types
  const vehicleTypes = [...new Set(vehicles?.map((v) => v.type) || [])];

  // Filter vehicles by selected type
  const filteredVehicles = formData.vehicleType
    ? vehicles?.filter((v) => v.type === formData.vehicleType) || []
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-[#1E293B] rounded-lg shadow-lg p-6 border border-[#334155]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">New Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Type */}
          <div>
            <Label htmlFor="vehicleType" className="text-gray-200">Vehicle Type</Label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#475569] rounded text-white"
            >
              <option value="">Select Vehicle Type</option>
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle ID */}
          <div>
            <Label htmlFor="vehicleId" className="text-gray-200">Vehicle ID</Label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              disabled={!formData.vehicleType}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#475569] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Vehicle</option>
              {filteredVehicles?.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate} - {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <Label htmlFor="driver" className="text-gray-200">Driver</Label>
            <select
              id="driver"
              name="driver"
              value={formData.driver}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#475569] rounded text-white"
            >
              <option value="">Select Driver</option>
              {drivers?.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Cost */}
          <div>
            <Label htmlFor="fuelCost" className="text-gray-200">Fuel Cost</Label>
            <Input
              type="number"
              id="fuelCost"
              name="fuelCost"
              value={formData.fuelCost}
              onChange={handleChange}
              min="0"
              placeholder="Enter fuel cost"
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#475569] rounded text-white"
            />
          </div>

          {/* Misc Expense */}
          <div>
            <Label htmlFor="miscExpense" className="text-gray-200">Misc Expense</Label>
            <Input
              type="number"
              id="miscExpense"
              name="miscExpense"
              value={formData.miscExpense}
              onChange={handleChange}
              min="0"
              placeholder="Enter misc expense"
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#475569] rounded text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black font-medium"
            >
              Create
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#334155] hover:bg-[#475569] text-white font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
