// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AbstractWorkflowTask } from './abstractWorkflowTask'
import { TaskResult } from './taskResult'
import { TaskResultSettings, TaskResultConverter } from './replayPolicy'
import { TurnContext } from 'botbuilder-core'
import { JsonValue, Jsonify } from 'type-fest';

/**
 * Represewnts the invocation of an async function.
 *
 * @template R The task's execution result type
 * @template P The task's persisted execution result type.
 * @template O The task's observable execution result type.
*/
export class AsyncCallTask<R, P extends JsonValue = Jsonify<R>, O=P> extends AbstractWorkflowTask<R, P, O> {

    /**
     * Initializes a new AbstractWorkflowTask instance.
     * @param task The async function to invoke.
     * @param {TaskResultSettings<R, P, O>} replaySettings - The settings used to configure the replay behavior.
     */
    constructor(
        private readonly task: (context: TurnContext) => Promise<R>,
        replaySettings: TaskResultSettings<R, P, O>
    ) {
        super(replaySettings);
    }

    /**
     * @inheritdoc
     */
    override get kind(): string {
        return 'AsyncCall';
    }

    /**
     * @inheritdoc
     */
    public override get id(): string {
        return this.task.toString();
    }

    /**
     * Executes the task.
     * @param context The turn context for the current turn of conversation with the user.
     * @returns The result of the task execution.
     */
    public invoke(context: TurnContext): Promise<TaskResult<P>> {
        return this.applyRetryPolicy(this.task, context);
    }

    /**
     * @inheritdoc
     */
    protected override clone(): this {
        return Object.assign(super.clone(), {
            task: this.task
        });
    }
}
