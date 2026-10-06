import { useEffect, useRef, useState } from 'react';
import { loadAppState, saveAppState } from '../services/storageService.js';

export function useAppData(key) {
  const [items, setItems] = useState(() => {
    const state = loadAppState();
    return state[key] || [];
  });

  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const current = loadAppState();
    if (current[key] !== items) {
      const nextState = { ...current, [key]: items };
      saveAppState(nextState);
    }
  }, [key, items]);

  return [items, setItems];
}

