declare module "mammoth" {
  export interface MammothOptions {
    styleMap?: string | string[];
    includeDefaultStyleMap?: boolean;
    convertImage?: any;
    ignoreEmptyParagraphs?: boolean;
  }

  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export function convertToHtml(
    input: { buffer: Buffer } | { path: string },
    options?: MammothOptions
  ): Promise<MammothResult>;

  export function extractRawText(
    input: { buffer: Buffer } | { path: string }
  ): Promise<MammothResult>;
}
