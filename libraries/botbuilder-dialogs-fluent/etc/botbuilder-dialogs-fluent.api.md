## API Report File for "botbuilder-dialogs-fluent"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Activity } from 'botbuilder-core';
import { Choice } from 'botbuilder-dialogs';
import { Dialog } from 'botbuilder-dialogs';
import { DialogContext } from 'botbuilder-dialogs';
import { DialogReason } from 'botbuilder-dialogs';
import { DialogTurnResult } from 'botbuilder-dialogs';
import type { Jsonify } from 'type-fest';
import type { JsonValue } from 'type-fest';
import { PromptOptions } from 'botbuilder-dialogs';
import { ResourceResponse } from 'botbuilder-core';
import { TurnContext } from 'botbuilder-core';
import { ZodType } from 'zod';

// @public
export interface DialogFlowBoundCallable<A extends any[], R extends JsonValue> {
    (...args: A): R;
    project<T>(projector: (value: R) => T): (...args: A) => T;
}

// @public
export interface DialogFlowContext<O extends object = {}> {
    bind<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => Jsonify<ReturnType<T>>;
    call<T>(task: (context: TurnContext) => Promise<T>): DialogFlowTask<T>;
    callAsUser<T>(oauthDialogId: string, task: (token: string, context: TurnContext) => Promise<T>): DialogFlowTask<T>;
    callDialog<T = any>(dialogId: string, options?: object): DialogFlowTask<T>;
    get channelId(): string;
    get currentUtcTime(): Date;
    get dialogId(): string;
    get isReplaying(): boolean;
    newGuid(): string;
    get options(): O;
    prompt<T>(dialogId: string, promptOrOptions: string | Partial<Activity> | PromptOptions): DialogFlowTask<T>;
    prompt<T>(dialogId: string, promptOrOptions: string | Partial<Activity> | PromptOptions, choices: (string | Choice)[]): DialogFlowTask<T>;
    receiveActivity(): DialogFlowTask<Activity>;
    restart(options?: O): DialogFlowTask<never>;
    sendActivity(activityOrText: string | Partial<Activity>, speak?: string, inputHint?: string): DialogFlowTask<ResourceResponse | undefined>;
}

// @public
export class DialogFlowError extends Error {
    constructor(message: string);
}

// @public
export interface DialogFlowTask<R = any, O = Jsonify<R>> {
    configureRetry(shouldRetry: boolean): this;
    configureRetry(settings: RetrySettings): this;
    configureRetry(policy: RetryPolicy): this;
    get id(): string;
    get kind(): string;
    project<T>(projector: (value: Jsonify<R>) => T): DialogFlowTask<R, T>;
    project<T>(schema: ZodType<T>): DialogFlowTask<R, T>;
    result(): Generator<DialogFlowTask, O, O>;
    then<T>(continuation: (value: R, context: TurnContext) => T | Promise<T>): DialogFlowTask<T>;
}

// @public
export type ErrorFilter = (error: any) => boolean;

// @public
export function exponentialRetry(initialDelay: number, maxDelay: number): RetryDelay;

// @public
export class FluentDialog<O extends object = {}, T = any> extends Dialog<O> {
    constructor(dialogId: string, dialogFlow: (context: DialogFlowContext<O>) => Generator<DialogFlowTask, T>);
    // (undocumented)
    beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult>;
    // (undocumented)
    continueDialog(dc: DialogContext): Promise<DialogTurnResult>;
    // (undocumented)
    resumeDialog(dc: DialogContext, reason: DialogReason, result?: any): Promise<DialogTurnResult>;
    protected runWorkflow(dc: DialogContext, reason: DialogReason, result?: any): Promise<DialogTurnResult>;
}

// @public
export const immediateRetry: RetryDelay;

// @public
export function linearRetry(retryDelay: number): RetryDelay;

// @public
export const noRetry: RetryPolicy;

// @public
export const retryAny: ErrorFilter;

// @public
export type RetryDelay = (attempt: number) => number;

// @public
export type RetryPolicy = (error: any, attempt: number) => Promise<boolean>;

// @public
export function retryPolicy(settings: RetrySettings): RetryPolicy;

// @public
export interface RetrySettings {
    readonly errorFilter?: ErrorFilter;
    readonly maxAttempts: number;
    readonly retryDelay: RetryDelay;
}

// (No @packageDocumentation comment for this package)

```
