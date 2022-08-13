export type Type = 'string' | 'boolean' | 'number' | 'array';
export type Value = string | boolean | number | string[];

export type Argv = string[];
export type Env = { [key: string]: string | undefined };

export type Rest = {
  _: string[];
  __: string[];
};

export type Args = {
  [key: string]: Value;
};

export type ParsedArgs = Rest & Args;

export type OptionTypeDef<T extends Type, V extends Value> = {
  type: T;
  default?: V;
  validate?: (value: V) => boolean;
  description?: string;
  required?: boolean;
};

export type Option =
  | OptionTypeDef<'string', string>
  | OptionTypeDef<'boolean', boolean>
  | OptionTypeDef<'number', number>
  | OptionTypeDef<'array', string[]>
;

export type Options = Record<string, Option>;

export type InferOptionTypeInner<O extends Option> =
  O extends { type: 'string' } ? string :
  O extends { type: 'boolean' } ? boolean :
  O extends { type: 'number' } ? number :
  O extends { type: 'array' } ? string[] :
  unknown
;

export type InferOptionType<O extends Option> =
  O extends { required: true } ? InferOptionTypeInner<O> :
  InferOptionTypeInner<O> | undefined
;

export type InferArgs<O extends Options> = {
  [K in keyof O]: InferOptionType<O[K]>;
};

export type NodeRef = {
  name: string;
  default?: boolean;
  usage?: string;
  description?: string;
  options: Options;
  children?: NodeRef[];
};

export type CommandRef = {
  name: string;
  default?: boolean;
  description?: string;
  options: Options;
};

export type Next = () => Promise<void>;
export type Middleware<C, A> = (ctx: C, args: A, next: Next, node: NodeRef) => Promise<void>;
export type Handler<C, A> = (ctx: C, args: Rest & A) => Promise<void>;

export type PluginSpec<C, O extends Options> = {
  recursive?: boolean;
  options?: O;
  middleware: Middleware<C, InferArgs<O>>;
};

export type NodeSpec<C> = {
  name: string;
  default?: boolean;
  usage?: string;
  description?: string;
  plugins?: PluginSpec<C, any>[];
};

export type GroupSpec<C> = NodeSpec<C> & {
  children: (GroupSpec<any> | CommandSpec<any, any>)[];
};

export type CommandSpec<C, O extends Options> = NodeSpec<C> & {
  options?: O;
  handler: Handler<C, InferArgs<O>>;
};
