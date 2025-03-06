// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { 
    RetryPolicy, 
    RetrySettings 
} from './tasks/retryPolicy'

import {
    TaskResultConverter,
    TaskResultSettings
} from './tasks/replayPolicy'

import { WorkflowTask } from './workflowTask'
import { Jsonify, JsonValue } from 'type-fest'
import { ZodType, ZodTypeDef } from 'zod'

/**
 * This interface is used to configure the task's retry and replay behavior.
 * 
 * @template R The task's execution result type
 * @template P The task's persisted execution result type.
 * @template O The task's observable execution result type.
 *
 */
export interface WorkflowTaskConfiguration<R, P extends JsonValue = Jsonify<R>, O=P> {

    /**
     * Configures the task's retry behavior on on failure
     * 
     * @param shouldRetry Whether to retry the task on failure
     * @returns The task instance.
     */
    configureRetry(shouldRetry: boolean) : this;

    /**
     * Configures the task's retry behavior on on failure
     * 
     * @param settings The settings used to configure the retry behavior.
     * @returns The task instance.
     */
    configureRetry(settings: RetrySettings) : this;

    /**
     * Configures the task's retry behavior on on failure
     * 
     * @param policy The retry policy used to configure the retry behavior.
     * @returns The task instance.
     */
    configureRetry(policy: RetryPolicy) : this;

    /**
     * Configures the task's replay behavior.
     * @template O The task's new observable execution result type.
     * @param {TaskResultConverter<P, O>} convert - The function used to convert the result to the new observeable type.
     * @returns The task configuration.
     */
    configureResult<O>(
        convert: TaskResultConverter<P, O>
    ) : WorkflowTaskConfiguration<R, P, O>;

    /**
     * Configures the task's replay behavior.
     * @template P The task's new persisted execution result type.
     * @template O The task's new observable execution result type.
     * @param {TaskResultSettings<R, P, O>} settings - The settings used to configure the replay behavior.
     * @returns The task configuration.
     */
    configureResult<P extends JsonValue, O>(
        settings: TaskResultSettings<R, P, O>
    ) : WorkflowTaskConfiguration<R, P, O>;

    /**
     * Executes the task.
     * @returns The generator used to continue the workflow.
     */
    execute() : Generator<WorkflowTask, O, O>;
}

