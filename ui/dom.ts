export function query<E extends Element=HTMLElement>(selector: string,root: ParentNode=document): E {
  const element=root.querySelector<E>(selector);
  if(!element)throw new Error('Missing interface element: '+selector);
  return element;
}
export function all<E extends Element=HTMLElement>(selector: string,root: ParentNode=document): NodeListOf<E> {
  return root.querySelectorAll<E>(selector);
}
export function message(error: unknown): string { return error instanceof Error?error.message:String(error); }
