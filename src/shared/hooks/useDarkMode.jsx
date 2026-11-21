import { useEffect, useState } from 'react';
import { loadPrefs, savePref } from '@/shared/utils/secureStorage';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    return Boolean(loadPrefs().darkMode);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    savePref('darkMode', darkMode);
  }, [darkMode]);

  return [darkMode, () => setDarkMode(d => !d)];
}
