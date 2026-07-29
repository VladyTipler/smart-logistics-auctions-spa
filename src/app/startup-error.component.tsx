export function StartupError() {
  return (
    <main className="app-main">
      <section
        className="startup-error"
        role="alert"
        aria-labelledby="startup-error-title"
      >
        <p className="dispatch-intro__eyebrow">Запуск приложения</p>
        <h1 id="startup-error-title">Не удалось подготовить приложение</h1>
        <p>
          Локальный источник данных недоступен. Обновите страницу, чтобы
          повторить запуск.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Повторить запуск
        </button>
      </section>
    </main>
  );
}
