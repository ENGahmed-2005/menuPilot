import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs an async loader, exposing `{ data, loading, error, reload, setData }`.
 * The loader runs on mount and whenever `deps` change.
 *
 * `loaderRef` is assigned inside an effect (not during render) so the hook
 * stays compatible with the React Compiler / concurrent rendering rules.
 */
export function useAsync(loader, deps = [], { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const mounted = useRef(true);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err);
      return undefined;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;
    // The loader is read from the ref, so `deps` alone controls refetching.
    loaderRef.current = loader;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await loaderRef.current();
        if (!cancelled && mounted.current) setData(result);
      } catch (err) {
        if (!cancelled && mounted.current) setError(err);
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, reload: run };
}

export default useAsync;
