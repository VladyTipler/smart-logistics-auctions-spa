type BootstrapDependencies = {
  isDevelopment: boolean;
  startWorker: () => Promise<void>;
  renderApp: () => void;
  renderStartupError: (error: unknown) => void;
};

type UnhandledRequestPrint = {
  error: () => void;
  warning: () => void;
};

const assetPathPattern =
  /\.(?:avif|css|gif|html|ico|jpe?g|js|json|map|mjs|png|svg|ts|tsx|ttf|webp|woff2?)$/i;

function isApplicationAsset(url: URL) {
  return (
    assetPathPattern.test(url.pathname) ||
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/@react-refresh") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/src/")
  );
}

export async function bootstrapApplication({
  isDevelopment,
  startWorker,
  renderApp,
  renderStartupError,
}: BootstrapDependencies) {
  try {
    if (isDevelopment) {
      await startWorker();
    }

    renderApp();
  } catch (error) {
    renderStartupError(error);
  }
}

export function createUnhandledRequestPolicy(applicationOrigin: string) {
  return (request: Request, print: UnhandledRequestPrint) => {
    const url = new URL(request.url);

    if (
      url.origin === applicationOrigin &&
      url.pathname.startsWith("/api/")
    ) {
      print.error();
      return;
    }

    if (url.origin !== applicationOrigin || isApplicationAsset(url)) {
      return;
    }

    print.warning();
  };
}
