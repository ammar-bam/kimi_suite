export type ApiSuccess<T> = { ok: true; data: T };

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "BAD_INPUT"
  | "UPSTREAM"
  | "INTERNAL";

export type ApiError = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    retryAfter?: number;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
