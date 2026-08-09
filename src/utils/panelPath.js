/**
 * Derives the panel URL path for a logged-in user.
 * @param {object} user - The logged-in user object (must have .role, .name or .username)
 * @returns {string} URL path e.g. '/admin/john', '/kitchen/chef1', '/waiter/waiter1'
 */
export const getPanelPath = (user) => {
  if (!user) return '/';
  const name = encodeURIComponent(
    (user.name || user.username || 'user').toLowerCase().replace(/\s+/g, '-')
  );
  if (user.role === 'chef') return `/kitchen/${name}`;
  if (user.role === 'waiter') return `/waiter/${name}`;
  if (user.role === 'cashier') return `/cashier/${name}`;
  if (user.role === 'admin') return `/admin/${name}`;
  return '/';
};
