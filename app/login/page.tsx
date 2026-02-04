import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ padding: 16 }}>Carregando...</main>}>
      <LoginClient />
    </Suspense>
  );
}
