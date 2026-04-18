// @ts-nocheck
// Module: foundation/bf6-utils/timers -- Timers from bf6-portal-utils
//
// ATTRIBUTION: Inline of the Timers module from bf6-portal-utils by Michael
// De Luca (MIT License, (c) 2026). Original:
//   reference_implementations/reference_bf6PortalUtils/timers/index.ts
// See logging.ts for the rationale and migration note.

// version: 1.2.0 (upstream)
namespace Timers {
    const logging = new Logging('Timers');

    export const LogLevel = Logging.LogLevel;

    // Attaches a logger and configures verbosity for Timers internals.
    export function setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        logging.setLogging(log, logLevel, includeError);
    }

    const ACTIVE_IDS = new Set<number>();

    let nextId: number = 1;

    async function executeTimeout(id: number, callback: () => Promise<void> | void, ms: number): Promise<void> {
        await Promise.resolve();
        await mod.Wait(ms / 1_000);

        if (!ACTIVE_IDS.has(id)) return;

        ACTIVE_IDS.delete(id);

        CallbackHandler.invokeNoArgs(callback, `timeout ${id}`, logging, LogLevel.Error);
    }

    async function executeInterval(
        id: number,
        callback: () => Promise<void> | void,
        ms: number,
        immediate: boolean
    ): Promise<void> {
        await Promise.resolve();

        if (!immediate && ACTIVE_IDS.has(id)) {
            await mod.Wait(ms / 1_000);
        }

        do {
            if (!ACTIVE_IDS.has(id)) return;

            CallbackHandler.invokeNoArgs(callback, `interval ${id}`, logging, LogLevel.Error);

            if (!ACTIVE_IDS.has(id)) return;

            await mod.Wait(ms / 1_000);
        } while (true);
    }

    // Schedules a one-time execution after the specified delay (ms).
    export function setTimeout(callback: () => Promise<void> | void, ms: number): number {
        const id = nextId++;
        ACTIVE_IDS.add(id);

        executeTimeout(id, callback, ms < 0 ? 0 : ms);

        return id;
    }

    // Schedules a repeated execution at the specified interval (ms).
    export function setInterval(callback: () => Promise<void> | void, ms: number, immediate: boolean = false): number {
        const id = nextId++;
        ACTIVE_IDS.add(id);

        executeInterval(id, callback, ms < 0 ? 0 : ms, immediate);

        return id;
    }

    // Aliases for clearTimeout / clearInterval — both route to clear().
    export function clearTimeout(id: number | undefined | null): void {
        clear(id);
    }

    export function clearInterval(id: number | undefined | null): void {
        clear(id);
    }

    // Cancels a pending timeout/interval. Silently ignores null/undefined/unknown IDs.
    export function clear(id: number | undefined | null): void {
        if (id === undefined || id === null) return;

        ACTIVE_IDS.delete(id);
    }

    export function getActiveTimerCount(): number {
        return ACTIVE_IDS.size;
    }
}
