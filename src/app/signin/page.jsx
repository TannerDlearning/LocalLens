import { GalleryVerticalEnd } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { PrivacyPanel } from "@/components/privacy-panel";

export const metadata = {
  title: "Sign Up — LocalLens",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          LocalLens
        </a>

        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-balance">
                  It’s free — takes less than a minute.
                </p>
              </div>

              <AuthForm mode="signup" />
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Log in
                </a>
              </p>
            </div>

            <PrivacyPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
