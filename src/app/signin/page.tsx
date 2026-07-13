import { redirect } from "next/navigation";

import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function SignInPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Finance Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Know where your money goes.
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
      >
        <Button type="submit" size="lg">
          Sign in with Google
        </Button>
      </form>
    </div>
  );
}
