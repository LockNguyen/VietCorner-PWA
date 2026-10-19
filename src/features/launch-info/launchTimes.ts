// The numbers of one launch, from what the browser recorded about it (Navigation and Resource Timing).
// Every time is in ms from when the browser began loading the page: iOS starting the app before that
// (the black screen) is not visible to a web page, so it is not here.
export type LaunchTimes = {
  savedHome: boolean; // the page came from the copy the service worker saved, not from the server
  pageArrived: number; // the page's first byte: server and network, or the saved copy
  filesRead: number; // the page and its code files read (DOM ready)
  tappable: number; // Home answers taps (React has taken over)
  allLoaded: number; // pictures too; 0 while still loading
  filesSaved: number; // code files taken from a saved copy
  filesDownloaded: number; // code files that came over the network
};

type Navigation = Pick<PerformanceNavigationTiming, "responseStart" | "domContentLoadedEventEnd" | "loadEventEnd">;
type Resource = Pick<PerformanceResourceTiming, "name" | "transferSize">;

export function launchTimes(navigation: Navigation, resources: Resource[], tappable: number, savedHome: boolean): LaunchTimes {
  const codeFiles = resources.filter((file) => file.name.includes("/_next/static/"));
  // transferSize 0: nothing crossed the network, so the file came from a saved copy.
  const filesSaved = codeFiles.filter((file) => file.transferSize === 0).length;
  return {
    savedHome,
    pageArrived: navigation.responseStart,
    filesRead: navigation.domContentLoadedEventEnd,
    tappable,
    allLoaded: navigation.loadEventEnd,
    filesSaved,
    filesDownloaded: codeFiles.length - filesSaved,
  };
}

// "1.27 s"; a dash for a moment that has not happened yet (0).
export function seconds(ms: number) {
  return ms > 0 ? `${(ms / 1000).toFixed(2)} s` : "—";
}
