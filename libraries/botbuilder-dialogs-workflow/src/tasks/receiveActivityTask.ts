// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'node:assert';
import { SuspendWorkflowTask } from "./suspendWorkflowTask";
import { TaskResult } from './taskResult'
import { Jsonify } from 'type-fest';
import { DialogTurnResult, DialogContext, Dialog } from 'botbuilder-dialogs';
import { Activity, TurnContext } from 'botbuilder-core';
import { convertFromJson, convertToJson } from "./replayPolicy";


/**
 * Represents a task that prompts the user for input.
 */
export class ReceiveActivityTask extends SuspendWorkflowTask<Activity> {

    /**
     * Initializes a new PromptTask instance.
     * @param promptId The dialog ID of the prompt to invoke.
     * @param options (Optional) The prompt options.
     */
    constructor() {
        super({
            toJson: convertToJson,
            fromJson: convertFromJson
        });
    }

    /**
     * @inheritdoc
     */
    override get kind(): string {
        return 'Wait';
    }

    /**
     * @inheritdoc
     */
    public override get id(): string {
        return '';
    }

    /**
     * @inheritdoc
     */
    public override onSuspend(
        dialogContext: DialogContext
    ): Promise<DialogTurnResult> {
        return Promise.resolve<DialogTurnResult>(Dialog.EndOfTurn);
    }

    /**
     * @inheritdoc
     */
    public override onResume(
        turnContext: TurnContext, 
        result: any
    ): Promise<TaskResult<Jsonify<Activity>>> {
        return super.onResume(turnContext, turnContext.activity);
    }
}
