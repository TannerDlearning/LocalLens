import { GalleryVerticalEnd } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { PrivacyPanel } from "@/components/privacy-panel";

export const metadata = {
  title: "Log In — LocalLens",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        {/* Logo / home link */}
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          LocalLens
        </a>

        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            {/* Left: login form */}
            <div className="p-6 md:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Start taking control of your privacy.
                </p>
              </div>

              <AuthForm mode="login" />

              {/* Forgot password link */}
              <div className="text-center text-sm text-muted-foreground mt-4">
                <a
                  href="/reset"
                  className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                >
                  Forgot your password?
                </a>
              </div>

              {/* Sign-up link */}
              <p className="text-center text-sm text-muted-foreground mt-3">
                Don’t have an account?{" "}
                <a
                  href="/signin"
                  className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                >
                  Sign up
                </a>
              </p>
            </div>

            {/* Right: privacy panel */}
            <PrivacyPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
