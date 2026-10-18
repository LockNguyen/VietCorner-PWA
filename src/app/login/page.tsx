import Welcome from "@/features/auth/components/Welcome";

// Every signed-out visit lands here, in the browser as well as in the installed app: the email, then the
// link in the mailbox (the auth README).
export default function LoginPage() {
  return <Welcome />;
}
