/* eslint-disable @typescript-eslint/no-explicit-any */
export type NonPointerTypes = number | boolean | bigint;

export type Pointer<T = unknown> = number & { __brand: "pointer"; __type: T };
export type NullablePointer<T> = T extends undefined | null | void
  ? null
  : Pointer<T>;

export type PointerCast<T, E = NonPointerTypes> = T extends E
  ? T
  : T extends new (...args: any) => any
  ? PointerCastInstance<T, E>
  : T extends (...args: any) => any
  ? PointerCastFunction<T, E>
  : T extends any[]
  ? Pointer<PointerCastArray<T, E>>
  : T extends Record<string | symbol | number, any>
  ? Pointer<PointerCastObject<T, E>>
  : NullablePointer<T>;
export type PointerCastArray<T extends any[], E = NonPointerTypes> = {
  [K in keyof T]: PointerCast<T[K], E>;
};
export type PointerCastFunction<
  T extends (...args: any) => any,
  E = NonPointerTypes
> = T extends (...args: infer A) => infer R
  ? (...args: PointerCastArray<A, E>) => PointerCast<R, E>
  : never;
export type PointerCastObject<
  T extends Record<any, any>,
  E = NonPointerTypes
> = T extends Record<string | symbol | number, any>
  ? {
      [K in keyof T]: PointerCast<T[K], E>;
    }
  : never;
export type PointerCastInstance<
  T extends new (...args: any) => any,
  E = NonPointerTypes
> = T extends new (...args: any) => infer R
  ? T & {
      wrap(ptr: Pointer<PointerCastObject<R, E>>): PointerCastObject<R, E>;
    }
  : never;
