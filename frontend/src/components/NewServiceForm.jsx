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

export default function NewServiceForm({ isOpen, onClose, vehicles, onSubmit, loading = false }) {
  const [form, setForm] = useState({
    vehicleId: "",
    type: "",
    cost: "",
    liters: "",
    date: "",
  });
  const [error, setError] = useState("");

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

    if (!form.vehicleId || !form.type || !form.cost || !form.date) {
      setError("Vehicle, Type, Cost, and Date are required.");
      return;
    }

    if (form.type === "Fuel" && !form.liters) {
      setError("Liters are required for Fuel logs.");
      return;
    }

    if (parseFloat(form.cost) <= 0) {
      setError("Cost must be greater than 0.");
      return;
    }

    if (form.type === "Fuel" && parseFloat(form.liters) <= 0) {
      setError("Liters must be greater than 0.");
      return;
    }

    try {
      await onSubmit({
        vehicleId: form.vehicleId,
        type: form.type,
        cost: form.cost,
        liters: form.type === "Fuel" ? form.liters : undefined,
        date: form.date,
      });
      setForm({
        vehicleId: "",
        type: "",
        cost: "",
        liters: "",
        date: "",
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to create log.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-amber-500">New Log</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* Vehicle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Vehicle
            </Label>
            <Select value={form.vehicleId} onValueChange={(val) => handleSelectChange("vehicleId", val)}>
              <SelectTrigger className="bg-[#0F172A] border-slate-700 text-slate-100 focus:ring-amber-500 focus:border-amber-500">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-slate-700 text-slate-100">
                {vehicles.map((v) => (
                  <SelectItem
                    key={v.id}
                    value={v.id.toString()}
                    className="focus:bg-amber-500/10 focus:text-amber-400"
                  >
                    {v.licensePlate} - {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Log Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Log Type
            </Label>
            <Select value={form.type} onValueChange={(val) => handleSelectChange("type", val)}>
              <SelectTrigger className="bg-[#0F172A] border-slate-700 text-slate-100 focus:ring-amber-500 focus:border-amber-500">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-slate-700 text-slate-100">
                <SelectItem value="Fuel" className="focus:bg-amber-500/10 focus:text-amber-400">
                  Fuel
                </SelectItem>
                <SelectItem value="Maintenance" className="focus:bg-amber-500/10 focus:text-amber-400">
                  Maintenance
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Cost (₹)
            </Label>
            <Input
              name="cost"
              type="number"
              step="0.01"
              value={form.cost}
              onChange={handleChange}
              placeholder="e.g. 500, 1500.50"
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Liters (only for Fuel) */}
          {form.type === "Fuel" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-widest text-slate-400">
                Liters
              </Label>
              <Input
                name="liters"
                type="number"
                step="0.01"
                value={form.liters}
                onChange={handleChange}
                placeholder="e.g. 50, 25.5"
                className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
              />
            </div>
          )}

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Date
            </Label>
            <Input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="bg-[#0F172A] border-slate-700 text-slate-100 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
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
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
