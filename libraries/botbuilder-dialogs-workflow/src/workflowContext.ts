﻿// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Activity, ResourceResponse, TurnContext } from 'botbuilder-core';
import { TaskResultSettings, TaskResultConverter } from './tasks/replayPolicy';
import { WorkflowTask } from './workflowTask';
import { Jsonify, JsonValue } from 'type-fest';



/**
 * Utility type used to define a function type that discards its result.
 */
export type DiscardResult<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

/**
 * Context object passed in to a `Workflow` generator.
 *
 * @param O (Optional) type of options passed to the workflow dialog in the call to `DialogContext.beginDialog()`.
 */
export interface WorkflowContext<O extends object = {}>  {

    /**
     * Gets whether the workflow is replaying.
     */
    get isReplaying(): boolean;

    /**
     * Gets the initial information that was passed to the [Dialog](xref:botbuilder-dialogs.Dialog).
     */
    get options(): O;

    /**
     * Gets the ID that uniquely identifies the channel. Set by the channel.
     */
    get channelId(): string;

    /**
     * Gets the ID of the workflow dialog
     */
    get workflowId(): string;

    /**
     * Gets the current date/time in a way that is safe for use in workflows
     * @returns The current date/time.
     * @remarks
     * It always returns the same value at specific points in the workflow function code, 
     * making it deterministic and safe for replay.
     */
    get currentUtcTime(): Date;

    /**
     * Creates a new GUID in a way that is safe for use in workflows
     * @returns The new GUID.
     * @remarks
     * It always returns the same value at specific points in the workflow function code, 
     * making it deterministic and safe for replay.
     */
    newGuid(): string;

    /**
     * Invokes the given task.
     * 
     * @param task The asyncronous task to invoke.
     * @returns The 'WorkflowTask' for the invocation .
     */
    call<T>(
        task: (context: TurnContext) => Promise<T>
    ): WorkflowTask<T>; 

    /**
     * Acquires a bearer token from the user and invokes the given task.
     * 
     * @param oauthDialogId ID of the oauth dialog used to sign-in the user if needed.
     * @param task The asyncronous task to invoke.
     * @returns The 'WorkflowTask' for the invocation .
     */
    callAsUser<T>(
        oauthDialogId: string, 
        task: (token: string, context: TurnContext) => Promise<T>
    ): WorkflowTask<T>; 

    /**
     * Shows a dialog to the user.
     * 
     * @param dialogId ID of the dialog to show.
     * @returns The 'WorkflowTask' for the invocation .
     */
    prompt<T = any>(
        dialogId: string, 
        options?: object
    ): WorkflowTask<T>; 

    /**
     * Sends a message to the user.
     * 
     * @param activityOrText The activity or text to send.
     * @param speak Optional. The text to be spoken by your bot on a speech-enabled channel.
     * @param inputHint Optional. Indicates whether your bot is accepting, expecting, or ignoring user
     *      input after the message is delivered to the client. One of: 'acceptingInput', 'ignoringInput',
     *      or 'expectingInput'. Default is 'acceptingInput'.
     * @returns A ResourceResponse.
     * @remarks
     * For example:
     * ```JavaScript
     * yield *context.sendActivity(`Hello World`).execute();
     * ```
     *
     * **See also**
     *
     * - [sendActivities](xref:botbuilder-core.TurnContext.sendActivity)
     */
    sendActivity(
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string,
    ): WorkflowTask<ResourceResponse|undefined>;        


    /**
     * Waits to receive an event from the user.
     * 
     * @returns The 'WorkflowTask' for the invocation .
     */
    receiveActivity(): WorkflowTask<Activity>;

    /**
     * Restarts the workflow.
     * 
     * @param options Optional, initial information to pass to the [Dialog](xref:botbuilder-dialogs.Dialog).
     * @returns The 'WorkflowTask' for the invocation .
     */
    restart(options?: O): WorkflowTask<never>;

    /**
     * Binds a non-deterministic function to the workflow.
     * 
     * @param mode The binding mode.
     * @param func The function to bind.
     * @returns The bound function which is safe for use in workflows.
     */
    bind<T extends (...args: any[]) => any>(
        func: T
    ): (...args: Parameters<T>) => Jsonify<ReturnType<T>>;


    /**
     * Binds a non-deterministic function to the workflow.
     * 
     * @param mode The binding mode.
     * @param func The function to bind.
     * @param convert The converter to use for the function result.
     * @returns The bound function which is safe for use in workflows.
     */
    bind<T extends (...args: any[]) => any, O>(
        func: T,
        convert: TaskResultConverter<Jsonify<ReturnType<T>>, O>
    ): (...args: Parameters<T>) => O;

    /**
     * Binds a non-deterministic function to the workflow.
     * 
     * @param mode The binding mode.
     * @param func The function to bind.
     * @param settings The settings to use for the function result.
     * @returns The bound function which is safe for use in workflows.
     */
    bind<T extends (...args: any[]) => any, P extends JsonValue, O>(
        func: T,
        settings: TaskResultSettings<ReturnType<T>, P, O>
    ): (...args: Parameters<T>) => O;
}
