import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect, type PropsWithChildren } from "react";

import {
  appToastManager,
  type AppToastData,
} from "@/shared/ui/toast/app-toast-manager";

function AppToastViewport() {
  const { toasts } = Toast.useToastManager<AppToastData>();

  return (
    <Toast.Portal>
      <Toast.Viewport
        className="app-toast-viewport"
        data-testid="app-toast-viewport"
      >
        {toasts.map((toast) => {
          const isError = toast.data?.tone === "error";

          return (
            <Toast.Root
              aria-label={String(toast.title)}
              className={`app-toast app-toast--${isError ? "error" : "success"}`}
              key={toast.id}
              toast={toast}
            >
              <span className="app-toast__icon" aria-hidden="true">
                {isError ? <CircleAlert size={20} /> : <CheckCircle2 size={20} />}
              </span>
              <Toast.Content className="app-toast__content">
                <Toast.Title className="app-toast__title" />
                <Toast.Description className="app-toast__description" />
              </Toast.Content>
              <Toast.Close className="app-toast__close" aria-label="Закрыть">
                <X size={16} aria-hidden="true" />
              </Toast.Close>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function AppToastProvider({ children }: PropsWithChildren) {
  useEffect(
    () => () => {
      appToastManager.close();
    },
    [],
  );

  return (
    <Toast.Provider toastManager={appToastManager}>
      {children}
      <AppToastViewport />
    </Toast.Provider>
  );
}
