import { expect, test } from "@playwright/test";

const auctionUuid = "11111111-1111-4111-8111-111111111111";

test("filters in the drawer and places a bid through the sticky mobile action", async ({
  page,
}) => {
  await page.goto("/auctions");

  await page.getByRole("button", { name: "Фильтры" }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", {
      name: "Фильтры аукционов",
    }),
  ).toBeVisible();

  const drawer = page.getByRole("dialog");
  await drawer.getByRole("textbox", { name: "Номер груза" }).fill("SL-1001");
  await drawer.getByRole("button", { name: "Применить фильтры" }).click();

  await expect(page).toHaveURL(/cargoNum=SL-1001/);
  await expect(page.getByText("Найдено: 1")).toBeVisible();
  await expect(drawer).toBeHidden();

  await page
    .getByRole("link", { name: /^Сделать ставку: SL-1001,/ })
    .click();
  await page.getByRole("link", { name: "К аукциону" }).click();
  await expect(page).toHaveURL(`/auctions/${auctionUuid}`);

  const stickyAction = page.getByRole("link", { name: "Сделать ставку" });
  await expect(stickyAction).toBeVisible();
  await stickyAction.click();
  await expect(page).toHaveURL(`/auctions/${auctionUuid}/bet`);

  await page.getByRole("textbox", { name: "Сумма ставки" }).fill("31000");
  await page.getByRole("button", { name: "Сделать ставку" }).click();

  await expect(page.getByLabel("Ставка принята")).toBeVisible();
});
