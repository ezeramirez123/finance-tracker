import { RefreshCw } from "lucide-react";

import { getLatestUsdRates, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { formatMoney, formatUsd } from "@/lib/format";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  PYG: "Paraguayan Guaraní",
  BRL: "Brazilian Real",
  EUR: "Euro",
};

export default async function RatesPage() {
  const rates = await getLatestUsdRates();
  const currencies = SUPPORTED_CURRENCIES.filter((c) => c !== "USD");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Exchange rates</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <RefreshCw className="size-3.5" />
          Refreshed daily, relative to USD
        </p>
      </div>

      <Card className="py-0">
        <Table hideScrollHint>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">1 USD equals</TableHead>
              <TableHead className="text-right">1 unit equals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.map((code) => {
              const rate = rates[code];
              if (!rate) return null;
              return (
                <TableRow key={code}>
                  <TableCell className="font-medium">
                    <p>{code}</p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {CURRENCY_NAMES[code] ?? code}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(rate, code)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUsd(1 / rate)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
