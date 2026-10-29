// Global BigInt serializer for JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// Safe recursive fallback proxy for when Prisma / MySQL is not configured (MongoDB mode)
function createRecursiveProxy(targetFn: (...args: any[]) => any = () => Promise.resolve(null)): any {
  return new Proxy(targetFn, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop === 'toJSON') return () => ({});
      if (prop === 'toString') return () => '[PrismaClient MongoDB Fallback]';
      if (prop === '$connect' || prop === '$disconnect') {
        return () => Promise.resolve();
      }
      return createRecursiveProxy();
    },
    apply(_target, _thisArg, _argArray) {
      return Promise.resolve(null);
    },
  });
}

const fallbackProxy = createRecursiveProxy();

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

function getPrismaClient(): any {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // If no DATABASE_URL is provided, we operate exclusively in MongoDB mode
  if (!process.env.DATABASE_URL) {
    globalForPrisma.prisma = fallbackProxy;
    return fallbackProxy;
  }

  try {
    const { PrismaClient } = require('@prisma/client');
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    globalForPrisma.prisma = client;
    return client;
  } catch (err) {
    console.warn('[db] PrismaClient initialization skipped (using MongoDB fallback):', err);
    globalForPrisma.prisma = fallbackProxy;
    return fallbackProxy;
  }
}

// Resilient proxy so PrismaClient is never instantiated at module evaluation time
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (client === fallbackProxy) {
      return fallbackProxy[prop];
    }
    try {
      const val = client[prop];
      if (typeof val === 'function') {
        return val.bind(client);
      }
      return val;
    } catch {
      return fallbackProxy[prop];
    }
  },
});

export default prisma;
