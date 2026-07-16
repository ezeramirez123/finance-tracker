"use client";

import * as React from "react";

/** Persists a hide/show toggle (e.g. for a balance figure) to localStorage under `storageKey`. */
export function useHiddenState(storageKey: string) {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    // Read after mount (not in a lazy initializer) so server and client render
    // the same markup on first paint; localStorage isn't available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(storageKey) === "true") setHidden(true);
  }, [storageKey]);

  function toggle() {
    setHidden((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return [hidden, toggle] as const;
}
