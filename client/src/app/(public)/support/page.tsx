"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageSquare, Phone, MapPin, Check, Send } from "lucide-react";

const supportSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type SupportFormValues = z.infer<typeof supportSchema>;

export default function SupportPage() {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
  });

  const onSubmit = async (data: SupportFormValues) => {
    // Mock submit
    await new Promise((r) => setTimeout(r, 1000));
    setSuccess(true);
    reset();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16 space-y-12 font-sans">
      
      {/* Intro */}
      <div className="space-y-3 text-center">
        <h1 className="text-headline-md md:text-headline-lg font-bold uppercase tracking-tight text-foreground">
          Contact Platform Support
        </h1>
        <p className="text-body-md text-muted-foreground max-w-lg mx-auto">
          Have an issue with course access, payments, or your creator dashboard? Reach out to our 24/7 help desk.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Form */}
        <div className="flex-1 border border-border bg-card p-6 md:p-8 space-y-6">
          <h2 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground">
            Send a Message
          </h2>

          {success ? (
            <div className="p-6 border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900 text-center space-y-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-body-md font-bold text-emerald-800 dark:text-emerald-400 uppercase">Message Dispatched</h3>
              <p className="text-body-sm text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto leading-relaxed">
                Thank you. We have logged ticket reference #LX-{Math.floor(100000 + Math.random() * 900000)}. Our support desk will email you back within 2 hours.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs font-bold uppercase tracking-wider underline hover:text-foreground mt-2 block mx-auto text-muted-foreground"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Your Name</label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="John Doe"
                    className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Email Address</label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="you@example.com"
                    className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
                  />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Subject</label>
                <input
                  type="text"
                  {...register("subject")}
                  placeholder="e.g. Invoicing error / Video buffer issue"
                  className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
                />
                {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Detailed Message</label>
                <textarea
                  {...register("message")}
                  placeholder="Describe your issue with order numbers, course title, or lesson codes if applicable..."
                  className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground min-h-[120px] resize-none"
                />
                {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? "Dispatching..." : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Contact info */}
        <div className="w-full lg:w-80 space-y-6 flex-shrink-0">
          
          <div className="border border-border bg-card p-6 space-y-5">
            <h2 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground">
              Direct Channels
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <MessageSquare className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Email Helpdesk</p>
                  <p className="text-body-sm font-semibold text-foreground mt-0.5">support@learniox.com</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Phone className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Creator Helpline</p>
                  <p className="text-body-sm font-semibold text-foreground mt-0.5">+91 80 4912 0000</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">HQ Office</p>
                  <p className="text-body-sm text-muted-foreground mt-0.5 leading-relaxed">
                    Ovanthra Inc.,<br />
                    Outer Ring Road, Bellandur,<br />
                    Bengaluru, Karnataka 560103
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card p-5 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Live System Status
            </p>
            <p className="text-headline-sm font-bold text-foreground mt-2 uppercase tracking-tight">
              All Systems Operational
            </p>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mt-3 animate-pulse" />
          </div>

        </div>
      </div>
    </div>
  );
}
