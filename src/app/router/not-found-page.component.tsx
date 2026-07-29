import { NotFoundState } from "@/shared/ui/not-found-state/not-found-state.component";

export function NotFoundPage() {
  return (
    <NotFoundState
      description="Проверьте адрес или вернитесь к списку аукционов."
      eyebrow="Рабочая область / 404"
      title="Страница не найдена"
    />
  );
}
