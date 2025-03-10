// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DialogFlowContext } from './dialogFlowContext';
import { DialogFlowTask } from './dialogFlowTask';
import { AbstractDialogFlowTask, defaultProjector } from './tasks/abstractDialogFlowTask';
import { AsyncCallTask } from './tasks/asyncCallTask';
import { DialogCallTask } from './tasks/dialogCallTask';
import { RestartDialogFlowTask } from './tasks/restartDialogFlowTask';
import { SuspendDialogFlowTask } from './tasks/suspendDialogFlowTask';
import { ReceiveActivityTask } from './tasks/receiveActivityTask';
import { TaskResult } from './tasks/taskResult';
import { createHash, randomUUID } from 'crypto';
import util from 'util';
import * as assert from 'node:assert';
import { 
    DialogContext,
    DialogReason, 
    DialogTurnResult,
} from 'botbuilder-dialogs';

import { Activity, ResourceResponse, TokenResponse, TurnContext } from 'botbuilder-core';

import { 
    convertToJson,
    convertFromJson,
 } from './tasks/replayPolicy';
import { DialogFlowError } from './dialogFlowError';
import { Jsonify, JsonValue } from 'type-fest';
import { DialogFlowBoundCallable } from './dialogFlowBoundCallable';

/**
 * Workflow dispatcher implementation.
 */
export class WorkflowDispatcher<O extends object, R = any> implements DialogFlowContext<O> {
    private readonly state: WorkflowDialogState<O>;
    private nextTask: number;

    /**
     * Initializes a new WorkflowDispatcher instance.
     * @param dc The dialog context for the current turn of conversation with the user.
     */
    constructor(private readonly dc: DialogContext) {
        this.state = dc.activeDialog!.state as WorkflowDialogState<O>
        this.nextTask = 0;
    }

    /**
     * @inheritdoc
     */
    public get options(): O {
        return this.state.options;
    }

    /**
     * @inheritdoc
     */
    public get channelId(): string {
        return this.dc.context.activity.channelId;
    }

    /**
     * @inheritdoc
     */
    public get dialogId(): string {
        return this.dc.activeDialog!.id
    }

    /**
     * @inheritdoc
     */
    public get isReplaying(): boolean {
        return (this.nextTask < this.state.history.length) || !!(this.state.resumeState)
    }

    /**
     * @inheritdoc
     */
    public get currentUtcTime(): Date {
       if (this.nextTask == this.state.history.length) {
            assert.ok(!this.state.resumeState);
            this.state.history.push({
                 kind: "currentUtcTime",
                 hashedId: '',
                 result: {success: true, value: new Date().toJSON()}
            });
       }

       assert.ok(this.nextTask < this.state.history.length);
       const entry = this.state.history[this.nextTask++];

       assert.ok(entry.result.success == true);
       assert.ok(typeof entry.result.value === 'string');
       assert.equal("currentUtcTime", entry.kind);
       assert.equal('', entry.hashedId);
       return new Date(entry.result.value);
    }

    /**
     * @inheritdoc
     */
    public newGuid(): string {
        if (this.nextTask == this.state.history.length) {
             assert.ok(!this.state.resumeState);
             this.state.history.push({
                  kind: "newGuid",
                  hashedId: '',
                  result: {success: true, value: randomUUID()}
             });
        }
 
        assert.ok(this.nextTask < this.state.history.length);
        const entry = this.state.history[this.nextTask++];
 
        assert.ok(entry.result.success == true);
        assert.ok(typeof entry.result.value === 'string');
        assert.equal("newGuid", entry.kind);
        assert.equal('', entry.hashedId);
        return entry.result.value; 
    }

    /**
     * @inheritdoc
     */
    public call<T>(
        task: (context: TurnContext) => Promise<T>
    ): DialogFlowTask<T> {
        return new AsyncCallTask<T>(task, defaultProjector);
    }

    /**
     * @inheritdoc
     */
    public callAsUser<T>(
        oauthDialogId: string, 
        task: (token: string, context: TurnContext) => Promise<T>
    ): DialogFlowTask<T> {
        return this.callDialog<TokenResponse|undefined>(oauthDialogId)
            .then((tokenResponse, context) => {
                if (!tokenResponse || !tokenResponse.token) {
                    throw new DialogFlowError("Sign-in failed.");
                }
                return task(tokenResponse.token, context);
            });
    }

    /**
     * @inheritdoc
     */
    public callDialog<T = any>(
        dialogId: string, 
        options?: object
    ): DialogFlowTask<T> {
        return new DialogCallTask<T>(dialogId, options, defaultProjector);
    }

    /**
     * @inheritdoc
     */
    public sendActivity(
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string,
    ): DialogFlowTask<ResourceResponse|undefined> {        
        return this.call((context: TurnContext) => {
            return context.sendActivity(activityOrText, speak, inputHint);
        });
    }

    /**
     * @inheritdoc
     */
    public receiveActivity(): DialogFlowTask<Activity> {
        return new ReceiveActivityTask();
    }

    /**
     * @inheritdoc
     */
    public restart(options?: O): DialogFlowTask<never> {
        return new RestartDialogFlowTask(options);
    }

    /**
     * @inheritdoc
     */
    public bind<T extends (...args: any[]) => any>(
        func: T
    ): DialogFlowBoundCallable<Parameters<T>, Jsonify<ReturnType<T>>> {

        const context = this;

        function bound(...args: Parameters<T>) : Jsonify<ReturnType<T>> {
            const callId = context.getHashOf(`${func.name}(${args.toString()})`);
            if (context.nextTask == context.state.history.length) {
                assert.ok(!context.isReplaying);

                try {
                    context.state.history.push({
                        kind: "boundFunc",
                        hashedId: callId,
                        result: { 
                            success: true,  
                            value: convertToJson(func(...args)) 
                        }
                    });
                } catch (error) {
                    context.state.history.push({
                        kind: "boundFunc",
                        hashedId: callId,
                        result: { 
                            success: false,
                            error: util.inspect(error, {depth: null, showHidden: true})
                        }
                    });
                }
            }

            const entry = context.state.history[context.nextTask++];
    
            assert.equal("boundFunc", entry.kind);
            assert.equal(callId, entry.hashedId);
    
            if (entry.result.success == true) {
                return entry.result.value;
            }
    
            throw new DialogFlowError(entry.result.error)
        }

        bound.project = <O>(projector: (value: Jsonify<ReturnType<T>>) => O) => {
            return (...args: Parameters<T>) : O => projector(bound(...args));
        }

        return bound;
    }

    /**
     * Starts or resumes the workflow.
     * @param workflow The workflow function to run.
     * @param reason The reason for starting or resuming the workflow.
     * @param resumeResult The result of the previous suspension, if any.
     * @returns A promise that resolves to the turn result.
     */
    public async run(
        workflow: (context: DialogFlowContext<O>) => Generator<DialogFlowTask, R>,
        reason: DialogReason,
        resumeResult?: any
    ): Promise<DialogTurnResult> {

        const generator = workflow(this);

        // Replay the recorded histroy
        for (var it = generator.next(); it.done === false && this.nextTask < this.state.history.length; ) {

            it = this.replayNext(generator, it.value);
        }

        // Resume from the last suspension, unless the workflow is run for the first time
        if (reason !== DialogReason.beginCalled) {

            assert.ok(!it.done && it.value instanceof SuspendDialogFlowTask);
            assert.equal(it.value.kind, this.state.resumeState?.kind);
            assert.equal(this.getHashOf(it.value.id), this.state.resumeState?.hashedId);

            this.state.resumeState = undefined;

            it = this.record(
                generator, 
                it.value, 
                await it.value.onResume(this.dc.context, resumeResult));
        }

        // Execute and resume the async invocations 
        while ((it.done === false) && it.value instanceof AsyncCallTask) {

            it = this.record(
                generator, 
                it.value, 
                await it.value.invoke(this.dc.context));

        }

        assert.equal(this.nextTask, this.state.history.length);

        // If the workflow is being suspended, record the suspension point
        if (it.done === false) {

            assert.ok(it.value instanceof SuspendDialogFlowTask);

            this.state.resumeState = {
                hashedId: this.getHashOf(it.value.id),
                kind: it.value.kind
            }

            return await it.value.onSuspend(this.dc);
        }

        return await this.dc.endDialog(it.value);
    }


    /**
     * Gets the hash of a value.
     * @param value The value to hash.
     * @returns The hashed value.
     */
    private getHashOf(value: string): string {
        return createHash('sha256').update(value).digest("base64");
    }

    /**
     * Records the result of a task execution.
     * @param generator The generator to move forward.
     * @param task The task that was executed.
     * @param result The result of the task execution.
     * @returns The iterator used to continue the workflow.
     */
    private record(
        generator: Generator<DialogFlowTask, R>, 
        task: AbstractDialogFlowTask<any>,
        result: TaskResult
    ) : IteratorResult<DialogFlowTask, R> {

        assert.ok(!this.isReplaying);

        this.state.history.push({
            hashedId: this.getHashOf(task.id),
            kind: task.kind,
            result: result
        });

        this.nextTask = this.state.history.length;
        return task.replay(generator, result);
    }

    /**
     * Replays the next recorded task execution result.
     * @param generator The generator to move forward.
     * @param task The task that was executed
     * @returns The iterator used to continue the workflow.
     */
    private replayNext(
        generator: Generator<DialogFlowTask, R>, 
        task: DialogFlowTask
    ) : IteratorResult<DialogFlowTask, R> {

        assert.ok(this.nextTask < this.state.history.length);
        const entry = this.state.history[this.nextTask++];

        assert.ok(task instanceof AbstractDialogFlowTask, `Expected task to be an instance of AbstractDialogFlowTask`);
        assert.equal(task.kind, entry.kind);
        assert.equal(this.getHashOf(task.id), entry.hashedId);

        return task.replay(generator, entry.result);
    }
 }

/**
 * Represents a workflow execution history entry.
 */
export interface WorkflowHistoryEntry {
    /**
     * The task's kind.
     */
    kind: string;

    /**
     * The hash of the task's persistent identifier.
     */
    hashedId: string;

    /**
     * The result of the task execution.
     */
    result: TaskResult;
}

/**
 * Represents the workflow suspension state.
 */
export interface WorkflowResumeState {
    /**
     * The task's kind.
     */
    kind: string;

    /**
     * The hash of the task's persistent identifier.
     */
    hashedId: string;
}

/**
 * Represents the workflow dialog state.
 */
export interface WorkflowDialogState<O extends object> {
    /**
     * The workflow options.
     */
    options: O;

    /**
     * The workflow execution history.
     */
    history: WorkflowHistoryEntry[];

    /**
     * The workflow suspension state.
     */
    resumeState?: WorkflowResumeState;
}
