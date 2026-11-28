import type { SupportDestination } from '../shared/types';
const destinations: Readonly<Record<SupportDestination,string>>=Object.freeze({
  help:'https://peters-cave.vercel.app/help-me',
  apps:'https://peters-cave.vercel.app/',
  guide:'https://peters-cave.vercel.app/apps/screen-color',
  feedback:'https://peters-cave.vercel.app/feedback?app=screen-color',
  issues:'https://github.com/Peter3324w/app-feedback/issues?q=is%3Aissue+%22%5BScreen%20Color%5D%22+in%3Atitle'
});
export function supportDestination(id: unknown): SupportDestination {
  if(typeof id!=='string'||!Object.hasOwn(destinations,id))throw new Error('Unknown support destination.');
  return id as SupportDestination;
}
export function supportURL(id: unknown): string { return destinations[supportDestination(id)]; }
