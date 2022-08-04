import type {
  Options,
  Node,
  Command,
  Group,
} from './types';

export function isCommand<C>(node: Node<C>): node is Command<C, any, any> {
  return !!(node as any).handler;
}

export function forCommand<C>(): <O extends Options, A extends Options>(
  spec: Command<C, O, A>,
) => typeof spec {
  return spec => spec;
}

export function forGroup<C>(): <O extends Options>(
  spec: Group<C, O>,
) => typeof spec {
  return spec => spec;
}
