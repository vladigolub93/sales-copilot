declare module 'papaparse' {
  export interface ParseError {
    message: string;
    row?: number;
    code?: string;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: Record<string, unknown>;
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    transformHeader?: (header: string) => string;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: ParseError) => void;
  }

  export const parse: <T>(input: File, config: ParseConfig<T>) => void;

  const Papa: {
    parse: typeof parse;
  };

  export default Papa;
}
