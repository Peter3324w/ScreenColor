window.screenColor?.action('toggle', true);
window.screenColor?.action('preset', 'filter-vivid');
window.screenColor?.action('reset');
window.screenColor?.action('preferences', { startup: false, minimizeToTray: true });
window.screenColor?.subscribe(state => { document.title = state.profileId ?? 'Custom'; });
// @ts-expect-error A toggle cannot accept an arbitrary string.
window.screenColor?.action('toggle', 'true');
// @ts-expect-error The profile action needs a profile ID.
window.screenColor?.action('preset');
// @ts-expect-error A profile ID cannot be a boolean.
window.screenColor?.action('preset', true);
// @ts-expect-error Support actions accept only fixed destination IDs.
window.screenColor?.action('openSupport', 'https://example.com');
// @ts-expect-error Renderer code cannot use Node process APIs.
process.exit(0);
// @ts-expect-error Renderer code cannot import Node with require.
require('node:fs');
