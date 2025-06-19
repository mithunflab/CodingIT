# Implementation Plan: Fix GitHub Import Type Error

This document outlines the plan to resolve the TypeScript type error occurring during the build process in the `app/api/projects/[projectId]/github-import/route.ts` file.

## 1. Problem Analysis

The build fails with a type error related to the `RouteContext` of the `POST` handler in the GitHub import route. The error message:

```
Type error: Type '{ __tag__: "POST"; __param_position__: "second"; __param_type__: GithubImportRouteContext; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
The types of '__param_type__.params' are incompatible between these types.
Type '{ projectId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]
```

This indicates that the TypeScript compiler is expecting the `params` object within the route's context to be a `Promise`, but it's being treated as a plain object `{ projectId: string; }`. This is a common issue with Next.js's type generation for dynamic routes, where the inferred types do not match the actual runtime structure.

## 2. Proposed Solution

The solution is to correct the type definition for the route's context to accurately reflect the structure of the `params` object. This will ensure that the TypeScript compiler understands the correct shape of the data and resolves the type mismatch.

## 3. Step-by-Step Implementation

1.  **Modify `GithubImportRouteContext` Type:**
    In the file `app/api/projects/[projectId]/github-import/route.ts`, the existing `GithubImportRouteContext` interface will be updated. The current definition is correct in its structure, but it seems there's a conflict with a globally inferred `RouteContext`. To avoid this, we will rename it and ensure it's correctly applied.

    The current interface is:
    ```typescript
    interface GithubImportRouteContext {
      params: {
        projectId: string;
      };
    }
    ```

    We will ensure this type is explicitly used in the `POST` function signature. No changes to the interface itself are needed, but we need to make sure it's being used correctly. The investigation shows the interface is defined correctly, but the error persists. This suggests the issue might be in how Next.js is interpreting the types.

    A common fix for this is to simplify the function signature and let Next.js infer the types, or to be more explicit in a way that doesn't conflict with Next.js's internal types.

2.  **Update the POST Function Signature:**
    We will modify the `POST` function signature in `app/api/projects/[projectId]/github-import/route.ts` to resolve the ambiguity.

    **Current Signature:**
    ```typescript
    export async function POST(
      request: NextRequest,
      context: GithubImportRouteContext
    ) {
    ```

    **Proposed Change:**
    We will adjust the signature to destructure the context parameter directly, which can help TypeScript resolve the types correctly.

    ```typescript
    export async function POST(
      request: NextRequest,
      { params }: { params: { projectId: string } }
    ) {
    ```
    This change bypasses the intermediate `GithubImportRouteContext` interface and defines the expected shape of the context object directly in the function signature. This is a robust way to handle type inference issues with Next.js route handlers.

## 4. Verification

After applying the code change, the `npm run build` command will be executed again. The build should complete successfully without any TypeScript errors, confirming that the issue has been resolved.
