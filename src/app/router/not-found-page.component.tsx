import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <section className="route-page" aria-labelledby="not-found-title">
      <p className="route-page__eyebrow">Ошибка 404</p>
      <h1 id="not-found-title">Страница не найдена</h1>
      <p className="route-page__description">
        Такой рабочей области нет или ссылка устарела.
      </p>
      <Link className="route-page__link" to="/auctions">
        Вернуться к аукционам
      </Link>
    </section>
  );
}
