import keys from 'lodash/keys';
import mapKeys from 'lodash/mapKeys';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { paramCase } from 'param-case';
import { camelCase } from 'camel-case';
import minimist from 'minimist';
import type {
  Value,
  Argv,
  Env,
  Args,
  ParsedArgs,
  Options,
  Next,
  PluginSpec,
  NodeSpec,
} from './types';

function isNumber(value: string | number): value is number {
  if (typeof value == 'number') {
    return true;
  }
  
  if (/^0x[0-9a-f]+$/i.test(value)) {
    return true;
  }
  
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(value);
}

function getDefaults(params: Options): Args {
  const result: Args = {};
  
  for (const [key, option] of Object.entries(params)) {
    if (option.default) {
      result[key] = option.default;
    }
  }
  
  return result;
}

function grabEnv(env: Env | undefined, params: Options): Args {
  const result: Args = {};
  
  if (env) {
    for (const envKey of keys(env)) {
      const paramKey = paramCase(envKey.toLowerCase());
      
      if (params[paramKey]) {
        const value = env[envKey];
        
        if (value) {
          result[paramKey] = value;
        }
      }
    }
  }
  
  return result;
}

function parseArgv(argv: Argv, params: Options): ParsedArgs {
  const string: string[] = ['_'];
  const boolean: string[] = [];
  const defaults: { [key: string]: null } = {};
  
  for (const [key, option] of Object.entries(params)) {
    if (option.type == 'boolean') {
      boolean.push(key);
      defaults[key] = null;
    } else {
      string.push(key);
    }
  }
  
  const args = minimist(argv, {
    string,
    boolean,
    default: defaults,
    stopEarly: true,
    '--': true,
  });
  
  for (const [key, option] of Object.entries(params)) {
    if (option.type == 'boolean' && args[key] == null) {
      delete args[key];
    }
  }
  
  return {
    _: args['_'],
    __: args['--']!,
    ...omit(args, ['_', '--']),
  };
}

function cook(args: Args, params: Options): Args {
  const result: Args = {};
  
  for (const key of keys(args)) {
    if (!params[key]) {
      throw new Error(`unknown option '${key}'`);
    }
  }
  
  for (const [key, option] of Object.entries(params)) {
    let value = args[key];
    
    if (value == undefined) {
      continue;
    }
    
    if (option.type == 'boolean') {
      if (typeof value == 'string') {
        value = value != 'false';
      }
    }
    
    if (option.type == 'number') {
      if (typeof value == 'string') {
        if (!isNumber(value)) {
          throw new Error(`option '${key}' must be a number`);
        }
        
        value = Number(value);
      }
    }
    
    if (option.type == 'array') {
      const array = value as string[];
      
      value = (Array.isArray(array)) ? array : [array];
    } else {
      if (Array.isArray(value)) {
        throw new Error(`option '${key}' must be specified only once`);
      }
    }
    
    if (option.validate) {
      const validate = option.validate as (value: Value) => boolean;
      
      if (!validate(value)) {
        throw new Error(`option '${key}' has invalid value`);
      }
    }
    
    result[key] = value;
  }
  
  return result;
}

export class Node {
  protected plugins: PluginSpec<any, any>[];
  
  public name: string;
  public default?: boolean;
  public usage?: string;
  public description?: string;
  public options: Options;
  
  constructor(spec: NodeSpec<any>) {
    const {
      name,
      default: d,
      usage,
      description,
    } = spec;
    
    this.name = name;
    this.default = d;
    this.usage = usage;
    this.description = description;
    this.options = {};
    
    this.plugins = spec.plugins || [];
    this.plugins.forEach(item => this.configure(item.options));
  }
  
  private parse(argv: Argv, env?: Env): ParsedArgs {
    const params = mapKeys(this.options, (value, key) => paramCase(key));
    
    const defaults = getDefaults(params);
    const vars = grabEnv(env, params);
    const { _, __, ...args } = parseArgv(argv, params);
    const raw = Object.assign({}, defaults, vars, args);
    const cooked = cook(raw, params);
    const result = { _, __, ...mapKeys(cooked, (value, key) => camelCase(key)) };
    
    return result;
  }
  
  protected configure(options: Options | undefined): void {
    Object.assign(this.options, options);
  }
  
  protected ensureRequiredOptions(args: Args, options: Options): void {
    for (const [key, option] of Object.entries(options)) {
      let value = args[key];
      
      if (option.required && value == undefined) {
        throw new Error(`option '${key}' is required`);
      }
    }
  }
  
  protected async executePlugins(ctx: any, args: ParsedArgs, next: Next): Promise<void> {
    const execute = async (i: number): Promise<void> => {
      if (i < this.plugins.length) {
        const plugin = this.plugins[i];
        const middleware = plugin.middleware;
        const middlewareArgs = pick(args, keys(plugin.options));
        
        this.ensureRequiredOptions(middlewareArgs, plugin.options || {});
        
        await middleware(ctx, middlewareArgs, async () => await execute(i + 1), this);
      } else {
        await next();
      }
    };
    
    await execute(0);
  }
  
  protected async executeAction(ctx: any, args: ParsedArgs, env?: Env): Promise<void> {
    // override
  }
  
  public async execute(ctx: any, argv: Argv, env?: Env): Promise<void> {
    const args = this.parse(argv, env);
    
    await this.executePlugins(ctx, args, async () => {
      await this.executeAction(ctx, args, env);
    });
  }
}
