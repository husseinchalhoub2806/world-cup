import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getErrorMessage } from "../api/client";
import { useAuthStore } from "../store/authStore";
import StadiumBackground from "../components/StadiumBackground";

interface FormData { nickname: string; password: string; }

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      toast.success(`Welcome back, ${data.user.nickname}!`);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <>
      <StadiumBackground />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 inline-block" style={{ filter: "drop-shadow(0 0 20px rgba(249,115,22,0.7))" }}>⚽</div>
            <h1 className="text-3xl font-black" style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>Welcome Back</h1>
            <p className="text-sm mt-1.5 font-black" style={{ color: "#fbbf24", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>World Cup Predictions</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5">
              <div>
                <label className="label">Nickname</label>
                <input {...register("nickname", { required: "Nickname is required" })} className="input" placeholder="Your nickname" autoComplete="username" />
                {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input {...register("password", { required: "Password is required" })} type={showPassword ? "text" : "password"} className="input pr-10" placeholder="Your password" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
                {mutation.isPending ? "Logging in..." : "Log In"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
            Don't have an account?{" "}
            <Link to="/signup" className="font-black transition-colors" style={{ color: "#fbbf24" }}>Sign up</Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/" className="text-xs transition-opacity hover:opacity-80" style={{ color: "#fff", opacity: 0.7, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </>
  );
}
