// Types
declare type bool = boolean;
declare type i8 = number;
declare type i16 = number;
declare type i32 = number;
declare type isize = number;
declare type u8 = number;
declare type u16 = number;
declare type u32 = number;
declare type usize = number;
declare type f32 = number;
declare type f64 = number;

/** Special type evaluating the indexed access index type. */
declare type indexof<T extends unknown[]> = keyof T;
/** Special type evaluating the indexed access value type. */
declare type valueof<T extends unknown[]> = T[0];
