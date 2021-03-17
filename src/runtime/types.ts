/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResultObject } from "@assemblyscript/loader";

interface AsLoaderModule<TModule> extends String {
  fallback?(): Promise<TModule>;
}

// TypeId<> would have to be implemented on the @assemblyscript/loader side to use nominal type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TypeId<T = unknown> = number; // & { __brand: "type-id"; __type: T };
type Pointer<T = unknown> = number & { __brand: "pointer"; __type: T };
type NullablePointer<T> = T extends undefined | null | void ? null : Pointer<T>;

type Pointerify<T> = T extends number | boolean | bigint
  ? T
  : T extends new (...args: any) => any
  ? PointerifyInstance<T>
  : T extends (...args: any) => any
  ? PointerifyFunction<T>
  : T extends any[]
  ? Pointer<PointerifyArray<T>>
  : T extends Record<string | symbol | number, any>
  ? Pointer<PointerifyObject<T>>
  : NullablePointer<T>;
type PointerifyArray<T extends any[]> = {
  [K in keyof T]: Pointerify<T[K]>;
};
type PointerifyFunction<T extends (...args: any) => any> = T extends (
  ...args: infer A
) => infer R
  ? (...args: PointerifyArray<A>) => Pointerify<R>
  : never;
type PointerifyObject<T extends Record<any, any>> = T extends Record<
  string | symbol | number,
  any
>
  ? {
      [K in keyof T]: Pointerify<T[K]>;
    }
  : never;
type PointerifyInstance<T extends new (...args: any) => any> = T extends new (
  ...args: any
) => infer R
  ? T & {
      wrap(ptr: Pointer<PointerifyObject<R>>): PointerifyObject<R>;
    }
  : never;

interface AsLoaderRuntime {
  memory?: WebAssembly.Memory;
  table?: WebAssembly.Table;

  /** Explicit start function, if requested. */
  _start(): void;

  /** Copies a string's value from the module's memory. */
  __getString(ptr: Pointer<string>): string;
  /** Copies an ArrayBuffer's value from the module's memory. */
  __getArrayBuffer(ptr: Pointer<ArrayBuffer>): ArrayBuffer;

  /** Copies an array's values from the module's memory. Infers the array type from RTTI. */
  __getArray<T extends number>(ptr: Pointer<T[]>): T[];
  /** Copies an Int8Array's values from the module's memory. */
  __getInt8Array(ptr: Pointer<Int8Array>): Int8Array;
  /** Copies an Uint8Array's values from the module's memory. */
  __getUint8Array(ptr: Pointer<Uint8Array>): Uint8Array;
  /** Copies an Uint8ClampedArray's values from the module's memory. */
  __getUint8ClampedArray(ptr: Pointer<Uint8ClampedArray>): Uint8ClampedArray;
  /** Copies an Int16Array's values from the module's memory. */
  __getInt16Array(ptr: Pointer<Int16Array>): Int16Array;
  /** Copies an Uint16Array's values from the module's memory. */
  __getUint16Array(ptr: Pointer<Uint16Array>): Uint16Array;
  /** Copies an Int32Array's values from the module's memory. */
  __getInt32Array(ptr: Pointer<Int32Array>): Int32Array;
  /** Copies an Uint32Array's values from the module's memory. */
  __getUint32Array(ptr: Pointer<Uint32Array>): Uint32Array;
  /** Copies an Int32Array's values from the module's memory. */
  __getInt64Array?(ptr: Pointer<BigInt64Array>): BigInt64Array;
  /** Copies an Uint32Array's values from the module's memory. */
  __getUint64Array?(ptr: Pointer<BigUint64Array>): BigUint64Array;
  /** Copies a Float32Array's values from the module's memory. */
  __getFloat32Array(ptr: Pointer<Float32Array>): Float32Array;
  /** Copies a Float64Array's values from the module's memory. */
  __getFloat64Array(ptr: Pointer<Float64Array>): Float64Array;

  /** Gets a live view on an array's values in the module's memory. Infers the array type from RTTI. */
  __getArrayView(ptr: Pointer<ArrayBufferView>): ArrayBufferView;
  /** Gets a live view on an Int8Array's values in the module's memory. */
  __getInt8ArrayView(ptr: Pointer<Int8Array>): Int8Array;
  /** Gets a live view on an Uint8Array's values in the module's memory. */
  __getUint8ArrayView(ptr: Pointer<Uint8Array>): Uint8Array;
  /** Gets a live view on an Uint8ClampedArray's values in the module's memory. */
  __getUint8ClampedArrayView(
    ptr: Pointer<Uint8ClampedArray>
  ): Uint8ClampedArray;
  /** Gets a live view on an Int16Array's values in the module's memory. */
  __getInt16ArrayView(ptr: Pointer<Int16Array>): Int16Array;
  /** Gets a live view on an Uint16Array's values in the module's memory. */
  __getUint16ArrayView(ptr: Pointer<Uint16Array>): Uint16Array;
  /** Gets a live view on an Int32Array's values in the module's memory. */
  __getInt32ArrayView(ptr: Pointer<Int32Array>): Int32Array;
  /** Gets a live view on an Uint32Array's values in the module's memory. */
  __getUint32ArrayView(ptr: Pointer<Uint32Array>): Uint32Array;
  /** Gets a live view on an Int32Array's values in the module's memory. */
  __getInt64ArrayView?(ptr: Pointer<BigInt64Array>): BigInt64Array;
  /** Gets a live view on an Uint32Array's values in the module's memory. */
  __getUint64ArrayView?(ptr: Pointer<BigUint64Array>): BigUint64Array;
  /** Gets a live view on a Float32Array's values in the module's memory. */
  __getFloat32ArrayView(ptr: Pointer<Float32Array>): Float32Array;
  /** Gets a live view on a Float64Array's values in the module's memory. */
  __getFloat64ArrayView(ptr: Pointer<Float64Array>): Float64Array;

  /** Tests whether a managed object is an instance of the class represented by the specified base id. */
  __instanceof<T>(ptr: Pointer, id: TypeId<T>): ptr is Pointer<T>;
  /** Allocates a new string in the module's memory and returns a reference (pointer) to it. */
  __newString(str: string): Pointer<string>;
  /** Allocates a new array in the module's memory and returns a reference (pointer) to it. */
  __newArray<T extends ArrayLike<T>>(id: number, values: T): Pointer<T>;

  /** Allocates an instance of the class represented by the specified id. */
  __new<T>(size: number, id: TypeId<T>): Pointer<T>;
  /** Pins a managed object externally, preventing it from becoming garbage collected. */
  __pin<T>(ptr: Pointer<T>): Pointer<T>;
  /** Unpins a managed object externally, allowing it to become garbage collected. */
  __unpin(ptr: Pointer): void;
  /** Performs a full garbage collection cycle. */
  __collect(incremental?: boolean): void;
}

interface WasmModuleInstance<TModule> extends ResultObject {
  type: "wasm";
  exports: AsLoaderRuntime & PointerifyObject<TModule>;
}
interface JsModuleInstance<TModule> {
  type: "js";
  exports: TModule;
}
type ModuleInstance<TModule> =
  | WasmModuleInstance<TModule>
  | JsModuleInstance<TModule>;

export {
  AsLoaderModule,
  AsLoaderRuntime,
  WasmModuleInstance,
  JsModuleInstance,
  ModuleInstance,
  Pointer,
  NullablePointer,
  Pointerify,
  PointerifyArray,
  PointerifyFunction,
  PointerifyObject,
  PointerifyInstance,
};
