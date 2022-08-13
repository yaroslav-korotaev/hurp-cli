import type {
  Options,
  PluginSpec,
} from './types';

export type PluginFactory<C> = <O extends Options>(spec: PluginSpec<C, O>) => PluginSpec<C, O>;

export function createPlugin<C>(): PluginFactory<C> {
  return spec => spec;
}
