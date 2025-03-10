// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Activity, ResourceResponse, TurnContext } from 'botbuilder-core';
import { DialogFlowTask } from './dialogFlowTask';
import { Jsonify, JsonValue } from 'type-fest';



/**
 * Context object passed in to a dialog flow generator function.
 *
 * @param O (Optional) type of options passed to the fluent dialog in the call to `DialogContext.beginDialog()`.
 */
export interface DialogFlowContext<O extends object = {}>  {

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
     * Gets the ID of the fluent dialog
     */
    get dialogId(): string;

    /**
     * Gets the current date/time in a way that is safe for use in fluent dialog flows.
     * @returns The current date/time.
     * @remarks
     * It always returns the same value at specific points in the dialog flow function, 
     * making it deterministic and safe for replay.
     */
    get currentUtcTime(): Date;

    /**
     * Creates a new GUID in a way that is safe for use in fluent dialog flows
     * @returns The new GUID.
     * @remarks
     * It always returns the same value at specific points in the dialog flow function, 
     * making it deterministic and safe for replay.
     */
    newGuid(): string;

    /**
     * Invokes the given asyncronous function.
     * 
     * @template T (Optional) type of the result returned by the asynchronous function.
     * @param task The asyncronous function to invoke.
     * @returns The task instance which will yield the call result.
     */
    call<T>(
        task: (context: TurnContext) => Promise<T>
    ): DialogFlowTask<T>; 

    /**
     * Acquires a bearer token from the user and invokes the asynchronous function.
     * 
     * @template T (Optional) type of the result returned by the asynchronous function.
     * @param oauthDialogId ID of the oauth dialog used to sign-in the user if needed.
     * @param task The asyncronous function to invoke.
     * @returns The task instance which will yield the call result.
     */
    callAsUser<T>(
        oauthDialogId: string, 
        task: (token: string, context: TurnContext) => Promise<T>
    ): DialogFlowTask<T>; 

    /**
     * Runs a child dialog.
     * 
     * @template T (Optional) type of the dialog result.
     * @param dialogId ID of the dialog to run.
     * @returns The task instance which will yield the dialog result.
     */
    callDialog<T = any>(
        dialogId: string, 
        options?: object
    ): DialogFlowTask<T>; 

    /**
     * Sends a message to the user.
     * 
     * @param activityOrText The activity or text to send.
     * @param speak Optional. The text to be spoken by your bot on a speech-enabled channel.
     * @param inputHint Optional. Indicates whether your bot is accepting, expecting, or ignoring user
     *      input after the message is delivered to the client. One of: 'acceptingInput', 'ignoringInput',
     *      or 'expectingInput'. Default is 'acceptingInput'.
     * @returns The task instance which will yield a ResourceResponse.
     * @remarks
     * For example:
     * ```JavaScript
     * yield *context.sendActivity(`Hello World`).result();
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
    ): DialogFlowTask<ResourceResponse|undefined>;        


    /**
     * Waits to receive an event from the user.
     * 
     * @returns The task instance which will yield the received activity.
     */
    receiveActivity(): DialogFlowTask<Activity>;

    /**
     * Restarts the dialog flow.
     * 
     * @param options Optional, initial information to pass to the [Dialog](xref:botbuilder-dialogs.Dialog).
     * @returns The task instance.
     */
    restart(options?: O): DialogFlowTask<never>;

    /**
     * Binds a non-deterministic function to the dialog flow.
     * 
     * @param func The function to bind.
     * @returns The bound function which is safe for use in the dialog flow.
     * @remarks
     * The returned function will always returns the same value at specific points
     * in the dialog flow function, making it deterministic and safe for replay.
     */
    bind<T extends (...args: any[]) => any>(
        func: T
    ): (...args: Parameters<T>) => Jsonify<ReturnType<T>>;

}
