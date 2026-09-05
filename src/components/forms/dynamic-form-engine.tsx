"use client";

import React, { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema, FormField } from "@/types/form-schema";
import { buildZodSchema } from "@/lib/dynamic-form-schema";
import { CurrencyInput } from "./currency-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";

interface DynamicFormEngineProps {
  schema: FormSchema;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function DynamicFormEngine({
  schema,
  defaultValues = {},
  onSubmit,
  submitLabel = "Tạo dự thảo văn bản",
  isSubmitting = false,
  className,
}: DynamicFormEngineProps) {
  // Memoize dynamic zod validation schema
  const zodSchema = useMemo(() => buildZodSchema(schema), [schema]);

  // Derive initial values from schema default_values or passed defaultValues
  const initialValues = useMemo(() => {
    const values: Record<string, unknown> = { ...defaultValues };
    for (const field of schema.fields) {
      if (values[field.name] === undefined) {
        if (field.default_value !== undefined) {
          values[field.name] = field.default_value;
        } else if (field.type === "checkbox") {
          values[field.name] = false;
        } else if (field.type === "number" || field.type === "currency") {
          values[field.name] = "";
        } else {
          values[field.name] = "";
        }
      }
    }
    return values;
  }, [schema, defaultValues]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const errorMessage = error?.message as string | undefined;
    const hasError = !!error;

    return (
      <div key={field.name} className="space-y-1.5">
        <label
          htmlFor={field.name}
          className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>

        {field.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {field.description}
          </p>
        )}

        {(() => {
          switch (field.type) {
            case "text":
              return (
                <Input
                  id={field.name}
                  {...register(field.name)}
                  placeholder={field.placeholder}
                  className={cn(hasError && "border-red-500 focus:ring-red-500")}
                />
              );

            case "textarea":
              return (
                <textarea
                  id={field.name}
                  {...register(field.name)}
                  rows={4}
                  placeholder={field.placeholder}
                  className={cn(
                    "flex w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
                    hasError && "border-red-500 focus:ring-red-500"
                  )}
                />
              );

            case "number":
              return (
                <Input
                  id={field.name}
                  type="number"
                  {...register(field.name)}
                  placeholder={field.placeholder}
                  className={cn(hasError && "border-red-500 focus:ring-red-500")}
                />
              );

            case "currency":
              return (
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: controllerField }) => (
                    <CurrencyInput
                      id={field.name}
                      value={controllerField.value as number | string | undefined}
                      onChange={controllerField.onChange}
                      placeholder={field.placeholder || "0"}
                      hasError={hasError}
                    />
                  )}
                />
              );

            case "date":
              return (
                <Input
                  id={field.name}
                  type="date"
                  {...register(field.name)}
                  className={cn(hasError && "border-red-500 focus:ring-red-500")}
                />
              );

            case "select":
              return (
                <select
                  id={field.name}
                  {...register(field.name)}
                  defaultValue=""
                  className={cn(
                    "flex h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
                    hasError && "border-red-500 focus:ring-red-500"
                  )}
                >
                  <option value="" disabled>
                    {field.placeholder || "-- Chọn một tùy chọn --"}
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              );

            case "radio":
              return (
                <div className="space-y-2 pt-1">
                  {field.options?.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center space-x-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        {...register(field.name)}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              );

            case "checkbox":
              return (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id={field.name}
                    {...register(field.name)}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={field.name}
                    className="text-sm font-normal text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  >
                    {field.placeholder || "Xác nhận thông tin trên là chính xác"}
                  </label>
                </div>
              );

            default:
              return null;
          }
        })()}

        {hasError && (
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center">
            {errorMessage}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6 bg-card p-6 rounded-xl border shadow-xs", className)}
      noValidate
    >
      <div className="space-y-4">
        {schema.fields.map((field) => renderField(field))}
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              <span>{submitLabel}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
