import { Controller } from '../../lib/controller.cjs';
import { NativeBridge } from '../../lib/bridge.cjs';
declare const controller: Controller;
declare const bridge: NativeBridge;
controller.dispatch('toggle', true);
controller.dispatch('reset');
bridge.request({ command: 'reset' });
// @ts-expect-error The controller must retain correlated action payloads.
controller.dispatch('toggle', 'true');
// @ts-expect-error Profiles require a string ID.
controller.dispatch('preset', false);
// @ts-expect-error Native apply commands require validated color values.
bridge.request({ command: 'apply' });
