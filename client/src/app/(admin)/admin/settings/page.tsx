"use client";

import { useState } from "react";
import { Settings, Save, Shield, HardDrive, Check, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState({
    platformFeePercent: 5,
    defaultCurrency: "INR",
    maxUploadMb: 50,
    allowedExtensions: ".pdf, .mp4, .zip, .png, .jpg",
  });

  const [toggles, setToggles] = useState({
    maintenanceMode: false,
    requireEmailVerification: true,
    enable2faStaff: false,
    enableCaptchaSignup: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Global Platform Settings</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Configure marketplace commission structures, file storage constraints, and security standards.
        </p>
      </div>

      {toggles.maintenanceMode && (
        <div className="border border-red-600 p-4 bg-red-500/10 flex items-center gap-3 text-body-sm font-semibold text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          Maintenance mode is currently active. The public marketplace is hidden from new student traffic.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Marketplace Commission config */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Marketplace Commissions</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Revenue split values</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Platform Cut Fee (%)
              </label>
              <input
                type="number"
                required
                min={0}
                max={100}
                value={configs.platformFeePercent}
                onChange={(e) => setConfigs({ ...configs, platformFeePercent: Number(e.target.value) })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Base Payout Currency
              </label>
              <select
                value={configs.defaultCurrency}
                onChange={(e) => setConfigs({ ...configs, defaultCurrency: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Storage constraints */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Storage & Media Limits</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Configure maximum sizes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Max Asset Upload Size (MB)
              </label>
              <input
                type="number"
                required
                min={10}
                value={configs.maxUploadMb}
                onChange={(e) => setConfigs({ ...configs, maxUploadMb: Number(e.target.value) })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Allowed File Extensions
              </label>
              <input
                type="text"
                required
                value={configs.allowedExtensions}
                onChange={(e) => setConfigs({ ...configs, allowedExtensions: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none font-mono text-label-xs"
              />
            </div>
          </div>
        </div>

        {/* Security and Policies */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Security & Policy Configs</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Access credentials parameters</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between p-3 border border-border">
              <div className="space-y-1 pr-4">
                <label className="text-label-md font-bold uppercase text-foreground">
                  Require Email Verification
                </label>
                <p className="text-body-sm text-muted-foreground">
                  Students must click verification link in signup emails to register and buy courses.
                </p>
              </div>
              <input
                type="checkbox"
                checked={toggles.requireEmailVerification}
                onChange={(e) => setToggles({ ...toggles, requireEmailVerification: e.target.checked })}
                className="w-5 h-5 accent-foreground mt-1 flex-shrink-0 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between p-3 border border-border">
              <div className="space-y-1 pr-4">
                <label className="text-label-md font-bold uppercase text-foreground">
                  Enable CAPTCHA Signups
                </label>
                <p className="text-body-sm text-muted-foreground">
                  Verify registration tokens using Cloudflare Turnstile blocks to restrict spam accounts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={toggles.enableCaptchaSignup}
                onChange={(e) => setToggles({ ...toggles, enableCaptchaSignup: e.target.checked })}
                className="w-5 h-5 accent-foreground mt-1 flex-shrink-0 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between p-3 border border-border">
              <div className="space-y-1 pr-4 font-bold text-red-600">
                <label className="text-label-md uppercase">
                  Global Maintenance Mode
                </label>
                <p className="text-body-sm text-red-600/80 font-normal">
                  Put the entire marketplace platform offline. Creators can still access the studio dashboard editor nodes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={toggles.maintenanceMode}
                onChange={(e) => setToggles({ ...toggles, maintenanceMode: e.target.checked })}
                className="w-5 h-5 accent-red-600 mt-1 flex-shrink-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          {saveSuccess && (
            <span className="text-label-md uppercase font-bold text-foreground flex items-center gap-1">
              <Check className="w-4 h-4" />
              Configurations Updated Successfully
            </span>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Configs..." : "Save Configs"}
          </button>
        </div>
      </form>
    </div>
  );
}
