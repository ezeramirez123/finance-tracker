"use client";

import * as React from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Info } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ParsedRow = {
  date: string;
  account: string;
  merchant: string;
  amount: number;
  category?: string;
};

const DATE_HEADERS = ["date", "transaction date", "posted date"];
const ACCOUNT_HEADERS = ["account", "account name"];
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

function CsvRequirementsInfo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label="CSV format requirements"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-72 text-left">
          <p className="font-medium">Required columns</p>
          <p>
            <span className="font-medium">Date</span> — Date, Transaction Date, or Posted Date
          </p>
          <p>
            <span className="font-medium">Account</span> — the account name; matched to an
            existing account by name, or created automatically if it doesn&apos;t exist
          </p>
          <p>
            <span className="font-medium">Amount</span> — Amount or Value. Negative = expense,
            positive = income
          </p>
          <p className="mt-1.5 font-medium">Optional columns</p>
          <p>Merchant, Description, Name, or Payee — the transaction&apos;s description</p>
          <p>
            Category — matched to an existing category by name, or auto-guessed by merchant
          </p>
          <p className="mt-1.5">
            Rows with <span className="font-medium">Category = Transfer</span> that share a
            date, opposite sign, and matching amount with another Transfer row are linked into
            a single transfer between those two rows&apos; accounts, instead of counting as
            income or an expense.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CsvImportDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
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
        const accountCol = findColumn(headers, ACCOUNT_HEADERS);
        const merchantCol = findColumn(headers, MERCHANT_HEADERS);
        const amountCol = findColumn(headers, AMOUNT_HEADERS);
        const categoryCol = findColumn(headers, CATEGORY_HEADERS);

        if (!dateCol || !accountCol || !amountCol) {
          setParseError(
            "Couldn't find a date, account, and amount column. Expected headers like \"Date\", \"Account\", and \"Amount\"."
          );
          setRows([]);
          return;
        }

        const parsed: ParsedRow[] = [];
        for (const record of results.data) {
          const rawAmount = record[amountCol];
          if (!record[dateCol] || !record[accountCol] || !rawAmount) continue;
          const amount = parseAmount(rawAmount);
          if (!Number.isFinite(amount) || amount === 0) continue;

          parsed.push({
            date: record[dateCol],
            account: record[accountCol],
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
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const result = await importTransactions(
        rows.map((r) => ({ ...r, date: new Date(r.date) }))
      );
      const parts = [
        `Imported ${result.imported + result.transfersCreated * 2} transaction${
          result.imported + result.transfersCreated * 2 === 1 ? "" : "s"
        }`,
        result.transfersCreated > 0 ? `${result.transfersCreated} linked as transfers` : null,
        result.accountsCreated > 0
          ? `${result.accountsCreated} account${result.accountsCreated === 1 ? "" : "s"} created`
          : null,
      ].filter(Boolean);
      toast.success(parts.join(" · "));
      setOpen(false);
      setRows([]);
      setFileName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed — check the file and try again");
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
          <DialogTitle className="flex items-center gap-1.5">
            Import transactions from CSV
            <CsvRequirementsInfo />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
              Needs Date, Account, and Amount columns — hover the <Info className="inline size-3" />{" "}
              above for details.
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
                      <TableHead>Account</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 8).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{row.date}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{row.account}</TableCell>
                        <TableCell className="max-w-[140px] truncate">{row.merchant}</TableCell>
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
          <Button onClick={handleImport} disabled={rows.length === 0 || importing}>
            {importing ? "Importing..." : `Import ${rows.length || ""} transactions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
