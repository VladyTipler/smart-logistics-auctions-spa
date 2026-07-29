import { render, screen } from "@testing-library/react";

import { StartupError } from "@/app/startup-error.component";

it("renders an accessible startup failure with a retry action", () => {
  render(<StartupError />);

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Не удалось подготовить приложение",
  );
  expect(
    screen.getByRole("button", { name: "Повторить запуск" }),
  ).toBeVisible();
});
