import Welcome from "@/features/auth/components/Welcome";
import TextSizeChoice from "@/features/text-size/components/TextSizeChoice"; // TEXT-SIZE

// Every signed-out visit lands here, in the browser as well as in the installed app: the email, then the
// link in the mailbox (the auth README). A new member also chooses the text size while signing up.
export default function LoginPage() {
  return <Welcome signUpExtra={<TextSizeChoice />} />; // TEXT-SIZE
}
