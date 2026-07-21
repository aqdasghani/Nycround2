"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const GoogleLogo = () => (
  <svg className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      if (err === "email_fetch_failed") {
        setErrorMsg("Failed to retrieve your email address from Google. Please try again.");
      } else if (err === "callback_exception") {
        setErrorMsg("An unexpected error occurred during Google Sign-In.");
      } else {
        setErrorMsg(`Authentication failed: ${err.replace(/_/g, " ")}`);
      }
    }
  }, []);

  const handleGoogleSignup = () => {
    setLoading(true);
    window.location.href = "/api/auth/google?login=true";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas-bg px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-[#dadce0] shadow-google-card">
        {/* Title / Logo */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-google-blue text-white shadow-sm font-display font-black text-xl">
              T
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-[#202124]">
              Tube<span className="text-google-blue">Flow</span>
            </span>
          </Link>
          
          <h2 className="font-display text-xl font-bold text-[#202124]">
            Create your TubeFlow Account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            to connect your YouTube channels and manage automation
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 text-left font-medium">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition disabled:opacity-50 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-google-blue" />
                Redirecting to Google...
              </>
            ) : (
              <>
                <GoogleLogo />
                Sign up with Google
              </>
            )}
          </button>
          
          <div className="text-center text-xs text-slate-550 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-google-blue font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Security footnote */}
        <div className="text-center border-t border-slate-100 pt-4 text-[10px] text-slate-400">
          <span className="font-semibold block mb-1">🛡️ HIPAA & GDPR Compliant</span>
          We encrypt all auth tokens using AES-256 and never sell comment metrics.
        </div>
      </div>
    </div>
  );
}
