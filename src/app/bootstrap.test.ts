import {
  bootstrapApplication,
  createUnhandledRequestPolicy,
} from "@/app/bootstrap";

describe("application bootstrap", () => {
  it("waits for the worker before rendering when mocks are enabled", async () => {
    let resolveWorker!: () => void;
    const workerStarted = new Promise<void>((resolve) => {
      resolveWorker = resolve;
    });
    const startWorker = vi.fn(() => workerStarted);
    const renderApp = vi.fn();
    const renderStartupError = vi.fn();

    const bootstrap = bootstrapApplication({
      shouldStartWorker: true,
      startWorker,
      renderApp,
      renderStartupError,
    });

    expect(startWorker).toHaveBeenCalledOnce();
    expect(renderApp).not.toHaveBeenCalled();

    resolveWorker();
    await bootstrap;

    expect(renderApp).toHaveBeenCalledOnce();
    expect(renderStartupError).not.toHaveBeenCalled();
  });

  it("skips the worker when mocks are disabled", async () => {
    const startWorker = vi.fn();
    const renderApp = vi.fn();

    await bootstrapApplication({
      shouldStartWorker: false,
      startWorker,
      renderApp,
      renderStartupError: vi.fn(),
    });

    expect(startWorker).not.toHaveBeenCalled();
    expect(renderApp).toHaveBeenCalledOnce();
  });

  it("renders the startup error without rendering the app when worker startup fails", async () => {
    const startupFailure = new Error("Service Worker unavailable");
    const renderApp = vi.fn();
    const renderStartupError = vi.fn();

    await expect(
      bootstrapApplication({
        shouldStartWorker: true,
        startWorker: vi.fn().mockRejectedValue(startupFailure),
        renderApp,
        renderStartupError,
      }),
    ).resolves.toBeUndefined();

    expect(renderApp).not.toHaveBeenCalled();
    expect(renderStartupError).toHaveBeenCalledOnce();
    expect(renderStartupError).toHaveBeenCalledWith(startupFailure);
  });
});

describe("unhandled request policy", () => {
  const applicationOrigin = "http://localhost:5173";

  function createPrint() {
    return {
      error: vi.fn(),
      warning: vi.fn(),
    };
  }

  it("reports unhandled application API requests as errors", () => {
    const print = createPrint();

    createUnhandledRequestPolicy(applicationOrigin)(
      new Request(`${applicationOrigin}/api/v1/auctions`),
      print,
    );

    expect(print.error).toHaveBeenCalledOnce();
    expect(print.warning).not.toHaveBeenCalled();
  });

  it.each([
    "https://fonts.example.com/font.woff2",
    `${applicationOrigin}/assets/application.js`,
  ])("silently bypasses %s", (requestUrl) => {
    const print = createPrint();

    createUnhandledRequestPolicy(applicationOrigin)(
      new Request(requestUrl),
      print,
    );

    expect(print.error).not.toHaveBeenCalled();
    expect(print.warning).not.toHaveBeenCalled();
  });

  it("warns for other unhandled same-origin requests", () => {
    const print = createPrint();

    createUnhandledRequestPolicy(applicationOrigin)(
      new Request(`${applicationOrigin}/health`),
      print,
    );

    expect(print.warning).toHaveBeenCalledOnce();
    expect(print.error).not.toHaveBeenCalled();
  });
});
