"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, ArrowLeft, Ticket, CreditCard, Landmark, Check } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { formatCurrency } from "@/lib/utils";

// Zod validation schema for payment
const checkoutSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  upiId: z.string().optional().refine((val) => !val || val.includes("@"), {
    message: "Invalid UPI ID. Should contain '@'",
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CheckoutPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { courseId } = use(params);
  const router = useRouter();

  // Find course
  const course = MOCK_COURSES.find((c) => c.id === courseId) || MOCK_COURSES[0];

  // States
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in INR
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "Alex Johnson",
      email: "alex.johnson@example.com",
      phone: "9876543210",
      upiId: "alex@okaxis",
    },
  });

  // Calculate pricing
  const basePrice = course.price || 0;
  const tax = Math.round(basePrice * 0.18); // 18% GST
  const discount = appliedDiscount;
  const total = basePrice + tax - discount;

  // Apply promo code
  const handleApplyPromo = () => {
    setPromoError("");
    setPromoSuccess(false);
    if (promoCode.toUpperCase() === "LEARN10") {
      const disc = Math.round(basePrice * 0.10);
      setAppliedDiscount(disc);
      setPromoSuccess(true);
    } else if (promoCode.trim() === "") {
      setPromoError("Enter a promo code.");
    } else {
      setPromoError("Invalid promo code. Try 'LEARN10' for 10% off.");
      setAppliedDiscount(0);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    // Simulate transaction delay
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/payment/success?courseId=${course.id}&amount=${total}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Minimal Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href={`/course/${course.slug}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-bold uppercase tracking-widest text-foreground">
            Secure Checkout
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
          <ShieldCheck className="w-4 h-4 text-foreground" /> 256-bit Encryption
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form & Payment options */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-6">
          
          {/* User Details */}
          <div className="border border-border bg-card p-6 space-y-4">
            <h2 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground">
              1. Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Full Name</label>
                <input
                  type="text"
                  {...register("fullName")}
                  className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
                />
                {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Email Address</label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Phone Number</label>
              <input
                type="text"
                {...register("phone")}
                className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
              />
              {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="border border-border bg-card p-6 space-y-6">
            <h2 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground">
              2. Payment Method
            </h2>

            <div className="grid grid-cols-3 gap-0 border border-border">
              {[
                { id: "upi", label: "UPI/QR Code" },
                { id: "card", label: "Debit/Credit Card" },
                { id: "netbanking", label: "Net Banking" },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`py-3.5 text-label-sm uppercase tracking-widest font-bold border-r last:border-r-0 border-border transition-colors ${
                    paymentMethod === method.id
                      ? "bg-foreground text-background"
                      : "bg-surface text-muted-foreground hover:bg-surface-container"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {/* UPI Option Form */}
            {paymentMethod === "upi" && (
              <div className="space-y-4 pt-2">
                <div className="p-4 border border-border bg-surface flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="space-y-1 text-center md:text-left">
                    <p className="text-body-sm font-bold text-foreground">Scan QR Code Instantly</p>
                    <p className="text-xs text-muted-foreground">Open your favorite UPI app (GPay, PhonePe, Paytm) to scan.</p>
                  </div>
                  <div className="w-24 h-24 border border-border bg-white flex items-center justify-center font-bold text-[10px] text-zinc-400">
                    [MOCK QR CODE]
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Or Enter UPI ID</label>
                  <input
                    type="text"
                    {...register("upiId")}
                    placeholder="example@upi"
                    className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
                  />
                  {errors.upiId && <p className="text-xs text-rose-500 mt-1">{errors.upiId.message}</p>}
                </div>
              </div>
            )}

            {/* Card Option Form */}
            {paymentMethod === "card" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Card Number</label>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    disabled
                    className="w-full p-3 border border-border bg-surface text-muted-foreground font-sans cursor-not-allowed"
                  />
                  <p className="text-[10px] text-zinc-400">Card payment is disabled in mock preview. Please use UPI/QR.</p>
                </div>
              </div>
            )}

            {/* Netbanking Option */}
            {paymentMethod === "netbanking" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Choose Bank</label>
                  <select
                    disabled
                    className="w-full p-3 border border-border bg-surface text-muted-foreground font-sans cursor-not-allowed"
                  >
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>SBI Bank</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-foreground text-background text-label-md uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isSubmitting ? "Processing Payment..." : `Pay ${formatCurrency(total)}`}
          </button>
        </form>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[400px] space-y-6 flex-shrink-0">
          
          {/* Order Details card */}
          <div className="border border-border bg-card p-6 space-y-6">
            <h2 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground">
              Order Summary
            </h2>

            {/* Course card info */}
            <div className="flex gap-3">
              <div className="w-16 h-12 bg-surface-container border border-border flex-shrink-0 relative overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="text-body-sm font-bold text-foreground leading-snug line-clamp-2">
                  {course.title}
                </h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  {course.institutionName}
                </p>
              </div>
            </div>

            {/* Promo Code section */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold block">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g. LEARN10"
                  className="flex-1 p-2 border border-border bg-surface text-foreground font-sans uppercase focus:outline-none focus:border-foreground text-sm"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-2 border border-border bg-foreground text-background text-xs uppercase tracking-wider font-bold hover:opacity-90"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-xs text-rose-500 mt-1">{promoError}</p>}
              {promoSuccess && (
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Code LEARN10 applied! (10% Off base price)
                </p>
              )}
            </div>

            {/* Invoiced Prices */}
            <div className="space-y-3 pt-4 border-t border-border text-body-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(basePrice)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-medium text-foreground">{formatCurrency(tax)}</span>
              </div>

              <div className="flex justify-between text-body-md font-bold text-foreground border-t border-border pt-3">
                <span>Total Amount</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-border bg-surface-container flex items-start gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-foreground flex-shrink-0" />
            <p className="leading-relaxed">
              By completing your purchase, you agree to our Terms of Service and Privacy Policy. All mock payments represent a checkout flow simulation and do not involve real currency transfers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
