/// <reference lib="esnext.bigint" />
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  NonPointerTypes,
  PointerCastFunction,
  PointerCast,
} from "./pointer";

export type BoundNonPointerTypes =
  | NonPointerTypes
  | string
  | number[]
  | bigint[]
  | string[]
  | boolean[]
  | number[][]
  | bigint[][]
  | string[][]
  | boolean[][]
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

export type BoundFunction<T extends (...args: any) => any> =
  PointerCastFunction<T, BoundNonPointerTypes>;

export type BoundExports<T extends Record<any, any>> = T extends Record<
  string | symbol | number,
  any
>
  ? {
      [K in keyof T]: T[K] extends (...args: any) => any
        ? BoundFunction<T[K]>
        : PointerCast<T[K], BoundNonPointerTypes>;
    }
  : never;
