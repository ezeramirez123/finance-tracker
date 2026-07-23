import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const env = process.env.PLAID_ENV ?? "sandbox";

const configuration = new Configuration({
  basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

/** Plaid's axios errors carry the real reason in `response.data` — this
 * pulls it out so routes can log and surface it instead of a generic
 * "something went wrong", which is otherwise all a crashed route reports. */
export function getPlaidErrorDetails(err: unknown) {
  const data =
    typeof err === "object" && err !== null && "response" in err
      ? (err as { response?: { data?: { error_code?: string; error_message?: string } } })
          .response?.data
      : undefined;
  return data;
}
