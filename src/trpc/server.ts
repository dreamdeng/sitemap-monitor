import "server-only";

import { cache } from "react";

import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(() => {
  return createTRPCContext({
    req: undefined as any,
    res: undefined as any,
    info: undefined as any,
  });
});

export const api = appRouter.createCaller(createContext());
