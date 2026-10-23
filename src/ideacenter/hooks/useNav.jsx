// Navigation hook based on history.pushState. Supports root and role-based routes.
import { useSyncExternalStore } from 'react';

export const BASE = '';
const EVT = 'spark:navigate';

const strip = (p) => {
  let rest = p;
  if (rest.startsWith('/ideas')) {
    rest = rest.slice('/ideas'.length) || '/';
  }
  return rest.replace(/\/+$/, '') || '/';
};

export function navigate(to, state = null) {
  const target = to === '' ? '/' : to;
  if (window.location.pathname !== target) window.history.pushState(state, '', target);
  else window.history.replaceState(state, '', target);
  window.dispatchEvent(new Event(EVT));
  window.scrollTo(0, 0);
}

function subscribe(cb) {
  window.addEventListener('popstate', cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(EVT, cb);
  };
}

export function usePath() {
  return strip(useSyncExternalStore(subscribe, () => window.location.pathname, () => '/'));
}

export const getNavState = () => window.history.state;

// Link that keeps navigation inside the app and still works with "open in new tab".
export function A({ to, children, onClick, state, ...rest }) {
  const href = to === '' ? '/' : to;
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.(e);
        navigate(to, state);
      }}
    >
      {children}
    </a>
  );
}
