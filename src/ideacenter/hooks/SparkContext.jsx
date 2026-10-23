// Small shared state for the Idea Center: toasts, the open idea (details drawer) and a data version counter.
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const Ctx = createContext(null);

export function SparkProvider({ children }) {
  const [toastMsg, setToastMsg] = useState('');
  const [openId, setOpenId] = useState(null);
  const [version, setVersion] = useState(0);
  const timer = useRef(null);

  React.useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener('spark:data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('spark:data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(''), 3200);
  }, []);
  const openIdea = useCallback((id) => setOpenId(id), []);
  const closeIdea = useCallback(() => setOpenId(null), []);
  const bump = useCallback(() => setVersion((v) => v + 1), []); // tells lists to refetch after a change

  const value = useMemo(
    () => ({ toastMsg, toast, openId, openIdea, closeIdea, version, bump }),
    [toastMsg, toast, openId, openIdea, closeIdea, version, bump],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSpark = () => useContext(Ctx);
