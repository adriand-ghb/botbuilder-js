// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AbstractWorkflowTask} from './abstractWorkflowTask'
import { TaskResult } from './taskResult'
import { JsonValue } from 'type-fest';
import { DialogTurnResult, DialogContext } from 'botbuilder-dialogs';
import { TurnContext } from 'botbuilder-core';
import { TaskResultSettings } from './replayPolicy';

/**
 * Abstract task that will cause the current workflow to be suspend and resumed later.
 * @template R The task's execution result type
 * @template P The task's persisted execution result type.
 * @template O The task's observable execution result type.
 */
export abstract class SuspendWorkflowTask<R, P extends JsonValue, O=P> extends AbstractWorkflowTask<R, P, O> {

    /**
     * Initializes a new SuspendWorkflowTask instance.
     * @param {TaskResultSettings<R, P, O>} replaySettings - The settings used to configure the replay behavior.
     */
    constructor(replaySettings: TaskResultSettings<R, P, O>) {        
        super(replaySettings);
    }    

    /**
     * Invoked before the workflow is suspended.
     * @param dialogContext The dialog context for the current turn of conversation with the user.
     * @returns A promise resolving to the dialog turn result.
     */
    public abstract onSuspend(
        dialogContext: DialogContext
    ): Promise<DialogTurnResult>;

    /**
     * Invoked when the workflow is being resumed.
     * @param turnContext The turn context for the current turn of conversation with the user.
     * @param result The result of the invoked task.
     * @returns A promise resolving to the invocation result.
     */
    public abstract onResume(
        turnContext: TurnContext, 
        result: any
    ): Promise<TaskResult<P>>;
}

