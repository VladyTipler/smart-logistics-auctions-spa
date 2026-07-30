import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useId } from "react";

import { ApiError } from "@/shared/api/api-error";

type ErrorStateProps = {
  error: unknown;
  onRetry: () => void;
  scope?: "auction-list" | "route";
};

type ErrorCopy = {
  code: string;
  description: string;
  title: string;
};

function copyForError(error: unknown, scope: ErrorStateProps["scope"]): ErrorCopy {
  if (error instanceof ApiError && error.status === 401) {
    return {
      code: "AUTH / 401",
      title: "Сессия завершена",
      description:
        scope === "auction-list"
          ? "Войдите снова, затем повторите загрузку аукционов."
          : "Войдите снова, затем повторите открытие рабочей области.",
    };
  }

  if (error instanceof ApiError && error.status === 503) {
    return {
      code: "SERVICE / 503",
      title:
        scope === "auction-list"
          ? "Не удалось загрузить аукционы"
          : "Сервис временно недоступен",
      description:
        "Автоматический повтор не помог. Запустите загрузку ещё раз.",
    };
  }

  if (error instanceof TypeError) {
    return {
      code: "NETWORK / OFFLINE",
      title: "Нет связи с сервисом",
      description:
        "Проверьте подключение к сети и повторите загрузку.",
    };
  }

  return {
    code: "SERVICE / ERROR",
    title:
      scope === "auction-list"
        ? "Не удалось загрузить аукционы"
        : "Не удалось открыть рабочую область",
    description:
      "Данные не изменены. Повторите загрузку; если ошибка сохранится, обновите страницу.",
  };
}

export function ErrorState({
  error,
  onRetry,
  scope = "route",
}: ErrorStateProps) {
  const copy = copyForError(error, scope);
  const titleId = useId();
  const Heading = scope === "route" ? "h1" : "h2";

  return (
    <section
      className="recovery-state recovery-state--error"
      aria-labelledby={titleId}
      role="alert"
    >
      <div className="recovery-state__signal" aria-hidden="true">
        <span />
        <AlertTriangle size={22} />
      </div>
      <p className="recovery-state__code">{copy.code}</p>
      <Heading id={titleId}>{copy.title}</Heading>
      <p className="recovery-state__description">{copy.description}</p>
      <button className="recovery-state__action" type="button" onClick={onRetry}>
        <RefreshCw size={16} aria-hidden="true" />
        Повторить загрузку
      </button>
    </section>
  );
}

export function RouteErrorState({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  const retry = () => {
    reset();
    void router.invalidate();
  };

  return <ErrorState error={error} onRetry={retry} />;
}
