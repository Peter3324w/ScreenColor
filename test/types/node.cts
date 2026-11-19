import { validateValues } from '../../lib/values.cjs';
import type { ControllerPayloads, NativeCommand } from '../../shared/types';

const values = validateValues(JSON.parse('{}') as unknown);
const toggle: ControllerPayloads['toggle'] = false;
const command: NativeCommand = { command: 'apply', values };
process.stdout.write(JSON.stringify({ command, toggle }));
// @ts-expect-error Electron/core code cannot assume a browser document.
document.querySelector('body');
// @ts-expect-error Applying the native effect needs the full five controls.
const incomplete: NativeCommand = { command: 'apply' };
void incomplete;
