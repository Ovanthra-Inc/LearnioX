"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { switchToLearner, switchToStudio } from "@/store/slices/auth.slice";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "learner",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: SignupFormValues) => {
    // Mock signup — always succeeds
    await new Promise((r) => setTimeout(r, 1000));
    if (data.role === "creator") {
      dispatch(switchToStudio());
      router.push("/studio/dashboard");
    } else {
      dispatch(switchToLearner());
      router.push("/learn/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md my-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-md font-bold text-foreground mb-2">Create your account</h1>
        <p className="text-body-sm text-muted-foreground">
          Join LearnioX today and start learning or teaching.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border border-border p-8 bg-card">
        
        {/* Name */}
        <div>
          <label htmlFor="name" className="text-label-md uppercase tracking-widest text-foreground block mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="w-full h-12 px-4 bg-surface border border-border hover:border-foreground focus:border-foreground outline-none transition-colors text-body-md text-foreground placeholder:text-muted-foreground"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="text-label-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

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
          <label htmlFor="password" className="text-label-md uppercase tracking-widest text-foreground block mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full h-12 px-4 pr-12 bg-surface border border-border hover:border-foreground focus:border-foreground outline-none transition-colors text-body-md text-foreground placeholder:text-muted-foreground"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
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

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="text-label-md uppercase tracking-widest text-foreground block mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              className="w-full h-12 px-4 pr-12 bg-surface border border-border hover:border-foreground focus:border-foreground outline-none transition-colors text-body-md text-foreground placeholder:text-muted-foreground"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-label-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label className="text-label-md uppercase tracking-widest text-foreground block mb-2">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("role", "learner")}
              className={`h-12 border text-label-md uppercase tracking-wider transition-colors ${
                selectedRole === "learner"
                  ? "border-foreground bg-foreground text-background font-bold"
                  : "border-border text-muted-foreground hover:bg-surface-container"
              }`}
            >
              Learn Courses
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "creator")}
              className={`h-12 border text-label-md uppercase tracking-wider transition-colors ${
                selectedRole === "creator"
                  ? "border-foreground bg-foreground text-background font-bold"
                  : "border-border text-muted-foreground hover:bg-surface-container"
              }`}
            >
              Teach / Create
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-foreground text-background text-label-md uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 pt-1"
        >
          {isSubmitting ? "Creating account..." : (
            <>
              Sign Up
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Redirect back to Login */}
      <p className="text-center text-body-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-foreground font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
