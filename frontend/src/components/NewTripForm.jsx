import { useState } from "react";
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

export default function NewTripForm({ vehicles, drivers, onSubmit, loading = false }) {
  const [form, setForm] = useState({
    vehicleId: "",
    cargoWeight: "",
    driverId: "",
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

    if (!form.vehicleId || !form.cargoWeight || !form.driverId) {
      setError("All fields are required.");
      return;
    }

    // Find selected vehicle to check capacity
    const selectedVehicle = vehicles.find((v) => v.id === parseInt(form.vehicleId));
    if (selectedVehicle && parseInt(form.cargoWeight) > selectedVehicle.maxLoad) {
      setError(`Cargo weight exceeds vehicle capacity (${selectedVehicle.maxLoad} kg).`);
      return;
    }

    try {
      await onSubmit(form);
      setForm({
        vehicleId: "",
        cargoWeight: "",
        driverId: "",
      });
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create trip.");
    }
  };

  return (
    <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6">
      <h3 className="text-xl font-bold text-amber-500 mb-6 border-b border-slate-700 pb-4">
        Create New Trip
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Vehicle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Select Vehicle
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
                    {v.licensePlate} - {v.model} (Max: {v.maxLoad}kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cargo Weight */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Cargo Weight (kg)
            </Label>
            <Input
              name="cargoWeight"
              type="number"
              value={form.cargoWeight}
              onChange={handleChange}
              placeholder="e.g. 5000"
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Select Driver */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Select Driver
            </Label>
            <Select value={form.driverId} onValueChange={(val) => handleSelectChange("driverId", val)}>
              <SelectTrigger className="bg-[#0F172A] border-slate-700 text-slate-100 focus:ring-amber-500 focus:border-amber-500">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-slate-700 text-slate-100">
                {drivers.map((d) => (
                  <SelectItem
                    key={d.id}
                    value={d.id.toString()}
                    className="focus:bg-amber-500/10 focus:text-amber-400"
                  >
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Trip"}
          </Button>
        </div>
      </form>
    </div>
  );
}
