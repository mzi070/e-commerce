import type { BankTransferDetails } from "@/lib/commerce-config";

export function BankDetailsCard({
  bankDetails,
  totalLabel,
}: {
  bankDetails: BankTransferDetails;
  totalLabel?: string;
}) {
  return (
    <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
      <h3 className="font-semibold text-indigo-950 dark:text-indigo-100">
        Bank account details
      </h3>
      {totalLabel && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Transfer <strong>{totalLabel}</strong> to the account below.
        </p>
      )}
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Bank name</dt>
          <dd className="font-medium">{bankDetails.bankName}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Bank account name</dt>
          <dd className="font-medium">{bankDetails.accountName}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-500">Bank account number</dt>
          <dd className="font-mono text-base font-semibold tracking-wide">
            {bankDetails.accountNumber}
          </dd>
        </div>
      </dl>
      {bankDetails.instructions && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          {bankDetails.instructions}
        </p>
      )}
    </div>
  );
}
