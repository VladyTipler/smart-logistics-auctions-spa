export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Умная Логистика">
          <span className="brand__mark" aria-hidden="true">
            УЛ
          </span>
          <span className="brand__name">Умная Логистика</span>
        </a>
        <span className="app-header__context">Аукционы</span>
      </header>

      <main className="app-main">
        <section className="dispatch-intro" aria-labelledby="page-title">
          <p className="dispatch-intro__eyebrow">Диспетчерская перевозчика</p>
          <h1 id="page-title">Аукционы грузов</h1>
          <p className="dispatch-intro__description">
            Маршруты, условия и ставки — в одной рабочей области.
          </p>

          <div className="route-line" aria-hidden="true">
            <span className="route-line__point" />
            <span className="route-line__track" />
            <span className="route-line__point route-line__point--destination" />
          </div>
        </section>
      </main>
    </div>
  );
}
