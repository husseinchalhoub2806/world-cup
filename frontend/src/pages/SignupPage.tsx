import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getErrorMessage } from "../api/client";
import StadiumBackground from "../components/StadiumBackground";

interface FormData { nickname: string; real_name: string; password: string; }

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Account created! Wait for admin approval before logging in.");
      navigate("/login");
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
            <h1 className="text-3xl font-black" style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>Join the Game</h1>
            <p className="text-sm mt-1.5 font-black" style={{ color: "#fbbf24", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>Create your prediction account</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5">
              <div>
                <label className="label">Nickname</label>
                <input {...register("nickname", { required: "Required", minLength: { value: 2, message: "At least 2 chars" }, maxLength: { value: 50, message: "Max 50 chars" } })} className="input" placeholder="e.g. CristianoPro" autoComplete="username" />
                {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
                <p className="text-xs mt-1 text-gray-400">This is how you'll appear on the leaderboard</p>
              </div>
              <div>
                <label className="label">Full Name</label>
                <input {...register("real_name", { required: "Required", minLength: { value: 2, message: "At least 2 chars" } })} className="input" placeholder="Your real name" autoComplete="name" />
                {errors.real_name && <p className="text-red-500 text-xs mt-1">{errors.real_name.message}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input {...register("password", { required: "Required", minLength: { value: 4, message: "At least 4 chars" } })} type={showPassword ? "text" : "password"} className="input pr-10" placeholder="Choose a password" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
                {mutation.isPending ? "Creating account..." : "⚽ Create Account"}
              </button>
            </form>
          </div>

          <div className="card-sm mt-4 text-center" style={{ borderColor: "rgba(59,130,246,0.3)" }}>
            <p className="text-xs text-gray-500">ℹ️ Your account needs admin approval before you can start predicting.</p>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-black transition-colors" style={{ color: "#fbbf24" }}>Log in</Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/" className="text-xs transition-opacity hover:opacity-80" style={{ color: "#fff", opacity: 0.7, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </>
  );
}
