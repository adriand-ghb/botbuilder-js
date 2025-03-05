// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export class WorkflowError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WorkflowError';
        Object.setPrototypeOf(this, WorkflowError.prototype);
    }
}