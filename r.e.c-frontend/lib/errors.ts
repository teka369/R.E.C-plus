type ApiErrorPayload = {
  message?: string | string[];
};

type ApiErrorLike = {
  message?: string;
  response?: {
    data?: ApiErrorPayload;
  };
};

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as ApiErrorLike;
    const payloadMessage = candidate.response?.data?.message;
    if (Array.isArray(payloadMessage) && payloadMessage.length > 0) {
      return payloadMessage.join(", ");
    }
    if (typeof payloadMessage === "string" && payloadMessage.trim().length > 0) {
      return payloadMessage;
    }
    if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
      return candidate.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
