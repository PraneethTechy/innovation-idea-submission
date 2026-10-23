// useCurrentUser() returns { id, name, email, role, dept, manager }, or null for a public visitor.
// Sign-in (Microsoft Entra ID) is NOT built here. In mock mode, a stand-in provider supplies the user.
// The real provider will fill the same shape from GET /me once the company sign-in is wired.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, isMock, mockAdapter } from '../api/ideaApi.js';

const Ctx = createContext({ user: null, ready: false, setMockUser: () => {} });

// Which mock user to start as. Set VITE_MOCK_ROLE to public | associate | reviewer | admin (default associate).
const START = { public: null, associate: 'priya', reviewer: 'arjun', admin: 'meera' };
const startId = START[import.meta.env.VITE_MOCK_ROLE || 'associate'] ?? 'priya';

export function CurrentUserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try { setUser(await api.getMe()); } catch { setUser(null); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (isMock) mockAdapter._setCurrentUser(startId);
    load();
  }, [load]);

  // A 401 from the server means the session ended: drop to public. (The real flow will send them to sign-in.)
  useEffect(() => {
    const h = () => setUser(null);
    window.addEventListener('spark:unauthorized', h);
    return () => window.removeEventListener('spark:unauthorized', h);
  }, []);

  // Used only by the dev role switcher (never in a production build).
  const setMockUser = useCallback(async (id) => {
    if (!isMock) return;
    mockAdapter._setCurrentUser(id);
    await load();
  }, [load]);

  const value = useMemo(() => ({ user, ready, setMockUser }), [user, ready, setMockUser]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCurrentUser = () => useContext(Ctx).user;
export const useUserControls = () => useContext(Ctx);
