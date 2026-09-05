"use client";

import React from "react";
import { formatCurrencyVND, parseCurrencyVND } from "@/lib/dynamic-form-schema";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id?: string;
  value?: number | string;
  onChange: (val: number) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  disabled = false,
  hasError = false,
  className,
}: CurrencyInputProps) {
  // Directly compute display string from value prop (no cascading effect/state)
  const displayValue =
    value !== undefined && value !== null && value !== "" && value !== 0
      ? formatCurrencyVND(value)
      : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    const numeric = parseCurrencyVND(rawStr);
    onChange(numeric);
  };

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pr-14",
          hasError && "border-red-500 focus:ring-red-500",
          className
        )}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
          VNĐ
        </span>
      </div>
    </div>
  );
}
