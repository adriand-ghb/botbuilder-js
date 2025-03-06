// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SuspendWorkflowTask } from "./suspendWorkflowTask";
import { TaskResult } from './taskResult'
import { Jsonify, JsonValue } from 'type-fest';
import { DialogTurnResult, DialogContext } from 'botbuilder-dialogs';
import { TokenResponse, TurnContext } from 'botbuilder-core';
import { TaskResultSettings } from "./replayPolicy";

/**
 * Represents a task that invokes a delegate with the interactive user's token.
 * @template R The task's execution result type
 * @template P The task's persisted execution result type.
 * @template O The task's observable execution result type.
 */
export class UserWorkflowTask<R, P extends JsonValue = Jsonify<R>, O=P> extends SuspendWorkflowTask<R, P, O> {

    /**
     * Initializes a new UserWorkflowTask instance.
     * @param oauthDialogId The dialog ID of the OAuth prompt to invoke.
     * @param invoke The delegate to invoke with the user token.
     * @param replaySettings - The settings used to configure the replay behavior.
     */
    constructor(
        private readonly oauthDialogId: string,
        private readonly invoke: (token: string, turnContext: TurnContext) => Promise<R>,
        replaySettings: TaskResultSettings<R, P, O>
    ) {
        super(replaySettings);
    }

    /**
     * @inheritdoc
     */
    override get kind(): string {
        return 'User';
    }

    /**
     * @inheritdoc
     */
    public override get id(): string {
        return `("${this.oauthDialogId}", ${this.invoke.toString()})`
    }

    /**
     * @inheritdoc
     */
    public override onSuspend(
        dialogContext: DialogContext
    ): Promise<DialogTurnResult> {
        return dialogContext.beginDialog(this.oauthDialogId);
    }


    /**
     * @inheritdoc
     */
    public override onResume(
        turnContext: TurnContext, 
        result?: TokenResponse
    ): Promise<TaskResult<P>> {
        return !(result) || !result.token ?
            Promise.resolve(this.failed("Login failed")) :
            this.applyRetryPolicy(this.invoke, result.token, turnContext);
    }

    /**
     * @inheritdoc
     */
    protected override clone(): this {
        return Object.assign(super.clone(), {
            oauthDialogId: this.oauthDialogId,
            invoke: this.invoke
        });
    }
}
