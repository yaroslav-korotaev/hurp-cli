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

export type Args<S extends Options> = {
  [K in keyof S]: InferOptionType<S[K]>;
};

export type Handler<C, S extends Options> = (ctx: C, args: Args<S>) => Promise<void>;

export type Node<C, S extends Options> = Group<C, S> | Command<C, S>;

export type Command<C, S extends Options> = {
  name: string;
  default?: boolean;
  description?: string;
  options?: S;
  handler: Handler<C, S>;
};

export type Group<C, S extends Options> = {
  name: string;
  description?: string;
  options?: S;
  middleware?: Handler<C, S>;
  children: Node<C, any>[];
};
