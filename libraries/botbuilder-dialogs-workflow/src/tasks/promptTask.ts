// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SuspendWorkflowTask } from "./suspendWorkflowTask";
import { Jsonify } from 'type-fest';
import { DialogTurnResult, DialogContext } from 'botbuilder-dialogs';


/**
 * Represents a task that shows a dialog and receives the dialog's result.
 * 
 * @template R The task's execution result type
 * @template O The task's observable execution result type.
*/
export class PromptTask<R, O = Jsonify<R>> extends SuspendWorkflowTask<R, O> {

    /**
     * Initializes a new PromptTask instance.
     * @param promptId The dialog ID of the prompt to invoke.
     * @param options (Optional) The prompt options.
     * @param projector The callback used to convert the deserialized result to its observable value
     */
    constructor(
        private readonly promptId: string,
        private readonly options: object | undefined,
        projector: (value: Jsonify<R>) => O
    ) {
        super(projector);
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
