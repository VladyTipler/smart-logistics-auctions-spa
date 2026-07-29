import type { AuctionDetailViewModel } from "@/entities/auction/model/auction-detail.vm";

type AuctionPaymentSectionProps = {
  payment: AuctionDetailViewModel["payment"];
};

export function AuctionPaymentSection({
  payment,
}: AuctionPaymentSectionProps) {
  return (
    <section className="detail-section" aria-labelledby="payment-title">
      <div className="detail-section__heading">
        <p>Расчёт</p>
        <h2 id="payment-title">Условия оплаты</h2>
      </div>
      <dl className="detail-facts">
        <div>
          <dt>Форма</dt>
          <dd>{payment.form}</dd>
        </div>
        {payment.delayLabel ? (
          <div>
            <dt>Отсрочка</dt>
            <dd>{payment.delayLabel}</dd>
          </div>
        ) : null}
        {payment.condition ? (
          <div>
            <dt>Условие</dt>
            <dd>{payment.condition}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
