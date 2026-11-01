import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

// Farmers and admins change things while the buyer is on another screen.
// The first focus is skipped because the query has only just loaded. Pass enabled=false for a
// guest: refetch ignores a query's own enabled flag, and would send a signed-in request.
export const useRefreshOnFocus = (refetch: () => unknown, enabled = true) => {
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (enabled) refetch();
    }, [refetch, enabled])
  );
};
