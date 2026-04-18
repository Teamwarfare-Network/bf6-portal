// @ts-nocheck
// Module: foundation/bf6-utils/clocks -- Clocks from bf6-portal-utils
//
// ATTRIBUTION: Inline of the Clocks module from bf6-portal-utils by Michael
// De Luca (MIT License, (c) 2026). Original:
//   reference_implementations/reference_bf6PortalUtils/clocks/index.ts
// See logging.ts for the rationale and migration note.
//
// Depends on (within this folder): logging.ts, callback-handler.ts, timers.ts

// version: 1.0.0 (upstream)
namespace Clocks {
    const logging = new Logging('Clocks');

    export const LogLevel = Logging.LogLevel;

    // Attaches a logger and configures verbosity for Clocks internals.
    export function setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        logging.setLogging(log, logLevel, includeError);
    }

    export type ClockOptions = {
        onSecond?: (currentSeconds: number) => Promise<void> | void;
        onMinute?: (currentMinutes: number) => Promise<void> | void;
        onComplete?: () => Promise<void> | void;
    };

    export type CountUpOptions = ClockOptions & {
        timeLimitSeconds?: number;
    };

    export type CountDownOptions = ClockOptions;

    // Handles the "Elapsed Time Engine": tracking milliseconds passed while the
    // clock is in a Running state. Subclasses decide how to project that onto
    // their own `seconds` getter.
    abstract class BaseClock {
        private _isRunning: boolean = false;
        private _isComplete: boolean = false;
        private _timerId: number | undefined;
        private _tickQueued: boolean = false;

        // _accumulatedMs: Time gathered during previous running segments (before pauses).
        // _lastResumeTime: Date.now() timestamp when we last switched Paused -> Running.
        private _accumulatedMs: number = 0;
        private _lastResumeTime: number = 0;

        private _lastIntegerSecond: number | undefined;
        private _lastIntegerMinute: number | undefined;

        private _onSecond?: (s: number) => Promise<void> | void;
        private _onMinute?: (m: number) => Promise<void> | void;
        private _onComplete?: () => Promise<void> | void;

        private _round: (value: number) => number;

        constructor(round: (value: number) => number, options?: ClockOptions) {
            this._round = round;
            this._onSecond = options?.onSecond;
            this._onMinute = options?.onMinute;
            this._onComplete = options?.onComplete;
        }

        // Defers the _tick loop to the microtask queue, coalescing multiple
        // synchronous adjustments into a single tick.
        private _queueTick = (): void => {
            if (this._tickQueued) return;

            this._tickQueued = true;

            Promise.resolve().then(() => {
                this._tickQueued = false;
                this._tick();
            });
        };

        protected _getElapsedMilliseconds(): number {
            return this._isRunning ? this._accumulatedMs + (Date.now() - this._lastResumeTime) : this._accumulatedMs;
        }

        protected _getElapsedSeconds(): number {
            return this._getElapsedMilliseconds() / 1000;
        }

        protected _adjustElapsedTime(seconds: number): void {
            this._accumulatedMs += seconds * 1000;

            if (logging.willLog(LogLevel.Info)) {
                logging.log(`Adjusted elapsed time by ${seconds}s.`, LogLevel.Info);
            }

            this._queueTick();
        }

        protected abstract _checkCompletion(): boolean;

        // Main loop: calculates drift-corrected time and fires callbacks when
        // the rounded integer second/minute changes.
        private _tick = (): void => {
            if (this._isComplete) return;

            if (this._checkCompletion()) {
                this._isRunning = false;
                this._isComplete = true;
                CallbackHandler.invokeNoArgs(this._onComplete, 'onComplete', logging, LogLevel.Error);

                if (logging.willLog(LogLevel.Info)) {
                    logging.log(`Clock completed.`, LogLevel.Info);
                }
            }

            const currentSecondsInt = this._round(this.seconds);
            const currentMinutesInt = this._round(currentSecondsInt / 60);

            if (currentSecondsInt !== this._lastIntegerSecond) {
                this._lastIntegerSecond = currentSecondsInt;
                CallbackHandler.invoke(this._onSecond, [currentSecondsInt], 'onSecond', logging, LogLevel.Error);
            }

            if (currentMinutesInt !== this._lastIntegerMinute) {
                this._lastIntegerMinute = currentMinutesInt;
                CallbackHandler.invoke(this._onMinute, [currentMinutesInt], 'onMinute', logging, LogLevel.Error);
            }

            Timers.clear(this._timerId);
            this._timerId = undefined;

            if (this._isRunning) {
                // Schedule next tick at the next whole-second boundary to resist drift.
                this._timerId = Timers.setTimeout(this._tick, 1000 - (this._getElapsedMilliseconds() % 1000));
            }
        };

        public abstract get seconds(): number;
        public abstract addSeconds(seconds: number): this;
        public abstract subtractSeconds(seconds: number): this;

        public get isRunning(): boolean {
            return this._isRunning;
        }

        public get isPaused(): boolean {
            return !this.isRunning && !this._isComplete;
        }

        public get isComplete(): boolean {
            return this._isComplete;
        }

        public start(): this {
            if (this._isRunning || this._isComplete) return this;

            this._isRunning = true;
            this._lastResumeTime = Date.now();
            this._queueTick();

            if (logging.willLog(LogLevel.Info)) {
                logging.log(`Clock started.`, LogLevel.Info);
            }

            return this;
        }

        public stop(): this {
            if (!this._isRunning) return this;

            this._isRunning = false;

            Timers.clear(this._timerId);
            this._timerId = undefined;

            this._accumulatedMs += Date.now() - this._lastResumeTime;
            this._queueTick();

            if (logging.willLog(LogLevel.Info)) {
                logging.log(`Clock stopped.`, LogLevel.Info);
            }

            return this;
        }

        public resume(): this {
            return this.start();
        }

        public pause(): this {
            return this.stop();
        }

        public reset(): this {
            this.stop();

            this._isComplete = false;
            this._accumulatedMs = 0;
            this._lastIntegerSecond = undefined;
            this._lastIntegerMinute = undefined;

            return this;
        }
    }

    // Starts at 0 and counts up. Fires onComplete when `timeLimitSeconds` is reached.
    export class CountUpClock extends BaseClock {
        private _timeLimit: number;

        constructor(options?: CountUpOptions) {
            // Math.floor: when counting up, the integer only ticks over when the value crosses an integer boundary going up.
            super(Math.floor, options);
            this._timeLimit = options?.timeLimitSeconds ?? 86400;
        }

        protected _checkCompletion(): boolean {
            return this.seconds >= this._timeLimit;
        }

        public get timeLimit(): number {
            return this._timeLimit;
        }

        public get seconds(): number {
            return this.isComplete ? this._timeLimit : Math.min(this._timeLimit, this._getElapsedSeconds());
        }

        public addSeconds(seconds: number): this {
            this._adjustElapsedTime(seconds);
            return this;
        }

        public subtractSeconds(seconds: number): this {
            this._adjustElapsedTime(-seconds);
            return this;
        }
    }

    // Starts at the given duration and counts down to 0.
    export class CountDownClock extends BaseClock {
        private _duration: number;

        constructor(durationSeconds: number, options?: CountDownOptions) {
            // Math.ceil: when counting down, the integer only ticks over when the value crosses an integer boundary going down.
            super(Math.ceil, options);
            this._duration = durationSeconds;
        }

        protected _checkCompletion(): boolean {
            return this.seconds <= 0;
        }

        public get duration(): number {
            return this._duration;
        }

        public get seconds(): number {
            return this.isComplete ? 0 : Math.max(0, this._duration - this._getElapsedSeconds());
        }

        public addSeconds(seconds: number): this {
            this._adjustElapsedTime(-seconds);
            return this;
        }

        public subtractSeconds(seconds: number): this {
            this._adjustElapsedTime(seconds);
            return this;
        }

        public setDuration(durationSeconds: number): this {
            this._duration = durationSeconds;
            return this;
        }
    }
}
