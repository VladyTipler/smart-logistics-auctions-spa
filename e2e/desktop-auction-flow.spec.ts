import { expect, test } from "@playwright/test";

const auctionUuid = "11111111-1111-4111-8111-111111111111";

test("filters an auction, opens its detail, places a bid, and sees the synchronized history", async ({
  page,
}) => {
  await page.goto("/auctions");

  await page.getByRole("textbox", { name: "Номер груза" }).fill("SL-1001");
  await page.getByRole("button", { name: "Применить фильтры" }).click();

  await expect(page).toHaveURL(/cargoNum=SL-1001/);
  await expect(page.getByText("Найдено: 1")).toBeVisible();
  await expect(page.getByText("SL-1001", { exact: true })).toBeVisible();

  await page
    .getByRole("link", { name: /^Сделать ставку: SL-1001,/ })
    .click();
  await expect(page).toHaveURL(`/auctions/${auctionUuid}/bet`);

  await page.getByRole("link", { name: "К аукциону" }).click();
  await expect(page).toHaveURL(`/auctions/${auctionUuid}`);
  await expect(
    page.getByRole("heading", { name: "Аукцион SL-1001" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Сделать ставку" }).click();
  await expect(page).toHaveURL(`/auctions/${auctionUuid}/bet`);

  const price = page.getByRole("textbox", { name: "Сумма ставки" });
  await price.fill("31000");
  await page.getByRole("button", { name: "Сделать ставку" }).click();

  await expect(page.getByLabel("Ставка принята")).toBeVisible();

  await page.getByRole("link", { name: "К аукциону" }).click();
  await expect(page).toHaveURL(`/auctions/${auctionUuid}`);
  await expect(page.getByText("31 000 ₽", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Ваша ставка 31 000 ₽")).toBeVisible();

  await page.getByRole("link", { name: "Протокол торгов" }).click();
  await expect(page).toHaveURL(`/auctions/${auctionUuid}/bets`);
  await expect(
    page.getByRole("heading", { name: "История ставок SL-1001" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "31 000 ₽", exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("ООО Перевозчик").first()).toBeVisible();
});
