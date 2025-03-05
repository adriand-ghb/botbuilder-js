// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import util from 'util';
import { Jsonify, JsonValue } from 'type-fest';

import {WorkflowTask} from '../workflowTask'
import {TaskResult} from './taskResult'

import {
    RetryPolicy, 
    RetrySettings, 
    noRetry, 
    exponentialRetry, 
    retryPolicy
} from './retryPolicy'

import {
    TaskResultSettings,
    TaskResultConverter,
} from './replayPolicy'

import { WorkflowError } from '../workflowError';
import { WorkflowTaskConfiguration } from '../workflowTaskConfiguration';

/**
 * Abstract task that can be executed in a workflow.
 *
 * @template R The task's execution result type
 * @template P The task's persisted execution result type.
 * @template O The task's observable execution result type.
 */
export abstract class AbstractWorkflowTask<R, P extends JsonValue = Jsonify<R>, O=P> implements 
    WorkflowTask, WorkflowTaskConfiguration<R, P, O> {

    /**
     * Initializes a new AbstractWorkflowTask instance.
     * @param {TaskResultSettings<R, P, O>} replaySettings - The settings used to configure the replay behavior.
     * @param {RetryPolicy} retryPolicy - The retry policy used to configure the retry behavior.
     */
    constructor(
        private readonly replaySettings: TaskResultSettings<R, P, O>,
        private readonly retryPolicy: RetryPolicy = noRetry
    ) {
    }

    /**
     * @inheritdoc
     */
    public abstract get kind(): string;

    /**
     * @inheritdoc
     */
    public abstract get id(): string;

    /**
     * Gets the default retry settings.
     * @returns The default retry settings.
     */
    protected get defaultRetrySettings(): RetrySettings {
        return {
            maxAttempts: 5, 
            retryDelay: exponentialRetry(50, 1000)
        };
    }

    /**
     * Configures the task's retry behavior on on failure
     * 
     * @param {boolean | RetrySettings | RetryPolicy} retryConfig - The retry configuration.
     * @returns The task instance.
     */
    public configureRetry(retryConfig: boolean | RetrySettings | RetryPolicy): this {

        if (typeof retryConfig === 'boolean') {
            retryConfig = retryConfig ? retryPolicy(this.defaultRetrySettings): noRetry;
        }
        else if (typeof retryConfig === 'object') {
            retryConfig = retryPolicy(retryConfig);
        }

        return Object.assign(this.clone(), {
            retryPolicy: retryConfig
        }); 
    }

    /**
     * Configures the task's replay behavior.
     * @template P2 The task's new persisted execution result type.
     * @template O2 The task's new observable execution result type.
     * @param {TaskResultSettings<R, P2, O2> | TaskResultConverter<P, O2>} settings - The settings used to configure the replay behavior.
     * @returns The task configuration.
     */
    configureResult<P2 extends JsonValue, O2>(
        settings: TaskResultSettings<R, P2, O2> | TaskResultConverter<P, O2>
    ) : any {

        if (typeof settings === 'function') {
            return Object.assign(this.clone(), {
                toJson: this.replaySettings.toJson,
                fromJson: settings,
            });
        }

        return Object.assign(this.clone(), settings);
    }

    public *execute() : Generator<WorkflowTask, O, O> {
        let result: O = yield this;
        return result;
    }

    /**
     * Replays the result of a previous task execution.
     * @param generator The generator to replay.
     * @param result The result of the previous task execution.
     * @returns The iterator used to continue the workflow.
     */
    public replay<WorkflowResultType>(
        generator: Generator<WorkflowTask, WorkflowResultType>, 
        result: TaskResult<P>
    ) : IteratorResult<WorkflowTask, WorkflowResultType> {

        return (result.success === true) ?
            generator.next(this.replaySettings.fromJson(result.value)) :
            generator.throw(new WorkflowError(result.error));
    }
    
    /**
     * Creates a shallow copy of the task.
     * @returns The cloned task.
     */
    protected clone(): this {
        return Object.assign(Object.create(this.constructor.prototype), this);
    }

    /**
     * Called to determine whether to retry the task.
     * @param error The error that occurred during task execution
     * @param attempt The current retry attempt
     * @returns true if the task should be retried; otherwise false.
     */
    protected shouldRetry(error: any, attempt: number): Promise<boolean> {
        return this.retryPolicy(error, attempt);
    }

    /**
     * Applies the retry policy to a task.
     * @param task The task to apply the retry policy to.
     * @param args The arguments to pass to the task.
     * @returns The result of the task execution.
     */
    protected async applyRetryPolicy<T extends (...args: any[]) => Promise<R>>(
        task: T,
        ...args: Parameters<T>
    ) : Promise<TaskResult<P>> {
    
        for(var attempt: number = 1;;++attempt) {
            var result = await this.invokeTask(task, ...args);

            if ((result.success === true) || !await this.shouldRetry(result.error, attempt)) {
                return result;
            }
        }
    }

    /**
     * Helper method to invoke a task and return the result as a TaskResult.
     * @param task The task to apply the retry policy to.
     * @param args The arguments to pass to the task.
     * @returns The result of the task execution.
     */
    private async invokeTask<T extends (...args: any[]) => Promise<R>>(
        task: T,
        ...args: Parameters<T>
    ) : Promise<TaskResult<P>> {

        try{
            return {
                success: true,
                value: this.replaySettings.toJson(await task(...args))
            };
        }
        catch (error) {
            return {
                success: false,
                error: util.inspect(error, {depth: null, showHidden: true})
            };
        }
    }
}


