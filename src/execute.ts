import yargs from 'yargs';
import type {
  Options,
  Handler,
  Node,
  Command,
  Group,
} from './types';
import { isCommand } from './helpers';

export type ExecuteOptions<C, O extends Options> = {
  options?: O;
  middleware?: Handler<C, O>;
  children: Node<C>[];
};

export async function execute<C, O extends Options>(
  argv: string[],
  ctx: C,
  options: ExecuteOptions<C, O>,
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

function registerOptions<O extends Options>(
  yargs: yargs.Argv,
  options: O | undefined,
): void {
  if (options) {
    const keys = Object.keys(options);
    
    for (const key of keys) {
      const option = options[key];
      
      yargs.option(key, {
        type: option.type,
        default: option.default,
        describe: option.description,
        demandOption: option.required,
      });
    }
  }
}

function registerArgs<A extends Options>(
  yargs: yargs.Argv,
  args: A | undefined,
): void {
  if (args) {
    const keys = Object.keys(args);
    
    for (const key of keys) {
      const arg = args[key];
      
      yargs.positional(key, {
        type: arg.type,
        default: arg.default,
        describe: arg.description,
        demandOption: arg.required,
      });
    }
  }
}

function registerMiddleware<C, O extends Options>(
  yargs: yargs.Argv,
  ctx: C,
  middleware: Handler<C, O> | undefined,
): void {
  if (middleware) {
    yargs.middleware(async (args: any) => {
      await middleware(ctx, args);
    });
  }
}

function registerChildren<C>(
  yargs: yargs.Argv,
  ctx: C,
  children: Node<C>[],
): void {
  for (const child of children) {
    if (isCommand(child)) {
      registerCommand(yargs, ctx, child);
    } else {
      registerGroup(yargs, ctx, child);
    }
  }
}

function registerCommand<C, O extends Options, A extends Options>(
  yargs: yargs.Argv,
  ctx: C,
  command: Command<C, O, A>,
): void {
  const names = (command.default) ? [command.name, '*'] : command.name;
  
  yargs.command({
    command: names,
    describe: command.description,
    builder: yargs => {
      registerOptions(yargs, command.options);
      registerArgs(yargs, command.args);
      
      return yargs;
    },
    handler: async (args: any) => await command.handler(ctx, args),
  });
}

function registerGroup<C, O extends Options>(
  yargs: yargs.Argv,
  ctx: C,
  group: Group<C, O>,
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
