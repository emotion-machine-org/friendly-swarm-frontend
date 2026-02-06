"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="page active">
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  );
}
