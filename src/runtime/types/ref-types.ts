/// <reference lib="esnext.bigint" />

import { Pointer } from "./pointer";
import { AsLoaderRuntime } from "./runtime";

export interface Unsafe<T> {
  ptr: Pointer<T>;
  value: T;
}

export interface RefType<T> {
  isTypeFromArgument(arg: unknown): arg is T;
  isTypeFromReference<TExports extends AsLoaderRuntime>(
    exports: TExports,
    ptr: Pointer
  ): ptr is Pointer<T>;
  getRef<TExports extends AsLoaderRuntime>(
    exports: TExports,
    arg: T
  ): Pointer<T>;
  getValueFromRef<TExports extends AsLoaderRuntime>(
    exports: TExports,
    ptr: Pointer<T>
  ): T;
}

export interface UnsafeRefType<T> extends RefType<T> {
  getUnsafeValueFromRef<TExports extends AsLoaderRuntime>(
    exports: TExports,
    ptr: Pointer<T>
  ): Unsafe<T>;
}

export interface AsBindReturnTypes {
  readonly STRING: RefType<string>;
  readonly INT8ARRAY: UnsafeRefType<Int8Array>;
  readonly UINT8ARRAY: UnsafeRefType<Uint8Array>;
  readonly INT16ARRAY: UnsafeRefType<Int16Array>;
  readonly UINT16ARRAY: UnsafeRefType<Uint16Array>;
  readonly INT32ARRAY: UnsafeRefType<Int32Array>;
  readonly UINT32ARRAY: UnsafeRefType<Uint32Array>;
  readonly FLOAT32ARRAY: UnsafeRefType<Float32Array>;
  readonly FLOAT64ARRAY: UnsafeRefType<Float64Array>;
  readonly BIGINT64ARRAY: UnsafeRefType<BigInt64Array>;
  readonly BIGUINT64ARRAY: UnsafeRefType<BigUint64Array>;
  readonly I32ARRAY: RefType<number[]>;
  readonly I64ARRAY: RefType<bigint[]>;
  readonly STRINGARRAY: RefType<string[]>;
  readonly BOOLARRAY: RefType<boolean[]>;
  readonly I32ARRAYARRAY: RefType<number[][]>;
  readonly I64ARRAYARRAY: RefType<bigint[][]>;
  readonly STRINGARRAYARRAY: RefType<string[][]>;
  readonly BOOLARRAYARRAY: RefType<boolean[][]>;
  readonly NUMBER: "NUMBER";
}
