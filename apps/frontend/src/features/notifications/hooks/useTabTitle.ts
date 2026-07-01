import { useEffect, useRef } from 'react';

import { useUnreadCount } from './useNotifications';

export function useTabTitle() {
  const { data } = useUnreadCount();
  const originalTitle = useRef(document.title);

  useEffect(() => {
    if (!originalTitle.current) {
      originalTitle.current = document.title;
    }
  }, []);

  useEffect(() => {
    const count = data?.count ?? 0;
    if (count > 0) {
      document.title = `(${count}) ${originalTitle.current}`;
    } else {
      document.title = originalTitle.current;
    }
  }, [data?.count]);
}
