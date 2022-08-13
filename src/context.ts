import type {
  Options,
  GroupSpec,
  CommandSpec,
} from './types';

export type ContextFactory<C> = {
  extend: <NC>() => ContextFactory<C & NC>;
  group: (spec: GroupSpec<C>) => GroupSpec<C>;
  command: <O extends Options>(spec: CommandSpec<C, O>) => CommandSpec<C, any>;
  app: (spec: GroupSpec<C>) => GroupSpec<C>;
};

export function context<C>(): ContextFactory<C> {
  const self: ContextFactory<C> = {
    extend: () => self as any,
    group: spec => spec,
    command: spec => spec,
    app: spec => spec,
  };
  
  return self;
}
