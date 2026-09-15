import PageHeader from "@/components/PageHeader";
import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <PageHeader title="Sign in" />
      <LoginForm />
    </>
  );
}
