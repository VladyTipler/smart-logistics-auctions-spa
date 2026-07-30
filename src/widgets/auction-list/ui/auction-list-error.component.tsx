type AuctionListErrorProps = {
  onRetry: () => void;
};

export function AuctionListError({ onRetry }: AuctionListErrorProps) {
  return (
    <div className="auction-list-state auction-list-state--error" role="alert">
      <p className="auction-list-state__code">ERR / LIST</p>
      <h2>Не удалось загрузить аукционы</h2>
      <p>Связь с сервисом прервалась. Проверьте соединение и повторите запрос.</p>
      <button type="button" onClick={onRetry}>
        Повторить загрузку
      </button>
    </div>
  );
}
