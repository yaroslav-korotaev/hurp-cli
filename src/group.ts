import type {
  Env,
  ParsedArgs,
  GroupSpec,
} from './types';
import { Node } from './node';
import { Command } from './command';

export class Group extends Node {
  public children: Node[];
  
  constructor(spec: GroupSpec<any>) {
    super(spec);
    
    if (!this.usage) {
      this.usage = '[...options] <command>';
    }
    
    const recursivePlugins = this.plugins.filter(item => item.recursive);
    
    this.children = spec.children.map(item => {
      const { plugins, ...rest } = item;
      const injected = {
        plugins: [...plugins || [], ...recursivePlugins],
        ...rest,
      };
      
      if ('children' in injected) {
        return new Group(injected);
      } else {
        return new Command(injected);
      }
    });
  }
  
  protected override async executeAction(ctx: any, args: ParsedArgs, env?: Env): Promise<void> {
    const { _, __ } = args;
    const [command, ...rest] = _;
    
    let child: Node | undefined = undefined;
    
    if (command) {
      child = this.children.find(item => item.name == command);
      
      if (!child) {
        throw new Error(`unknown command '${command}'`);
      }
    } else {
      child = this.children.find(item => item.default);
      
      if (!child) {
        throw new Error('command required');
      }
    }
    
    const childArgv = (__.length == 0) ? rest : [...rest, '--', ...__];
    await child.execute(ctx, childArgv, env);
  }
}
