export function BetHistoryHidden() {
  return (
    <section
      className="bet-history-state bet-history-state--hidden"
      aria-labelledby="bet-history-hidden-title"
    >
      <p className="bet-history-state__code">Доступ ограничен</p>
      <h2 id="bet-history-hidden-title">История ставок скрыта</h2>
      <p>Организатор не показывает предложения участников этого аукциона.</p>
    </section>
  );
}
