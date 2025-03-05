// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'node:assert';
import { SuspendWorkflowTask } from "./suspendWorkflowTask";
import { TaskResult } from './taskResult'
import { Jsonify, JsonValue } from 'type-fest';
import { DialogTurnResult, DialogContext } from 'botbuilder-dialogs';
import { TurnContext } from 'botbuilder-core';
import { convertFromJson } from "./replayPolicy";


/**
 * Represents a task that prompts the user for input.
 */
export class PromptTask extends SuspendWorkflowTask<any, JsonValue> {

    /**
     * Initializes a new PromptTask instance.
     * @param promptId The dialog ID of the prompt to invoke.
     * @param options (Optional) The prompt options.
     */
    constructor(
        private readonly promptId: string,
        private readonly options: object | undefined
    ) {
        super({
            toJson: () => assert.fail("Unexpected call"),
            fromJson: convertFromJson
        });
    }

    /**
     * @inheritdoc
     */
    override get kind(): string {
        return 'Prompt';
    }

    /**
     * @inheritdoc
     */
    public override get id(): string {
        return this.promptId;
    }

    /**
     * @inheritdoc
     */
    public override onSuspend(
        dialogContext: DialogContext
    ): Promise<DialogTurnResult> {
        return dialogContext.prompt(this.id, this.options);
    }

    /**
     * @inheritdoc
     */
    public override onResume(
        turnContext: TurnContext, 
        result: any
    ): Promise<TaskResult> {
        return Promise.resolve<TaskResult>({success: true, value: result});
    }
}
