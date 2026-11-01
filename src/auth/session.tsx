import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api, hasStoredSession, setSessionLostHandler, signOut } from '@/api/client';
import type { Profile } from '@/api/types';

// Everything that belongs to the signed-in user sits under this key, so it can all be dropped at
// once and the next person on this phone never sees it
export const PRIVATE_KEY = 'me';
export const PROFILE_KEY = [PRIVATE_KEY, 'profile'];

const useSessionState = () => {
  const queryClient = useQueryClient();
  // null until the stored token has been checked
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setSessionLostHandler(() => {
      setSignedIn(false);
      queryClient.removeQueries({ queryKey: [PRIVATE_KEY] });
    });
    // An unreadable keystore (e.g. after a device restore) just means signing in again
    hasStoredSession().then(setSignedIn, () => setSignedIn(false));
  }, [queryClient]);

  const profile = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => api<Profile>('/users/me'),
    enabled: signedIn === true,
  });

  return useMemo(
    () => ({
      signedIn,
      profile,
      onSignedIn: () => setSignedIn(true),
      signOut: async () => {
        await signOut();
        setSignedIn(false);
        queryClient.removeQueries({ queryKey: [PRIVATE_KEY] });
      },
    }),
    [signedIn, profile, queryClient]
  );
};

const SessionContext = createContext<ReturnType<typeof useSessionState> | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const session = useSessionState();
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export const useSession = () => {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession needs a SessionProvider');
  return session;
};
