import { useCallback, useEffect, useRef, useState } from 'react';
import { asMessage } from '../api/errors.js';

// Runs an async function and tracks loading / error / data. Re-runs when `deps` change or reload() is called.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ data: s.data, loading: true, error: null }));
    fnRef.current().then(
      (data) => alive && setState({ data, loading: false, error: null }),
      (err) => alive && setState({ data: null, loading: false, error: asMessage(err) }),
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  // Lets a caller show a fresher value straight away (for example the idea the server just returned).
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);
  return { ...state, reload, setData };
}
