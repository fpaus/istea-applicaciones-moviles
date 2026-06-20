# AI SYSTEM INSTRUCTIONS: TypeScript Best Practices & Type Safety

This document defines the strict TypeScript coding standards across all repositories (Frontend and Backend). The goal is to maximize type safety, eliminate runtime type errors, and maintain a DRY (Don't Repeat Yourself) type system.

## 1. The "Zero Any" Policy

**FORBIDDEN:** You MUST NEVER use the `any` type.
**Rule:** If a type is truly unknown ahead of time (e.g., parsing a generic JSON payload), use `unknown`. You must then use Type Guards or validation libraries (like Typia) to narrow the type before accessing its properties.
**FORBIDDEN:** Do not use the non-null assertion operator (`!`) to silence compiler warnings (e.g., `user!.name`). Use optional chaining (`?.`) or explicitly check for null/undefined.
**FORBIDDEN:** Never use `@ts-ignore`. If a type error is genuinely a compiler limitation or third-party library flaw, use `@ts-expect-error` and append a descriptive comment explaining WHY it is needed.

```typescript
// DON'T:
const processPayload = (payload: any) => {
  console.log(payload.id);
};

// DO:
const processPayload = (payload: unknown) => {
  if (typeof payload === 'object' && payload !== null && 'id' in payload) {
    console.log((payload as { id: string }).id);
  }
};
```

## 2. DRY Types & Inference (Never Duplicate)

**FORBIDDEN:** Never manually recreate a type or interface that already exists or is a subset of an existing one.
**MANDATORY:** Always derive types from existing sources of truth using Utility Types (`Pick`, `Omit`, `Partial`, `Required`, `ReturnType`, `Parameters`).
**MANDATORY:** Infer types from runtime constants using `typeof` instead of writing redundant interfaces.

```typescript
// BASE SOURCE OF TRUTH
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// DON'T: Recreating a subset manually
export interface UpdateUserDto {
  name?: string;
  email?: string;
}

// DO: Deriving from the source of truth
export type UpdateUserDto = Partial<Pick<User, 'name' | 'email'>>;

// DO: Inferring from runtime objects
export const DEFAULT_CONFIG = { theme: 'dark', retries: 3 } as const;
export type Config = typeof DEFAULT_CONFIG;
```

## 3. Interfaces vs. Type Aliases

**Rule:** Use `interface` for declaring object shapes, data contracts (DTOs), and class implementations. Interfaces are slightly better for performance (caching) and support declaration merging.
**Rule:** Use `type` exclusively for Unions (`type Status = 'open' | 'closed'`), Intersections (`type A = B & C`), mapped types, and utility type results.

## 4. Enums vs. Const Assertions

**FORBIDDEN:** Do not use TypeScript `enum`. TypeScript enums generate unpredictable JavaScript boilerplate, allow reverse-mapping anomalies, and do not behave purely structurally.
**MANDATORY:** Use string literal Union Types or `as const` objects instead.

```typescript
// DON'T:
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// DO: Union Type (Preferred for simple strictly-typed parameters)
export type UserRole = 'ADMIN' | 'USER';

// DO: Const Object (If you need to iterate over the values at runtime)
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
```

## 5. Control Flow & Nullability

**Rule:** Always prefer Nullish Coalescing (`??`) over Logical OR (`||`) when assigning fallback values. `||` will incorrectly fallback on falsy values like `0`, `""`, or `false`, which can introduce severe logic bugs.
**Rule:** Prefer early returns to narrow types naturally. Avoid deeply nested `if` statements.

```typescript
// DON'T:
const limit = config.limit || 10; // Fails if config.limit is meant to be 0

// DO:
const limit = config.limit ?? 10; // Only falls back if limit is null or undefined
```

## 6. Return Types & Function Signatures

**MANDATORY:** Always explicitly declare the return type of a function or method, especially for exported functions and API endpoints. Do not rely on implicit return type inference for public contracts, as it can accidentally leak internal structures or cause massive generic compilation trees.

```typescript
// DON'T:
export const getUserStats = async (id: string) => {
  return db.user.find(id); // If DB schema changes, the exported signature changes silently
};

// DO:
export const getUserStats = async (id: string): Promise<UserStats> => {
  return db.user.find(id); // Compiler will catch DB schema changes immediately
};
```

## 7. AI Self-Correction Protocol (TypeScript)

Before finalizing any TypeScript code generation, the AI MUST silently verify:

1. Did I use `any` anywhere? -> **FAIL**. Replace with `unknown`, define the specific type, or use a generic `<T>`.
2. Did I manually type a property that already exists in a parent entity? -> **FAIL**. Use `Pick<Entity, 'prop'>`.
3. Did I use `enum`? -> **FAIL**. Convert it to a Union Type or `as const` dictionary.
4. Did I use `!` (non-null assertion) instead of proper type narrowing or `?.`? -> **FAIL**. Fix the conditional logic.
5. Does my exported function lack an explicit return type? -> **FAIL**. Add `: Type` or `: Promise<Type>`.
6. Did I use `||` for default values instead of `??`? -> **FAIL**. Change to Nullish Coalescing.
