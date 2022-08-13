import type {
  ParsedArgs,
  Options,
  Handler,
  CommandSpec,
} from './types';
import { Node } from './node';

export class Command extends Node {
  private commandOptions: Options;
  
  public handler: Handler<any, any>;
  
  constructor(spec: CommandSpec<any, any>) {
    super(spec);
    
    const {
      options,
      handler,
    } = spec;
    
    this.commandOptions = options || {};
    this.configure(options);
    
    this.handler = handler;
  }
  
  protected override async executeAction(ctx: any, args: ParsedArgs): Promise<void> {
    this.ensureRequiredOptions(args, this.commandOptions);
    
    await this.handler(ctx, args);
  }
}
