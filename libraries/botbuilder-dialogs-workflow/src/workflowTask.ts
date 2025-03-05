// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.


/**
 * Interface for a task that can be executed as port of a workflow.
 *
 */
export interface WorkflowTask {

    /**
     * Gets the task's kind
     */
    get kind(): string;

    /**
     * Gets the persistent identifier for this task instance
     */
    get id(): string;
}

