import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Fantasy F1` : 'Fantasy F1';
  }, [title]);
}
