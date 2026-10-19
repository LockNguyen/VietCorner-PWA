import Welcome from "@/features/auth/components/Welcome";
import TextSizeChoice from "@/features/text-size/components/TextSizeChoice"; // TEXT-SIZE

// Every signed-out visit lands here, in the browser as well as in the installed app: the email, then the
// link in the mailbox (the auth README). A new member's first step is choosing the text size.
export default function LoginPage() {
  return <Welcome firstStep={<TextSizeChoice asStep />} />; // TEXT-SIZE
}
