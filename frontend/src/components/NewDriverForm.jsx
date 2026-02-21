import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export const NewDriverForm = ({ isOpen, onClose, onSubmit, editingDriver = null, externalError = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    expiryDate: '',
    status: 'On Duty',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingDriver) {
      setFormData({
        name: editingDriver.name || '',
        licenseNumber: editingDriver.licenseNumber || '',
        expiryDate: editingDriver.expiryDate || '',
        status: editingDriver.status || 'On Duty',
      });
    } else {
      setFormData({
        name: '',
        licenseNumber: '',
        expiryDate: '',
        status: 'On Duty',
      });
    }
    setError('');
  }, [editingDriver, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.licenseNumber || !formData.expiryDate) {
      setError('Please fill in all required fields (Name, License#, Expiry)');
      return;
    }

    onSubmit(formData);
    setFormData({
      name: '',
      licenseNumber: '',
      expiryDate: '',
      status: 'On Duty',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-amber-400">
            {editingDriver ? 'Edit Driver' : 'Add new Driver'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {(error || externalError) && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-300 text-sm">
            {error || externalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-slate-300 text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Driver name"
              className="mt-1 bg-slate-700 border-slate-600 text-slate-100"
              required
            />
          </div>

          {/* License Number */}
          <div>
            <Label htmlFor="licenseNumber" className="text-slate-300 text-sm font-medium">
              License# <span className="text-red-500">*</span>
            </Label>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              type="text"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="License number"
              className="mt-1 bg-slate-700 border-slate-600 text-slate-100"
              required
            />
          </div>

          {/* Expiry Date */}
          <div>
            <Label htmlFor="expiryDate" className="text-slate-300 text-sm font-medium">
              License Expiry <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expiryDate"
              name="expiryDate"
              type="text"
              value={formData.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY (e.g., 01/26 for Jan 2026)"
              className="mt-1 bg-slate-700 border-slate-600 text-slate-100"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Format: MM/YY (must be a future date)</p>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-slate-300 text-sm font-medium">
              Status
            </Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
            >
              <option value="On Duty">On Duty</option>
              <option value="Taking a Break">Taking a Break</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-medium"
            >
              {editingDriver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};