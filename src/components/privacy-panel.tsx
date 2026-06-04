import { ShieldCheck, Mail, HeartHandshake } from "lucide-react";

export function PrivacyPanel() {
  return (
    <div className="bg-muted flex flex-col gap-4 p-6 md:p-8 md:border-l">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your privacy matters</h2>
        <p className="text-sm text-muted-foreground">
          Quick promises about how we handle your data.
        </p>
      </div>

      <ul className="space-y-3 text-sm">
        <li className="flex gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-foreground" />
          <span>We never sell your data to third parties.</span>
        </li>
        <li className="flex gap-3">
          <Mail className="h-5 w-5 shrink-0 text-foreground" />
          <span>No spam or marketing emails.</span>
        </li>
        <li className="flex gap-3">
          <HeartHandshake className="h-5 w-5 shrink-0 text-foreground" />
          <span>Your email is used for account access and security notices only.</span>
        </li>
      </ul>
    </div>
  );
}
