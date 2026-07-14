"use client";

import * as React from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { importTransactions } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Account = { id: string; name: string; icon: string; currency: string };

type ParsedRow = { date: string; merchant: string; amount: number; category?: string };

const DATE_HEADERS = ["date", "transaction date", "posted date"];
const MERCHANT_HEADERS = ["merchant", "description", "name", "payee"];
const AMOUNT_HEADERS = ["amount", "value"];
const CATEGORY_HEADERS = ["category"];

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = lower.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[^0-9.-]/g, ""));
}

export function CsvImportDialog({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [rows, setRows] = React.useState<ParsedRow[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);

  function handleFile(file: File) {
    setParseError(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const dateCol = findColumn(headers, DATE_HEADERS);
        const merchantCol = findColumn(headers, MERCHANT_HEADERS);
        const amountCol = findColumn(headers, AMOUNT_HEADERS);
        const categoryCol = findColumn(headers, CATEGORY_HEADERS);

        if (!dateCol || !amountCol) {
          setParseError(
            "Couldn't find a date and amount column. Expected headers like \"Date\" and \"Amount\"."
          );
          setRows([]);
          return;
        }

        const parsed: ParsedRow[] = [];
        for (const record of results.data) {
          const rawAmount = record[amountCol];
          if (!record[dateCol] || !rawAmount) continue;
          const amount = parseAmount(rawAmount);
          if (!Number.isFinite(amount) || amount === 0) continue;

          parsed.push({
            date: record[dateCol],
            merchant: merchantCol ? record[merchantCol] ?? "" : "",
            amount,
            category: categoryCol ? record[categoryCol] || undefined : undefined,
          });
        }

        if (parsed.length === 0) {
          setParseError("No valid rows found in that file.");
        }
        setRows(parsed);
      },
      error: (err) => {
        setParseError(err.message);
        setRows([]);
      },
    });
  }

  async function handleImport() {
    if (!accountId || rows.length === 0) return;
    setImporting(true);
    try {
      const result = await importTransactions(
        accountId,
        rows.map((r) => ({ ...r, date: new Date(r.date) }))
      );
      toast.success(
        `Imported ${result.imported} transaction${result.imported === 1 ? "" : "s"} (${result.categorized} auto-categorized)`
      );
      setOpen(false);
      setRows([]);
      setFileName("");
      router.refresh();
    } catch {
      toast.error("Import failed — check the file and try again");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setRows([]);
          setFileName("");
          setParseError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="px-2 sm:px-4">
          <Upload className="size-4" />
          <span className="hidden sm:inline">Import CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import transactions from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="Select account" className="min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="truncate">
                      {a.icon} {a.name} ({a.currency})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="csv-file">CSV file</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="text-sm file:mr-3 file:rounded-md file:border file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Needs a date and amount column (e.g. Date, Amount) — merchant/description and
              category columns are optional. Negative amounts are expenses, positive are income.
            </p>
          </div>

          {parseError && <p className="text-sm text-destructive">{parseError}</p>}

          {rows.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {fileName}: {rows.length} row{rows.length === 1 ? "" : "s"} ready to import
              </p>
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 8).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{row.date}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{row.merchant}</TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${row.amount < 0 ? "" : "text-emerald-500"}`}
                        >
                          {row.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.category || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 8 && (
                <p className="text-xs text-muted-foreground">
                  + {rows.length - 8} more not shown
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={!accountId || rows.length === 0 || importing}
          >
            {importing ? "Importing..." : `Import ${rows.length || ""} transactions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
