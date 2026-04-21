import { Prisma, PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { TENANT_SCOPED_MODELS } from "./tenant-scoped-models"

// CRITICAL: this is the ONLY safe way to query tenant-scoped data.
// Using the raw prisma client in feature code is a P0 data leak bug.

type TenantScopedClient = ReturnType<typeof createTenantClient>

function createTenantClient(tenantId: string) {
  return prisma.$extends({
    name: "tenantScope",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
        async findFirst({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
        async findUnique({ model, args, query }) {
          // findUnique uses unique fields so we can't inject tenantId into where
          // but we verify after fetch that it belongs to the tenant
          const result = await query(args)
          if (result && TENANT_SCOPED_MODELS.has(model) && (result as any).tenantId !== tenantId) {
            return null // tenant mismatch — treat as not found
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
            args.where = { ...args.where, tenantId }
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
            args.where = { ...args.where, tenantId }
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
  let client = clientCache.get(tenantId)
  if (!client) {
    client = createTenantClient(tenantId)
    clientCache.set(tenantId, client)
    // Prevent unbounded cache growth
    if (clientCache.size > 100) {
      const firstKey = clientCache.keys().next().value
      if (firstKey) clientCache.delete(firstKey)
    }
  }
  return client
}
