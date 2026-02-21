import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authApi.login({ userName: form.username, password: form.password });
      if(user) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-amber-500 flex items-center justify-center bg-slate-950">
            <span className="text-amber-500 font-bold text-2xl">FF</span>
          </div>
        </div>

        <h1 className="text-slate-100 text-3xl font-bold tracking-tight text-center mb-2">
          Welcome back
        </h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          Sign in to FleetFlow
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="uppercase tracking-widest text-slate-400">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. john_doe"
              required
              className="bg-slate-950 border-slate-600 text-slate-100"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="uppercase tracking-widest text-slate-400">
                Password
              </Label>
              <a
                href="/forgot-password"
                className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
              >
                Forgot?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="bg-slate-950 border-slate-600 text-slate-100"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 mt-2"
          >
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>

        {/* Register Link */}
        <p className="text-slate-400 text-sm text-center mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}