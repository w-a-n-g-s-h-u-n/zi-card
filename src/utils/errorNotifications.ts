export const APP_ERROR_EVENT = "character-practice:error";

export type AppErrorEventPayload = {
  detail?: string;
  error: unknown;
  title?: string;
};

export function notifyAppError(error: unknown, title?: string, detail?: string) {
  window.dispatchEvent(
    new CustomEvent<AppErrorEventPayload>(APP_ERROR_EVENT, {
      detail: {
        detail,
        error,
        title,
      },
    }),
  );
}

export function isAppErrorEvent(event: Event): event is CustomEvent<AppErrorEventPayload> {
  return event.type === APP_ERROR_EVENT && "detail" in event;
}
