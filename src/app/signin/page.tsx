import { redirect } from "next/navigation";
import { Zap } from "lucide-react";

import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PasskeySigninButton } from "@/components/passkey-signin-button";

export default async function SignInPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_60%)] px-4 py-12">
      <div className="absolute top-6 left-6 flex items-center gap-2 sm:top-8 sm:left-8">
        <div className="flex size-7 items-center justify-center rounded-md bg-[#111111] text-[#facc15]">
          <Zap className="size-4 fill-current" />
        </div>
        <span className="text-lg font-bold tracking-tight">Semanal</span>
      </div>

      <Card className="w-full max-w-sm py-8 shadow-lg">
        <CardHeader className="flex-col gap-3 px-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#111111] text-[#facc15]">
            <Zap className="size-7 fill-current" />
          </div>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              Semanal
            </CardTitle>
            <CardDescription>Know where your money goes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8">
          <div className="flex flex-col gap-3">
            <PasskeySigninButton className="w-full" />
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
        </CardContent>
      </Card>
    </div>
  );
}
