import { Suspense } from "react";
import LoginForm from "@/features/auth/components/LoginForm";

const LoginPage = async () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
};

export default LoginPage;
