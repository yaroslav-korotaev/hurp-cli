import yargs from 'yargs';
import type {
  Options,
  Handler,
  Node,
  Command,
  Group,
} from './types';
import { isCommand } from './helpers';

export type ExecuteOptions<C, S extends Options> = {
  options?: S;
  middleware?: Handler<C, S>;
  children: Node<C, any>[];
};

export async function execute<C, S extends Options>(
  argv: string[],
  ctx: C,
  options: ExecuteOptions<C, S>,
): Promise<void> {
  registerOptions(yargs, options.options);
  registerMiddleware(yargs, ctx, options.middleware);
  registerChildren(yargs, ctx, options.children);
  
  yargs
    .demandCommand()
    .help()
    .version()
    .strict(true)
    .wrap(Math.max(120, yargs.terminalWidth()))
  ;
  
  await yargs.parse(argv);
}

function registerOptions<S extends Options>(
  yargs: yargs.Argv,
  options: S | undefined,
): void {
  if (options) {
    const keys = Object.keys(options);
    
    for (const key of keys) {
      const option = options[key];
      
      yargs.option(key, {
        type: option.type,
        global: false,
      });
    }
  }
}

function registerMiddleware<C, S extends Options>(
  yargs: yargs.Argv,
  ctx: C,
  middleware: Handler<C, S> | undefined,
): void {
  if (middleware) {
    yargs.middleware(async (args: any) => {
      await middleware(ctx, args);
    });
  }
}

function registerChildren<C, S extends Options>(
  yargs: yargs.Argv,
  ctx: C,
  children: Node<C, any>[],
): void {
  for (const child of children) {
    if (isCommand(child)) {
      registerCommand(yargs, ctx, child);
    } else {
      registerGroup(yargs, ctx, child);
    }
  }
}

function registerCommand<C, S extends Options>(
  yargs: yargs.Argv,
  ctx: C,
  command: Command<C, S>,
): void {
  const names = (command.default) ? [command.name, '*'] : command.name;
  
  yargs.command({
    command: names,
    describe: command.description,
    builder: yargs => {
      registerOptions(yargs, command.options);
      
      return yargs;
    },
    handler: async (args: any) => await command.handler(ctx, args),
  });
}

function registerGroup<C, S extends Options>(
  yargs: yargs.Argv,
  ctx: C,
  group: Group<C, S>,
): void {
  yargs.command({
    command: group.name,
    describe: group.description,
    builder: yargs => {
      registerOptions(yargs, group.options);
      registerMiddleware(yargs, ctx, group.middleware);
      registerChildren(yargs, ctx, group.children);
      
      yargs
        .demandCommand()
      ;
      
      return yargs;
    },
    handler: () => {},
  });
}
