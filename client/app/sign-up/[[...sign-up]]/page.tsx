import { SignUp } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp />
    </div>
  );
}
