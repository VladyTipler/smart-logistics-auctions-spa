type AuctionListEmptyProps = {
  onReset: () => void;
};

export function AuctionListEmpty({ onReset }: AuctionListEmptyProps) {
  return (
    <div className="auction-list-state" role="status">
      <p className="auction-list-state__code">00 / 00</p>
      <h2>Подходящих аукционов нет</h2>
      <p>Измените условия поиска или вернитесь к полному списку.</p>
      <button type="button" onClick={onReset}>
        Сбросить фильтры
      </button>
    </div>
  );
}
