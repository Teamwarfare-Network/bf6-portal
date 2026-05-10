// @ts-nocheck
// Module: foundation/bf6-utils/logging -- Logging helper from bf6-portal-utils
//
// ATTRIBUTION: This file is a near-verbatim inline of the Logging module from
// bf6-portal-utils by Michael De Luca (MIT License, (c) 2026). The original npm
// package is https://github.com/deluca-mike/bf6-portal-utils. Inlined here
// because Conquest uses a flat bundle concatenation model and has not (yet)
// adopted the package. When we later migrate to `npm i -D bf6-portal-utils`,
// delete this file and import `Logging` from the package instead.
//
// Reference source:
//   reference_implementations/reference_bf6PortalUtils/logging/index.ts
//
// Local adaptations:
//   - Removed `export` keyword so the class/namespace merge into the bundle's
//     global scope alongside other Conquest modules.
//   - Removed cross-module imports (none needed here).
//
// See bf6-portal\dev\conquest\design_doc\vanilla_spawner_rewrite_attempt_d.md
// for the rationale behind bringing this utility into the tree.

// version: 1.0.2 (upstream)
class Logging {
    constructor(tag: string) {
        this._tag = tag;
    }

    private _tag: string;

    private _logLevel: Logging.LogLevel = Logging.LogLevel.Info;

    private _includeError: boolean = false;

    private _logger?: (text: string) => Promise<void> | void;

    // Safely converts an error of unknown type to a string; never throws.
    private _safeErrorToString(error: unknown): string {
        try {
            if (error instanceof Error) {
                try {
                    return error.message || 'Error';
                } catch {
                    return 'Error (message unavailable)';
                }
            }
            try {
                return String(error);
            } catch {
                return '[Error object]';
            }
        } catch {
            return '[Unable to stringify error]';
        }
    }

    // Cheap gate so callers can skip building expensive log strings.
    public willLog(logLevel: Logging.LogLevel): boolean {
        return this._logger !== undefined && logLevel >= this._logLevel;
    }

    public log(text: string, logLevel: Logging.LogLevel = Logging.LogLevel.Warning, error?: unknown): void {
        if (!this._logger || logLevel < this._logLevel) return;

        try {
            const errorText = this._includeError && error ? ` - Error: ${this._safeErrorToString(error)}` : '';
            const result = this._logger(`<${this._tag}> ${text}${errorText}`);

            if (result instanceof Promise) {
                result.catch((e) => {
                    console.log(`<${this._tag}> Error in async logger:`, e);
                });
            }
        } catch (e: unknown) {
            console.log(`<${this._tag}> Error in sync logger:`, e);
        }
    }

    // Attaches a logger and configures verbosity.
    public setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        this._logger = log;
        this._logLevel = logLevel ?? Logging.LogLevel.Warning;
        this._includeError = includeError ?? false;
    }
}

namespace Logging {
    export enum LogLevel {
        Debug = 0,
        Info = 1,
        Warning = 2,
        Error = 3,
    }
}
