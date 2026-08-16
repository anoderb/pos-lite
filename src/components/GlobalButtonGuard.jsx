'use client';

import { useEffect } from 'react';

const SPINNER = 'inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin align-middle shrink-0';

export default function GlobalButtonGuard() {
  useEffect(() => {
    const onClick = (event) => {
      const button = event.target.closest('button');
      if (!button || button.disabled || button.dataset.noLoading !== undefined) return;
      if (button.dataset.busy === 'true') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      button.dataset.busy = 'true';
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
      const icon = document.createElement('span');
      icon.className = SPINNER;
      icon.dataset.globalSpinner = 'true';
      icon.setAttribute('aria-hidden', 'true');
      button.prepend(icon);

      // Covers rapid double-clicks while allowing ordinary navigation/actions to finish.
      window.setTimeout(() => {
        icon.remove();
        button.disabled = false;
        button.dataset.busy = 'false';
        button.removeAttribute('aria-busy');
      }, 1200);
    };

    document.addEventListener('click', onClick, false);
    return () => document.removeEventListener('click', onClick, false);
  }, []);

  return null;
}
