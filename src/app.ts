import type { GroupSpec } from './types';
import { Group } from './group';

export function app(spec: GroupSpec<any>): Group {
  return new Group(spec);
}
