import { useState } from "react";
import { authApi } from "../../lib/auth";
import { useNavigate } from "react-router-dom";
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

// Password constraints
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$...)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const validatePassword = (password) =>
  PASSWORD_RULES.every((rule) => rule.test(password));

const ROLES = [
  { value: "FLEET_MANAGER", label: "Fleet Manager" },
  { value: "DISPATCHER", label: "Dispatcher" },
  { value: "SAFETY_OFFICER", label: "Safety Officer" },
  { value: "FINANCIAL_ANALYSTS", label: "Financial Analyst" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(form.password)) {
      setError("Password does not meet the required constraints.");
      return;
    }
    if (!form.role) {
      setError("Please select a role.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        userName: form.username,
        password: form.password,
        role: form.role,
      });
      const user = await authApi.login({ userName: form.username, password: form.password });
      if(user) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-2xl p-8 shadow-2xl">
        {/* Logo placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-amber-500 flex items-center justify-center bg-[#0F172A]">
            <span className="text-amber-500 font-bold text-xl">FF</span>
          </div>
        </div>

        <h1 className="text-slate-100 text-2xl font-bold tracking-tight text-center mb-1">
          Create account
        </h1>
        <p className="text-slate-500 text-sm text-center mb-8">
          Join FleetFlow — select your role to get started
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Email
            </Label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Username
            </Label>
            <Input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. john_doe"
              required
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Password
            </Label>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="••••••••"
              required
              className="bg-[#0F172A] border-slate-700 text-slate-100 placeholder-slate-600 focus-visible:ring-amber-500 focus-visible:border-amber-500"
            />

            {/* Constraint checklist — shows on focus or if user has typed */}
            {(passwordFocused || form.password.length > 0) && (
              <ul className="mt-2 flex flex-col gap-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-2 text-xs transition-colors ${
                        passed ? "text-green-400" : "text-slate-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          passed ? "bg-green-400" : "bg-slate-600"
                        }`}
                      />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-slate-400">
              Role
            </Label>
            <Select
              value={form.role}
              onValueChange={(val) => {
                setForm((prev) => ({ ...prev, role: val }));
                setError("");
              }}
            >
              <SelectTrigger className="bg-[#0F172A] border-slate-700 text-slate-100 focus:ring-amber-500 focus:border-amber-500 data-[placeholder]:text-slate-600">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-slate-700 text-slate-100">
                {ROLES.map((r) => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                    className="focus:bg-amber-500/10 focus:text-amber-400"
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold tracking-wide transition-colors"
          >
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="text-slate-500 text-xs text-center mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-amber-500 hover:text-amber-400 transition-colors">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}