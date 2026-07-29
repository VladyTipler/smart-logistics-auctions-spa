import type { AuctionDetailViewModel } from "@/entities/auction/model/auction-detail.vm";

type AuctionOrganizerSectionProps = {
  organizer: AuctionDetailViewModel["organizer"];
};

export function AuctionOrganizerSection({
  organizer,
}: AuctionOrganizerSectionProps) {
  return (
    <section className="detail-section" aria-labelledby="organizer-title">
      <div className="detail-section__heading">
        <p>Заказчик</p>
        <h2 id="organizer-title">{organizer.name}</h2>
      </div>
      <div>
        {organizer.taxId ? (
          <p className="detail-organizer__tax-id">ИНН {organizer.taxId}</p>
        ) : null}
        {organizer.contacts.length ? (
          <address className="detail-organizer__contacts">
            {organizer.contacts.map((contact, index) => (
              <span key={`${contact.phone ?? "contact"}-${index}`}>
                {contact.name}
                {contact.name && contact.phone ? " · " : ""}
                {contact.phone}
              </span>
            ))}
          </address>
        ) : null}
      </div>
    </section>
  );
}
