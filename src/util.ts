export interface Log {
  debug(msg: string): void
  warn(msg: string): void
}

export const consoleLogger: Log = {
  debug(msg: string) {
    console.log(msg)
  },
  warn(msg: string) {
    console.warn(msg)
  }
}

export const silentLogger: Log = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debug(msg: string) {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(msg: string) {}
}
