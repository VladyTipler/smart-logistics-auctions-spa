import { render, screen } from "@testing-library/react";

import { App } from "@/app/app.component";

it("renders the application shell", async () => {
  render(<App />);

  expect(await screen.findByRole("main")).toBeInTheDocument();
});
