import { z } from "zod";
import type { FormSchema, FormField } from "@/types/form-schema";

/**
 * Parses a Vietnamese currency string (e.g. "150.000.000") into a raw number (150000000).
 */
export function parseCurrencyVND(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;
  const cleanStr = value.toString().replace(/[^\d]/g, "");
  return cleanStr ? parseInt(cleanStr, 10) : 0;
}

/**
 * Formats a number into Vietnamese standard currency display (e.g. 150000000 -> "150.000.000").
 */
export function formatCurrencyVND(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  const num = typeof value === "number" ? value : parseCurrencyVND(value);
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("vi-VN").format(num);
}

/**
 * Compiles a JSONB FormSchema specification into a dynamic Zod Schema.
 */
export function buildZodSchema(schema: FormSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of schema.fields) {
    shape[field.name] = buildFieldValidator(field);
  }

  return z.object(shape);
}

function buildFieldValidator(field: FormField): z.ZodTypeAny {
  const { label, type, required, validation } = field;

  switch (type) {
    case "text":
    case "textarea": {
      let validator = z.string();

      if (required) {
        validator = validator.min(1, `Vui lòng nhập ${label.toLowerCase()}`);
      } else {
        return validator.optional().or(z.literal(""));
      }

      if (validation?.min_length) {
        validator = validator.min(
          validation.min_length,
          `${label} tối thiểu ${validation.min_length} ký tự`
        );
      }

      if (validation?.max_length) {
        validator = validator.max(
          validation.max_length,
          `${label} không vượt quá ${validation.max_length} ký tự`
        );
      }

      if (validation?.pattern) {
        const regex = new RegExp(validation.pattern);
        validator = validator.regex(
          regex,
          validation.pattern_message || `${label} định dạng không hợp lệ`
        );
      }

      return validator;
    }

    case "number": {
      if (!required) {
        const optValidator = z
          .union([z.number(), z.string(), z.nan()])
          .optional()
          .transform((val) => {
            if (val === undefined || val === "" || isNaN(Number(val))) return undefined;
            return Number(val);
          });
        return optValidator;
      }

      let validator = z.coerce.number();

      if (validation?.min !== undefined) {
        validator = validator.min(
          validation.min,
          `${label} tối thiểu là ${validation.min}`
        );
      }

      if (validation?.max !== undefined) {
        validator = validator.max(
          validation.max,
          `${label} tối đa là ${validation.max}`
        );
      }

      return validator;
    }

    case "currency": {
      if (!required) {
        return z
          .union([z.string(), z.number()])
          .optional()
          .transform((val) => parseCurrencyVND(val));
      }

      const validator = z
        .union([z.string(), z.number()])
        .refine(
          (val) => {
            const parsed = parseCurrencyVND(val);
            return parsed > 0;
          },
          { message: `Vui lòng nhập số tiền ${label.toLowerCase()}` }
        )
        .transform((val) => parseCurrencyVND(val));

      return validator;
    }

    case "date": {
      if (!required) {
        return z.string().optional().or(z.literal(""));
      }
      return z.string().min(1, `Vui lòng chọn ${label.toLowerCase()}`);
    }

    case "select":
    case "radio": {
      if (!required) {
        return z.string().optional().or(z.literal(""));
      }
      return z.string().min(1, `Vui lòng chọn ${label.toLowerCase()}`);
    }

    case "checkbox": {
      if (required) {
        return z.boolean().refine((val) => val === true, {
          message: `Vui lòng tích xác nhận ${label.toLowerCase()}`,
        });
      }
      return z.boolean().default(false);
    }

    default:
      return z.any();
  }
}
