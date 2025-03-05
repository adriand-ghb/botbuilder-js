// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'node:assert';
import { SuspendWorkflowTask } from "./suspendWorkflowTask";
import { TaskResult } from './taskResult'
import { DialogTurnResult, DialogContext } from 'botbuilder-dialogs';
import { TurnContext } from 'botbuilder-core';
import { JsonValue } from 'type-fest';


/**
 * Represents a task that restarts the current workflow.
 */
export class RestartWorkflowTask extends SuspendWorkflowTask<never, never> {

    /**
     * Initializes a new RestartWorkflowTask instance.
     * @param options (Optional) The options to pass to the restarted workflow.
     */
    constructor(
        private readonly options?: object
    ) {
        super({
            toJson: () => assert.fail("Unexpected call"),
            fromJson: () => assert.fail("Unexpected call")
        });            
    }

    /**
     * @inheritdoc
     */
    override get kind(): string {
        return 'Restart';
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
    public override async onSuspend(
        dialogContext: DialogContext
    ): Promise<DialogTurnResult> {
        return dialogContext.replaceDialog(dialogContext.activeDialog!.id, this.options);
    }

    /**
     * @inheritdoc
     */
    public override onResume(
        turnContext: TurnContext, 
        result: any
    ): Promise<TaskResult<never>> {
        assert.fail("RestartWorkflowTask.onResume should never be called");
    }
}