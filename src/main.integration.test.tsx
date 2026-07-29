const { configuredWorkerStart, emptyWorkerStart, render } = vi.hoisted(() => ({
  configuredWorkerStart: vi.fn().mockResolvedValue(undefined),
  emptyWorkerStart: vi.fn().mockResolvedValue(undefined),
  render: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
  createRoot: () => ({ render }),
}));

vi.mock("@/app/app.component", () => ({
  App: () => null,
}));

vi.mock("@/shared/api/mocks/browser", () => ({
  worker: { start: configuredWorkerStart },
}));

vi.mock("msw/browser", () => ({
  setupWorker: () => ({ start: emptyWorkerStart }),
}));

describe("development entry point", () => {
  it("starts the configured auction worker before rendering", async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import("./main");

    await vi.waitFor(() => {
      expect(configuredWorkerStart).toHaveBeenCalledOnce();
      expect(render).toHaveBeenCalledOnce();
    });
    expect(emptyWorkerStart).not.toHaveBeenCalled();
    expect(configuredWorkerStart).toHaveBeenCalledWith({
      onUnhandledRequest: expect.any(Function),
    });
    expect(
      configuredWorkerStart.mock.invocationCallOrder[0],
    ).toBeLessThan(render.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY);
  });
});
