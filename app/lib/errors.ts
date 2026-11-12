/** The `message` of a caught error, if it has one (Expo's errors are `Error`s; anything can be thrown). */
export const errorMessage = (error: unknown): string | undefined =>
  error instanceof Error ? error.message : undefined;
