export function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
  } catch {
    // fall through to the manual implementation below
  }

  const hex = (n: number) => {
    let out = ""
    for (let i = 0; i < n; i++) {
      try {
        out += ((crypto as unknown as { getRandomValues: (a: Uint8Array) => Uint8Array }).getRandomValues(new Uint8Array(1))[0] ?? 0)
          .toString(16)
          .padStart(2, "0")
      } catch {
        out += Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, "0")
      }
    }
    return out
  }

  return (
    `${hex(8)}-${hex(4)}-4${hex(3)}-${((Math.floor(Math.random() * 4) + 8).toString(16))}${hex(3)}-${hex(12)}`
  )
}