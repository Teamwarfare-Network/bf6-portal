// @ts-nocheck
// Module: foundation/bf6-utils/callback-handler -- CallbackHandler from bf6-portal-utils
//
// ATTRIBUTION: Inline of the CallbackHandler module from bf6-portal-utils by
// Michael De Luca (MIT License, (c) 2026). Original:
//   reference_implementations/reference_bf6PortalUtils/callback-handler/index.ts
// See logging.ts for the rationale and migration note.

// version: 1.0.0 (upstream)
namespace CallbackHandler {
    // Safely invokes a callback that may be sync or async, catching and logging errors.
    export function invoke<T extends (...args: any[]) => Promise<void> | void>(
        callback: T | undefined,
        args: Parameters<T>,
        errorContext: string,
        logging: Logging,
        logLevel: Logging.LogLevel = Logging.LogLevel.Error
    ): void {
        if (!callback) return;

        try {
            const result = callback(...args);

            if (result instanceof Promise) {
                result.catch((error: unknown) => {
                    logging.log(
                        `Error in async ${errorContext} ${callback.name ?? 'anonymous'} callback:`,
                        logLevel,
                        error
                    );
                });
            }
        } catch (error: unknown) {
            logging.log(`Error in sync ${errorContext} ${callback?.name ?? 'anonymous'} callback:`, logLevel, error);
        }
    }

    // Safely invokes a zero-arg callback; delegates to invoke().
    export function invokeNoArgs(
        callback: (() => Promise<void> | void) | undefined,
        errorContext: string,
        logging: Logging,
        logLevel: Logging.LogLevel = Logging.LogLevel.Error
    ): void {
        invoke(callback, [], errorContext, logging, logLevel);
    }
}
