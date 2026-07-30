import { Toast } from "@base-ui/react/toast";

export type AppToastData = {
  tone: "error" | "success";
};

export const appToastManager = Toast.createToastManager<AppToastData>();

type ShowAppToastOptions = {
  description: string;
  id: string;
  title: string;
  tone: AppToastData["tone"];
};

export function showAppToast({
  description,
  id,
  title,
  tone,
}: ShowAppToastOptions) {
  appToastManager.add({
    data: { tone },
    description,
    id,
    // The form error is already the urgent alert. The toast is a second,
    // polite channel, so assistive technology does not announce it twice.
    priority: "low",
    timeout: 5_000,
    title,
  });
}
