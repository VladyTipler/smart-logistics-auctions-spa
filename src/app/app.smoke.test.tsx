import { render, screen } from "@testing-library/react";

import { App } from "@/app/app.component";

it("renders the application shell", () => {
  render(<App />);

  expect(screen.getByRole("main")).toBeInTheDocument();
});
