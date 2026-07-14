import { redirect } from "next/navigation";

import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PasskeySigninButton } from "@/components/passkey-signin-button";

export default async function SignInPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Semanal</h1>
        <p className="text-sm text-muted-foreground">
          Know where your money goes.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <PasskeySigninButton />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" size="lg" className="w-full">
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
