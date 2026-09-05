export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "radio"
  | "checkbox";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldValidation {
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  pattern?: string;
  pattern_message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  default_value?: string | number | boolean;
}

export interface FormSchema {
  fields: FormField[];
}
