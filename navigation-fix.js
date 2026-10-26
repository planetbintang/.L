(() => {
  'use strict';

  const header = document.querySelector('.topbar');
  if (!header) return;

  const menus = [...header.querySelectorAll('.nav-dropdown')];
  const setExpanded = (menu, open) => {
    const summary = menu.querySelector(':scope > summary');
    if (summary) summary.setAttribute('aria-expanded', String(open));
  };
  const closeOthers = (except) => menus.forEach((menu) => {
    if (menu !== except) {
      menu.open = false;
      setExpanded(menu, false);
    }
  });

  menus.forEach((menu) => {
    const summary = menu.querySelector(':scope > summary');
    const panel = menu.querySelector(':scope > .nav-dropdown-menu');
    if (!summary || !panel) return;

    summary.setAttribute('aria-haspopup', 'true');
    summary.setAttribute('aria-expanded', String(menu.open));

    // Use capture phase so theme scripts cannot swallow the native disclosure click.
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const shouldOpen = !menu.open;
      closeOthers(menu);
      menu.open = shouldOpen;
      setExpanded(menu, shouldOpen);
    }, true);

    menu.addEventListener('toggle', () => setExpanded(menu, menu.open));

    panel.addEventListener('click', (event) => {
      const actionable = event.target.closest('a, button');
      if (actionable) {
        // Let the route/sync handlers finish first; close on the next task.
        queueMicrotask(() => {
          menu.open = false;
          setExpanded(menu, false);
        });
      }
    });

    summary.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        if (event.key === 'ArrowDown') event.preventDefault();
        if (event.key === 'ArrowDown' && !menu.open) {
          closeOthers(menu);
          menu.open = true;
          setExpanded(menu, true);
          panel.querySelector('a, button')?.focus();
        }
      }
    });
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menu.open = false;
        setExpanded(menu, false);
        summary.focus();
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-dropdown')) closeOthers(null);
  });

  window.addEventListener('resize', () => {
    // Keep expanded state and layout in sync after orientation or viewport changes.
    menus.forEach((menu) => setExpanded(menu, menu.open));
  }, { passive: true });
})();
