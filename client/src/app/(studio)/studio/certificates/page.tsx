"use client";

import { useState } from "react";
import { Award, Plus, Search, Check, RefreshCw, FileText, Trash } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

// Mock template structure
interface CertificateTemplate {
  id: string;
  name: string;
  layout: "portrait" | "landscape";
  hasLogo: boolean;
  signatureText: string;
  borderStyle: "solid" | "double" | "minimal";
}

export default function StudioCertificatesPage() {
  // Mock issued certificates state
  const [issuedCertificates, setIssuedCertificates] = useState([
    {
      id: "cert-1",
      studentName: "Alex Johnson",
      studentEmail: "alex@example.com",
      courseTitle: "Advanced UI/UX Architecture",
      verificationCode: "LX-CERT-2023-001-AWSSolArch",
      issuedAt: "2024-05-27T18:00:00Z",
      grade: "Distinction",
      status: "active",
    },
    {
      id: "cert-2",
      studentName: "Sarah J.",
      studentEmail: "sarah.j@example.com",
      courseTitle: "Design Systems in React",
      verificationCode: "LX-CERT-2024-002-ReactAdv",
      issuedAt: "2024-05-20T10:00:00Z",
      grade: "Merit",
      status: "active",
    },
    {
      id: "cert-3",
      studentName: "Mike T.",
      studentEmail: "mike@example.com",
      courseTitle: "Typography Mastery",
      verificationCode: "LX-CERT-2023-003-PyData",
      issuedAt: "2024-04-12T11:00:00Z",
      grade: "Pass",
      status: "active",
    },
  ]);

  // Search state
  const [search, setSearch] = useState("");

  // New certificate form state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newCert, setNewCert] = useState({
    studentName: "",
    studentEmail: "",
    courseTitle: "Advanced UI/UX Architecture",
    grade: "Distinction",
  });

  // Template customizer state
  const [template, setTemplate] = useState<CertificateTemplate>({
    id: "temp-1",
    name: "Standard Academy Credential",
    layout: "landscape",
    hasLogo: true,
    signatureText: "Principal Director, LearnioX",
    borderStyle: "solid",
  });

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.studentName || !newCert.studentEmail) return;

    const code = `LX-CERT-2026-${Math.floor(100 + Math.random() * 900)}-${newCert.courseTitle.split(" ").map(w => w[0]).join("")}`;
    const newItem = {
      id: `cert-${Date.now()}`,
      studentName: newCert.studentName,
      studentEmail: newCert.studentEmail,
      courseTitle: newCert.courseTitle,
      verificationCode: code,
      issuedAt: new Date().toISOString(),
      grade: newCert.grade,
      status: "active",
    };

    setIssuedCertificates([newItem, ...issuedCertificates]);
    setShowIssueModal(false);
    setNewCert({
      studentName: "",
      studentEmail: "",
      courseTitle: "Advanced UI/UX Architecture",
      grade: "Distinction",
    });
  };

  const handleRevoke = (id: string) => {
    setIssuedCertificates(
      issuedCertificates.map((c) =>
        c.id === id ? { ...c, status: "revoked" } : c
      )
    );
  };

  const filteredCerts = issuedCertificates.filter(
    (c) =>
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.verificationCode.toLowerCase().includes(search.toLowerCase()) ||
      c.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Certificates</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Design and issue secure digital credentials for completing courses.
          </p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Issue New Certificate
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Total Credentials Issued</p>
          <p className="text-headline-lg font-bold mt-2">{issuedCertificates.length}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Verification Rate</p>
          <p className="text-headline-lg font-bold mt-2">100%</p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Active Template</p>
          <p className="text-headline-lg font-bold mt-2 text-ellipsis overflow-hidden whitespace-nowrap">
            {template.name}
          </p>
        </div>
      </div>

      {/* Main Grid: Template Configurer & Issued Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Builder */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold">Credential Designer</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Configure global layout</p>
          </div>

          {/* Mini Certificate Preview */}
          <div
            className={`w-full aspect-[1.414/1] bg-surface-container border p-4 flex flex-col justify-between items-center text-center relative rounded-none
              ${template.borderStyle === "double" ? "border-double border-4 border-foreground" : ""}
              ${template.borderStyle === "solid" ? "border-2 border-foreground" : ""}
              ${template.borderStyle === "minimal" ? "border-t-4 border-foreground" : ""}
            `}
          >
            <div className="text-label-xs uppercase tracking-widest text-muted-foreground font-bold">
              Certificate of Completion
            </div>
            {template.hasLogo && (
              <div className="w-8 h-8 bg-foreground flex items-center justify-center font-bold text-background text-sm">
                L
              </div>
            )}
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground italic">this is proudly presented to</div>
              <div className="text-body-md font-bold underline decoration-1">Student Name</div>
              <div className="text-[9px] text-muted-foreground">for outstanding achievement in</div>
              <div className="text-[10px] font-bold uppercase">{newCert.courseTitle || "Course Title"}</div>
            </div>

            <div className="w-full flex justify-between items-end border-t border-border pt-1">
              <div className="text-[7px] text-left">
                <span className="text-muted-foreground">Verify:</span>
                <br />
                LX-CERT-YYYY-XXX
              </div>
              <div className="text-right">
                <div className="text-[7px] font-bold border-b border-border pb-0.5 max-w-[80px] truncate">
                  {template.signatureText || "Signature"}
                </div>
                <div className="text-[6px] text-muted-foreground">Authorized Signature</div>
              </div>
            </div>
          </div>

          {/* Form Options */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Signature Label
              </label>
              <input
                type="text"
                value={template.signatureText}
                onChange={(e) => setTemplate({ ...template, signatureText: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Border style
                </label>
                <select
                  value={template.borderStyle}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      borderStyle: e.target.value as "solid" | "double" | "minimal",
                    })
                  }
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="solid">Solid (2px)</option>
                  <option value="double">Double</option>
                  <option value="minimal">Minimal Top</option>
                </select>
              </div>
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Orientation
                </label>
                <select
                  value={template.layout}
                  onChange={(e) =>
                    setTemplate({ ...template, layout: e.target.value as "portrait" | "landscape" })
                  }
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="hasLogo"
                checked={template.hasLogo}
                onChange={(e) => setTemplate({ ...template, hasLogo: e.target.checked })}
                className="w-4 h-4 accent-foreground"
              />
              <label htmlFor="hasLogo" className="text-label-sm uppercase font-bold cursor-pointer">
                Include Platform Logo
              </label>
            </div>
          </div>
        </div>

        {/* Issued Ledger */}
        <div className="lg:col-span-2 border border-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-headline-sm font-bold">Issued Log</h3>
              <p className="text-label-sm text-muted-foreground uppercase">Ledger of all active credentials</p>
            </div>
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground bg-surface-container">
                  <th className="p-3 text-label-xs uppercase font-bold">Recipient</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Course Details</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Code</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Grade</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Date Issued</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                  <th className="p-3 text-label-xs uppercase font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-body-sm text-muted-foreground">
                      No certificates found.
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((cert) => (
                    <tr
                      key={cert.id}
                      className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{cert.studentName}</div>
                        <div className="text-label-xs text-muted-foreground uppercase">
                          {cert.studentEmail}
                        </div>
                      </td>
                      <td className="p-3 font-medium">{cert.courseTitle}</td>
                      <td className="p-3 font-mono text-label-xs">{cert.verificationCode}</td>
                      <td className="p-3 font-bold">{cert.grade}</td>
                      <td className="p-3 text-muted-foreground">
                        {formatRelativeTime(cert.issuedAt)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                            ${
                              cert.status === "active"
                                ? "bg-foreground text-background"
                                : "bg-muted-foreground/20 text-muted-foreground line-through"
                            }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {cert.status === "active" ? (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            className="text-label-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 font-bold"
                          >
                            <Trash className="w-3 h-3" />
                            Revoke
                          </button>
                        ) : (
                          <span className="text-label-xs text-muted-foreground uppercase">
                            Revoked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Issue Certificate Modal (Overlay) */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-foreground p-6 max-w-md w-full space-y-6 animate-fade-in rounded-none">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-headline-sm font-bold text-foreground">Issue Credential</h3>
                <p className="text-label-sm text-muted-foreground uppercase">
                  Verify completion details
                </p>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-body-lg text-muted-foreground hover:text-foreground transition-colors font-mono font-bold"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emily Watson"
                  value={newCert.studentName}
                  onChange={(e) => setNewCert({ ...newCert, studentName: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>

              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. emily@example.com"
                  value={newCert.studentEmail}
                  onChange={(e) => setNewCert({ ...newCert, studentEmail: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>

              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Course
                </label>
                <select
                  value={newCert.courseTitle}
                  onChange={(e) => setNewCert({ ...newCert, courseTitle: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="Advanced UI/UX Architecture">Advanced UI/UX Architecture</option>
                  <option value="Design Systems in React">Design Systems in React</option>
                  <option value="Typography Mastery">Typography Mastery</option>
                  <option value="Grid Layouts Deep Dive">Grid Layouts Deep Dive</option>
                </select>
              </div>

              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Grade / Evaluation
                </label>
                <select
                  value={newCert.grade}
                  onChange={(e) => setNewCert({ ...newCert, grade: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="Distinction">Distinction</option>
                  <option value="Merit">Merit</option>
                  <option value="Pass">Pass</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-2.5 border border-border hover:border-foreground text-label-md uppercase tracking-wider font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-foreground text-background hover:opacity-85 text-label-md uppercase tracking-wider font-bold transition-opacity"
                >
                  Issue Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
