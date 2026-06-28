type MockFn = (...args: any[]) => any;

export const mockDb = (): Record<string, any> => {
  const fn = (): MockFn => (() => {}) as MockFn;
  return {
    query: {
      profiles: { findFirst: fn() },
      tickets: { findFirst: fn(), findMany: fn() },
      messages: { findFirst: fn(), findMany: fn() },
      attachments: { findFirst: fn(), findMany: fn() },
    },
    insert: fn(),
    update: fn(),
    delete: fn(),
    select: fn(),
    transaction: fn(),
  };
};
