// "use client";

// import * as React from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { Suspense } from "react";
// import { supabase, refreshSessionIfNeeded } from "@/lib/supabaseClient";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Loader2 } from "lucide-react";

// type Mode = "login" | "signup";

// interface AuthFormProps {
//   mode: Mode;
//   redirectTo?: string; // where to go after success (e.g. "/dashboard")
// }

// function AuthFormInner({ mode, redirectTo = "/" }: AuthFormProps) {
//   const router = useRouter();
//   const params = useSearchParams();
//   const anonFromQuery = params.get("anon") || undefined;

//   const [email, setEmail] = React.useState("");
//   const [password, setPassword] = React.useState("");
//   const [loading, setLoading] = React.useState(false);
//   const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

//   const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
//   const callbackUrl = `${baseUrl}/auth/callback${
//     anonFromQuery ? `?anon=${encodeURIComponent(anonFromQuery)}` : ""
//   }`;

//   const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMsg(null);
//     setLoading(true);

//     try {
//       if (mode === "login") {
//         // LOGIN FLOW
//         const { error } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });
        
//         if (error) {
//           throw error;
//         }

//         const { data: userData } = await supabase.auth.getUser();
//         const userId = userData.user?.id;

//         if (userId) {
//           let pendingAnon: string | undefined;
//           try {
//             pendingAnon = localStorage.getItem("pendingAnonymousId") || undefined;
//           } catch {}

//           await ensureProfile(userId, anonFromQuery ?? pendingAnon);

//           try {
//             localStorage.removeItem("pendingEmailVerification");
//             localStorage.removeItem("pendingAnonymousId");
//           } catch {}
//         }

//         router.push(redirectTo.startsWith("http") ? redirectTo : `${baseUrl}${redirectTo}`);
//         return;
//       } else {
//         // SIGNUP FLOW
//         const { data, error } = await supabase.auth.signUp({
//           email,
//           password,
//           options: { emailRedirectTo: callbackUrl },
//         });

//         if (error) {
//           console.log("Signup error:", error);
//           if (error.code === "email_exists") {
//             setErrorMsg("An account with this email already exists. Please log in instead.");
//           } else {
//             setErrorMsg(error.message);
//           }
//           return;
//         }

//         // Check if signup succeeded by checking if user was created
//         if (!data.user) {
//           setErrorMsg("An account with this email already exists. Please log in instead.");
//           return;
//         }

//         // Create profile immediately with new user's ID (works with or without email verification)
//         const userId = data.user.id;
//         if (userId) {
//           let pendingAnon: string | undefined;
//           try {
//             pendingAnon = localStorage.getItem("pendingAnonymousId") || undefined;
//           } catch {}

//           await ensureProfile(userId, anonFromQuery ?? pendingAnon);

//           try {
//             localStorage.removeItem("pendingEmailVerification");
//             localStorage.removeItem("pendingAnonymousId");
//           } catch {}
//         }

//         if (!data.session) {
//           try {
//             localStorage.setItem("pendingEmailVerification", email);
//             if (anonFromQuery) localStorage.setItem("pendingAnonymousId", anonFromQuery);
//           } catch {}
//           router.push(redirectTo.startsWith("http") ? redirectTo : `${baseUrl}${redirectTo}`);
//           return;
//         }

//         router.push(redirectTo.startsWith("http") ? redirectTo : `${baseUrl}${redirectTo}`);
//         return;
//       }
//     } catch (err: any) {
//       console.error("Auth error:", err);

//       const detailedMessage =
//         err?.error_description ||
//         err?.error?.message ||
//         err?.message ||
//         err?.response?.error_description ||
//         err?.response?.message ||
//         (err?.status === 504
//           ? "The server took too long to respond. If you just enabled custom email, it may take a few minutes for SMTP setup to complete."
//           : "An unexpected error occurred during authentication.");

//       const status = err?.status || err?.error?.status || err?.response?.status;
//       setErrorMsg(status ? `[${status}] ${detailedMessage}` : detailedMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogle = async () => {
//     setErrorMsg(null);
//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: "google",
//         options: { redirectTo: callbackUrl },
//       });
//       if (error) throw error;
//     } catch (err: any) {
//       console.error("Google sign-in error:", err);

//       const detailedMessage =
//         err?.error_description ||
//         err?.error?.message ||
//         err?.message ||
//         err?.response?.message ||
//         "Google sign-in failed. Please try again later.";

//       const status = err?.status || err?.error?.status || err?.response?.status;
//       setErrorMsg(status ? `[${status}] ${detailedMessage}` : detailedMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleEmailAuth} className="grid gap-4">
//       <div className="grid gap-2">
//         <Label className = "" htmlFor="email">Email</Label>
//         <Input
//           id="email"
//           type="email"
//           required
//           value={email}
//           onChange={(e) => setEmail(e.currentTarget.value)}
//           placeholder="you@example.com"
//         />
//       </div>

//       <div className="grid gap-2">
//         <Label className = "" htmlFor="password">Password</Label>
//         <Input
//           id="password"
//           type="password"
//           autoComplete={mode === "login" ? "current-password" : "new-password"}
//           required
//           value={password}
//           onChange={(e) => setPassword(e.currentTarget.value)}
//           placeholder="••••••••"
//         />
//       </div>

//       {errorMsg && <p className="text-sm text-red-600 whitespace-pre-line">{errorMsg}</p>}

//       <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
//         {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//         {mode === "login" ? "Sign in" : "Create account"}
//       </Button>

//       <div className="relative my-2">
//         <div className="absolute inset-0 flex items-center">
//           <span className="w-full border-t" />
//         </div>
//         <div className="relative flex justify-center text-xs uppercase">
//           <span className="bg-background px-2 text-muted-foreground">Or</span>
//         </div>
//       </div>

//       <Button
//         type="button"
//         variant="outline"
//         className="w-full cursor-pointer"
//         onClick={handleGoogle}
//         disabled={loading}
//       >
//         Continue with Google
//       </Button>
//     </form>
//   );
// }

// export function AuthForm(props: AuthFormProps) {
//   return (
//     <Suspense fallback={<div className="p-6 text-center">Loading form...</div>}>
//       <AuthFormInner {...props} />
//     </Suspense>
//   );
// }

