import { MOCK_CERTIFICATES } from "@/lib/mock-data/learner";
import { Award, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Certificates — LearnioX" };

export default function CertificatesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Certificates</h1>
        <p className="text-body-sm text-muted-foreground mt-1">{MOCK_CERTIFICATES.length} certificates earned</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
        {MOCK_CERTIFICATES.map((cert, idx) => (
          <div
            key={cert.id}
            className={`p-6 ${idx % 2 === 0 ? "md:border-r border-border" : ""} ${idx < MOCK_CERTIFICATES.length - 2 ? "border-b border-border" : ""}`}
          >
            {/* Certificate card design */}
            <div className="border border-border-strong p-6 relative">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-foreground" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-foreground" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-foreground" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-foreground" />

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-foreground flex items-center justify-center">
                    <Award className="w-6 h-6 text-background" />
                  </div>
                </div>
                <p className="text-label-sm text-muted-foreground uppercase tracking-widest mb-2">
                  Certificate of Completion
                </p>
                <h2 className="text-headline-sm font-bold text-foreground mb-1">{cert.courseTitle}</h2>
                <p className="text-body-sm text-muted-foreground mb-1">{cert.institutionName}</p>
                {cert.grade && (
                  <span className="badge badge-primary text-label-sm mb-4 inline-block">
                    {cert.grade}
                  </span>
                )}
                <p className="text-label-sm text-muted-foreground">
                  Issued: {new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Link
                href={cert.verificationUrl}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border hover:border-foreground transition-colors text-label-md uppercase tracking-wider"
              >
                <ExternalLink className="w-3 h-3" />
                Verify
              </Link>
              <button className="flex-1 py-2.5 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity">
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
