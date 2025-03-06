// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SuspendWorkflowTask } from "./suspendWorkflowTask";
import { TaskResult } from './taskResult'
import { Jsonify, JsonValue } from 'type-fest';
import { DialogTurnResult, DialogContext } from 'botbuilder-dialogs';
import { TurnContext } from 'botbuilder-core';
import { TaskResultSettings } from "./replayPolicy";


/**
 * Represents a task that prompts the user for input.
 */
export class PromptTask<R, P extends JsonValue = Jsonify<R>, O=P> extends SuspendWorkflowTask<R, P, O> {

    /**
     * Initializes a new PromptTask instance.
     * @param promptId The dialog ID of the prompt to invoke.
     * @param options (Optional) The prompt options.
     * @param resultSetting - The settings used to configure the replay behavior.
     */
    constructor(
        private readonly promptId: string,
        private readonly options: object | undefined,
        resultSettings: TaskResultSettings<R, P, O>
    ) {
        super(resultSettings);
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
        return dialogContext.beginDialog(this.id, this.options);
    }

    protected override clone(): this {
        return Object.assign(super.clone(), {
            promptId: this.promptId,
            options: this.options
        });
    }
}
