import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPinOff } from "lucide-react";

type NotFoundStateProps = {
  description: string;
  eyebrow?: string;
  title: string;
};

export function NotFoundState({
  description,
  eyebrow = "Маршрут / 404",
  title,
}: NotFoundStateProps) {
  return (
    <section
      className="recovery-state recovery-state--not-found"
      aria-labelledby="not-found-title"
    >
      <div className="recovery-state__signal" aria-hidden="true">
        <span />
        <MapPinOff size={22} />
      </div>
      <p className="recovery-state__code">{eyebrow}</p>
      <h1 id="not-found-title">{title}</h1>
      <p className="recovery-state__description">{description}</p>
      <Link className="recovery-state__action" to="/auctions">
        <ArrowLeft size={16} aria-hidden="true" />
        Вернуться к аукционам
      </Link>
    </section>
  );
}
