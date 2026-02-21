import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_TYPES } from "@/lib/constants";

export default function NewVehicleForm({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    licensePlate: "",
    model: "",
    type: "",
    maxLoad: "", // in kg
    acquisitionCost: "", 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSelectChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields validation
    if (
      !form.licensePlate ||
      !form.model ||
      !form.type ||
      !form.maxLoad
    ) {
      setError("License plate, model, type, and max load are required.");
      return;
    }

    // Validate maxLoad is a positive number
    if (parseFloat(form.maxLoad) <= 0) {
      setError("Max load must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
      setForm({
        licensePlate: "",
        model: "",
        type: "",
        maxLoad: "",
        acquisitionCost: "",
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create vehicle.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-amber-500">New Vehicle</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* License Plate */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              License Plate
            </Label>
            <Input
              name="licensePlate"
              value={form.licensePlate}
              onChange={handleChange}
              placeholder="e.g. MH 00"
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Model
            </Label>
            <Input
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="e.g. 2017 Mini"
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Type
            </Label>
            <Select value={form.type} onValueChange={(val) => handleSelectChange("type", val)}>
              <SelectTrigger className="bg-[#0F172A] border-slate-700 text-slate-100 focus:ring-amber-500 focus:border-amber-500">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-slate-700 text-slate-100">
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem
                    key={t.value}
                    value={t.value}
                    className="focus:bg-amber-500/10 focus:text-amber-400"
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Load */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Max Load (kg)
            </Label>
            <Input
              name="maxLoad"
              type="number"
              value={form.maxLoad}
              onChange={handleChange}
              placeholder="e.g. 5000"
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Acquisition Cost (Optional) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Acquisition Cost (Optional)
            </Label>
            <Input
              name="acquisitionCost"
              type="number"
              value={form.acquisitionCost}
              onChange={handleChange}
              placeholder="e.g. 50000"
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
