import { LoginForm } from "@/features/admin/login-form";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false }
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
