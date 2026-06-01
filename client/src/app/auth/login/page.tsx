"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { switchToLearner, switchToStudio, switchToAdmin } from "@/store/slices/auth.slice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (_data: LoginFormValues) => {
    // Mock auth — always succeeds as learner by default
    await new Promise((r) => setTimeout(r, 800));
    dispatch(switchToLearner());
    router.push("/learn/dashboard");
  };

  const handleRoleLogin = (role: "learner" | "studio" | "admin") => {
    if (role === "learner") {
      dispatch(switchToLearner());
      router.push("/learn/dashboard");
    } else if (role === "studio") {
      dispatch(switchToStudio());
      router.push("/studio/dashboard");
    } else if (role === "admin") {
      dispatch(switchToAdmin());
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-headline-md font-bold text-foreground mb-2">Sign in to LearnioX</h1>
        <p className="text-body-sm text-muted-foreground">
          Continue learning from where you left off.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border border-border p-8">
        {/* Email */}
        <div>
          <label htmlFor="email" className="text-label-md uppercase tracking-widest text-foreground block mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full h-12 px-4 bg-surface border border-border hover:border-foreground focus:border-foreground outline-none transition-colors text-body-md text-foreground placeholder:text-muted-foreground"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-label-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="text-label-md uppercase tracking-widest text-foreground">
              Password
            </label>
            <Link href="#" className="text-label-sm text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full h-12 px-4 pr-12 bg-surface border border-border hover:border-foreground focus:border-foreground outline-none transition-colors text-body-md text-foreground placeholder:text-muted-foreground"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-label-sm text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-foreground text-background text-label-md uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Signing in..." : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 border-t border-border" />
        <span className="text-label-sm text-muted-foreground uppercase tracking-widest">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Demo links */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        <button
          onClick={() => handleRoleLogin("learner")}
          type="button"
          className="h-12 border border-border text-[10px] uppercase tracking-wider text-foreground hover:bg-surface-container transition-colors font-bold"
        >
          Learner Demo
        </button>
        <button
          onClick={() => handleRoleLogin("studio")}
          type="button"
          className="h-12 border border-border text-[10px] uppercase tracking-wider text-foreground hover:bg-surface-container transition-colors font-bold"
        >
          Studio Demo
        </button>
        <button
          onClick={() => handleRoleLogin("admin")}
          type="button"
          className="h-12 border border-border text-[10px] uppercase tracking-wider text-foreground hover:bg-surface-container transition-colors font-bold"
        >
          Admin Demo
        </button>
      </div>

      {/* Sign up link */}
      <p className="text-center text-body-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-foreground font-bold hover:underline">
          Sign up — it&apos;s free
        </Link>
      </p>
    </div>
  );
}
