"use client";

import { useState } from "react";
import { ShieldCheck, Upload, AlertCircle, FileText, CheckCircle, Clock } from "lucide-react";

export default function StudioVerificationPage() {
  const [kycStatus, setKycStatus] = useState<"unsubmitted" | "pending" | "approved">("unsubmitted");
  const [formData, setFormData] = useState({
    businessName: "",
    regNumber: "",
    address: "",
    docType: "business_license",
  });
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUploaded) {
      alert("Please upload verification documents first.");
      return;
    }
    setKycStatus("pending");
  };

  return (
    <div className="max-w-[700px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Institution Verification</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Verify your academy credentials to display the verified check badge across LearnioX search results and pages.
        </p>
      </div>

      {/* Verification Badge Banner */}
      <div className={`border p-6 flex items-start gap-4 transition-all
        ${
          kycStatus === "approved"
            ? "border-foreground bg-surface"
            : kycStatus === "pending"
            ? "border-border bg-surface-container"
            : "border-border bg-surface-container"
        }`}
      >
        <div className="mt-1 flex-shrink-0">
          {kycStatus === "approved" ? (
            <ShieldCheck className="w-10 h-10 text-foreground" />
          ) : kycStatus === "pending" ? (
            <Clock className="w-10 h-10 text-muted-foreground" />
          ) : (
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="text-label-md font-bold uppercase text-foreground">
            {kycStatus === "approved"
              ? "Verified Institution"
              : kycStatus === "pending"
              ? "KYC Verification Pending Audit"
              : "Academy Verification Required"}
          </h3>
          <p className="text-body-sm text-muted-foreground mt-1 leading-relaxed">
            {kycStatus === "approved"
              ? "Your registry identity has been verified. The badge is displayed next to your course descriptions and channel tabs."
              : kycStatus === "pending"
              ? "Your documentation was received. Our team will review the registration certificates within 2-3 business days."
              : "You are currently running in unverified sandbox mode. To accept student enrollments and charge pricing plans, you must submit business proof."}
          </p>
        </div>
      </div>

      {/* KYC Form */}
      {kycStatus === "unsubmitted" && (
        <form onSubmit={handleSubmit} className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Submit Corporate Registry</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Provide official identification details</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Official Entity Registered Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Design Tech Pvt Ltd"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Tax / Registration ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTIN12345678"
                  value={formData.regNumber}
                  onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Document Type
                </label>
                <select
                  value={formData.docType}
                  onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="business_license">Business License</option>
                  <option value="incorporation_cert">Certificate of Incorporation</option>
                  <option value="tax_registration">Tax Registry Document</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Registered Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5th Block, Koramangala, Bangalore"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            {/* Document Uploader */}
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-2">
                Upload Document Proof
              </label>
              {fileUploaded ? (
                <div className="border border-foreground p-6 bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-foreground" />
                    <div>
                      <p className="text-body-sm font-semibold text-foreground">accreditation_proof.pdf</p>
                      <p className="text-label-xs text-muted-foreground uppercase">File ready (4.2 MB)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileUploaded(false)}
                    className="text-label-sm font-bold uppercase text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setFileUploaded(true)}
                  className="w-full border-2 border-dashed border-border hover:border-foreground p-8 flex flex-col items-center justify-center text-center gap-2 transition-colors rounded-none group"
                >
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-label-md uppercase tracking-wider font-bold text-foreground">
                    Choose PDF or Image
                  </span>
                  <span className="text-label-sm text-muted-foreground">
                    Max size: 10MB (PDF, PNG, JPG)
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-6 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity"
            >
              Submit Verification Documents
            </button>
          </div>
        </form>
      )}

      {/* Pending Review Panel */}
      {kycStatus === "pending" && (
        <div className="border border-border p-6 text-center space-y-4">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-headline-sm font-bold text-foreground">Audit Under Review</h3>
          <p className="text-body-sm text-muted-foreground max-w-md mx-auto">
            Our platform administrators are currently auditing the registry document details submitted for{" "}
            <strong>{formData.businessName || "Design Tech Pvt Ltd"}</strong>. You will receive an email notice when completed.
          </p>
          <div className="border-t border-border pt-4 max-w-sm mx-auto flex justify-between text-body-sm text-muted-foreground">
            <span>Tax ID: {formData.regNumber || "GSTIN12345678"}</span>
            <span>Status: Pending Audit</span>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setKycStatus("approved")}
              className="text-label-xs font-bold uppercase text-foreground hover:underline"
            >
              [Dev mode: Simulate Approved Status]
            </button>
          </div>
        </div>
      )}

      {/* Approved State Panel */}
      {kycStatus === "approved" && (
        <div className="border border-foreground p-8 text-center space-y-4 bg-surface-container">
          <ShieldCheck className="w-16 h-16 text-foreground mx-auto" />
          <h3 className="text-headline-sm font-bold text-foreground">Verification Complete</h3>
          <p className="text-body-sm text-muted-foreground max-w-md mx-auto">
            Congratulations! Your academy has been fully verified. The verification checkmark badge has been added to your profile.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setKycStatus("unsubmitted")}
              className="text-label-xs font-bold uppercase text-muted-foreground hover:text-foreground"
            >
              Reset KYC Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
