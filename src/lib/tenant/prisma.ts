/**
 * tenantDb(tenantId) is the ONLY safe way to query tenant-scoped data.
 *
 * NEVER import the raw prisma client in:
 *   - src/app/api/** (except webhooks/, auth/, signup/, admin/)
 *   - src/app/(tenant)/**
 *
 * Doing so is a P0 data leak bug. ESLint will fail the build if you try.
 */

import { prisma } from "@/lib/prisma"
import { TENANT_SCOPED_MODELS } from "./tenant-scoped-models"

type TenantScopedClient = ReturnType<typeof createTenantClient>

/**
 * Asserts tenantId is a non-empty string. Throws if undefined, null, or empty.
 */
export function assertTenantId(id: string | null | undefined): asserts id is string {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    throw new Error("tenantDb called with empty tenantId — this is a bug. Check that the request has x-tenant-id header set by middleware.")
  }
}

function createTenantClient(tenantId: string) {
  return prisma.$extends({
    name: "tenantScope",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
            if (process.env.TENANT_DB_DEBUG === "1") console.log(`[tenantDb] ${model}.findMany tenantId=${tenantId}`)
          }
          return query(args)
        },
        async findFirst({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
            if (process.env.TENANT_DB_DEBUG === "1") console.log(`[tenantDb] ${model}.findFirst tenantId=${tenantId}`)
          }
          return query(args)
        },
        async findUnique({ model, args, query }) {
          // findUnique uses unique keys — Prisma won't allow extra where fields.
          // We verify post-fetch that the row belongs to the correct tenant.
          // This is safe because the caller can only read, not mutate, with findUnique.
          const result = await query(args)
          if (result && TENANT_SCOPED_MODELS.has(model) && (result as any).tenantId !== tenantId) {
            if (process.env.TENANT_DB_DEBUG === "1") console.log(`[tenantDb] ${model}.findUnique BLOCKED — row belongs to different tenant`)
            return null
          }
          return result
        },
        async findFirstOrThrow({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
        async findUniqueOrThrow({ model, args, query }) {
          const result = await query(args)
          if (result && TENANT_SCOPED_MODELS.has(model) && (result as any).tenantId !== tenantId) {
            throw new Error(`${model} not found`)
          }
          return result
        },
        async count({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
        async aggregate({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
        async groupBy({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
        async create({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            // Guard against mismatched tenantId in create data
            if ((args.data as any).tenantId && (args.data as any).tenantId !== tenantId) {
              throw new Error(`tenantDb create called with mismatched tenantId: expected ${tenantId}, got ${(args.data as any).tenantId}`)
            }
            args.data = { ...args.data, tenantId }
          }
          return query(args)
        },
        async createMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: any) => ({ ...d, tenantId }))
            } else {
              args.data = { ...args.data, tenantId }
            }
          }
          return query(args)
        },
        async update({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId } as any
          }
          return query(args)
        },
        async updateMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            // Always use AND to prevent accidental scope bypass
            args.where = { AND: [{ tenantId }, args.where || {}] } as any
          }
          return query(args)
        },
        async delete({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId } as any
          }
          return query(args)
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { AND: [{ tenantId }, args.where || {}] } as any
          }
          return query(args)
        },
        async upsert({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId } as any
            args.create = { ...args.create, tenantId }
          }
          return query(args)
        },
      },
    },
  })
}

const clientCache = new Map<string, TenantScopedClient>()

/**
 * Returns a Prisma client that automatically scopes all queries to the given tenant.
 * Feature code should ALWAYS use this — never the raw prisma client.
 */
export function tenantDb(tenantId: string): TenantScopedClient {
  assertTenantId(tenantId)
  let client = clientCache.get(tenantId)
  if (!client) {
    client = createTenantClient(tenantId)
    clientCache.set(tenantId, client)
    if (clientCache.size > 100) {
      const firstKey = clientCache.keys().next().value
      if (firstKey) clientCache.delete(firstKey)
    }
  }
  return client
}
