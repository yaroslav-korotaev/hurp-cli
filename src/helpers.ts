import type {
  Options,
  Node,
  Command,
  Group,
} from './types';

export function isCommand<C, S extends Options>(node: Node<C, S>): node is Command<C, S> {
  return !!(node as Command<C, S>).handler;
}

export function forCommand<C>(): <S extends Options>(spec: Command<C, S>) => typeof spec {
  return spec => spec;
}

export function forGroup<C>(): <S extends Options>(spec: Group<C, S>) => typeof spec {
  return spec => spec;
}
