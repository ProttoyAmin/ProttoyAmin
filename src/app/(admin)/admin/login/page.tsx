import { Suspense } from "react";

import { LoginForm } from "@/client/admin/login-form";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
