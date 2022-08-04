export type Option = {
  type: 'string' | 'boolean';
  default?: unknown;
  description?: string;
  required?: boolean;
};

export type Options = {
  [key: string]: Option;
};

export type InferOptionType<O extends Option> =
  O extends { type: 'string' } ? string :
  O extends { type: 'boolean' } ? boolean :
  unknown
;

export type Args<O extends Options> = {
  [K in keyof O]: InferOptionType<O[K]>;
};

export type Handler<C, O extends Options> = (ctx: C, args: Args<O>) => Promise<void>;

export type Node<C> = Group<C, any> | Command<C, any, any>;

export type Command<C, O extends Options, A extends Options> = {
  name: string;
  default?: boolean;
  description?: string;
  options?: O;
  args?: A;
  handler: Handler<C, O & A>;
};

export type Group<C, O extends Options> = {
  name: string;
  description?: string;
  options?: O;
  middleware?: Handler<C, O>;
  children: Node<C>[];
};
