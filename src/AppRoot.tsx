import { AlertTriangle, X } from "lucide-react";
import { Component, useCallback, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import App from "./App";
import { APP_ERROR_EVENT, isAppErrorEvent } from "./utils/errorNotifications";

type ErrorNotice = {
  id: number;
  message: string;
  title: string;
};

type AppErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: unknown, detail?: string) => void;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export function AppRoot() {
  const [notices, setNotices] = useState<ErrorNotice[]>([]);

  const notifyError = useCallback((error: unknown, title = "发生异常", detail?: string) => {
    const message = formatErrorMessage(error, detail);
    const id = Date.now() + Math.random();

    setNotices((current) => [
      { id, message, title },
      ...current.filter((notice) => notice.message !== message).slice(0, 2),
    ]);
  }, []);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      notifyError(event.error ?? event.message, "运行异常", getErrorEventLocation(event));
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      notifyError(event.reason, "异步异常");
    }

    function handleAppError(event: Event) {
      if (!isAppErrorEvent(event)) {
        return;
      }

      notifyError(event.detail.error, event.detail.title ?? "发生异常", event.detail.detail);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener(APP_ERROR_EVENT, handleAppError);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener(APP_ERROR_EVENT, handleAppError);
    };
  }, [notifyError]);

  return (
    <>
      <AppErrorBoundary onError={(error, detail) => notifyError(error, "页面异常", detail)}>
        <App />
      </AppErrorBoundary>
      <ErrorNoticeStack notices={notices} onDismiss={(id) => setNotices((current) => current.filter((notice) => notice.id !== id))} />
    </>
  );
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo.componentStack ?? undefined);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <main className="app-error-fallback" role="alert">
            <AlertTriangle aria-hidden="true" size={34} />
            <h1>页面发生异常</h1>
            <p>异常信息已显示在通知中，可刷新页面后继续。</p>
            <button type="button" onClick={() => window.location.reload()}>
              刷新页面
            </button>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

function ErrorNoticeStack({
  notices,
  onDismiss,
}: {
  notices: ErrorNotice[];
  onDismiss: (id: number) => void;
}) {
  if (notices.length === 0) {
    return null;
  }

  return (
    <section aria-label="异常通知" aria-live="assertive" className="global-error-stack">
      {notices.map((notice) => (
        <article className="global-error-notice" key={notice.id}>
          <AlertTriangle aria-hidden="true" size={20} />
          <div className="global-error-copy">
            <strong>{notice.title}</strong>
            <pre>{notice.message}</pre>
          </div>
          <button aria-label="关闭异常通知" className="global-error-dismiss" type="button" onClick={() => onDismiss(notice.id)}>
            <X aria-hidden="true" size={18} />
          </button>
        </article>
      ))}
    </section>
  );
}

function formatErrorMessage(error: unknown, detail?: string): string {
  const message = getErrorText(error);
  const trimmedDetail = detail?.trim();

  return trimmedDetail ? `${message}\n${trimmedDetail}` : message;
}

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error.trim() || "未知异常";
  }

  if (error === null || error === undefined) {
    return "未知异常";
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getErrorEventLocation(event: ErrorEvent): string | undefined {
  if (!event.filename) {
    return undefined;
  }

  return `${event.filename}:${event.lineno}:${event.colno}`;
}
