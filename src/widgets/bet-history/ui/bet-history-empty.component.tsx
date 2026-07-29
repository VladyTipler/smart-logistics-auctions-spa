export function BetHistoryEmpty() {
  return (
    <section
      className="bet-history-state"
      aria-labelledby="bet-history-empty-title"
    >
      <p className="bet-history-state__code">Журнал · 00</p>
      <h2 id="bet-history-empty-title">Ставок пока нет</h2>
      <p>Первая ставка появится здесь после начала торгов.</p>
    </section>
  );
}
