import { 
    ActivityTypes, 
} from 'botbuilder-core';

import { 
    Dialog, 
    DialogContext,
    DialogReason, 
    DialogTurnResult,
} from 'botbuilder-dialogs'

import { WorkflowContext } from './workflowContext'
import { WorkflowTask } from './workflowTask';
import { 
    WorkflowDispatcher,
    WorkflowDialogState
 } from './workflowDispatcher';


/**
* A workflow is a dialog used to implement the user interaction using a functional programing model. 
* Workflows use event sourcing transparently. Behind the scenes, the yield operator in a workflow function yields control of 
* the workflow thread back to the workflow dispatcher. The dispatcher then commits any new actions that the workflow function
* scheduled (such as starting a child dialog or making an async call) to storage. The transparent commit action updates 
* the execution history of the workflow instance by appending all new events into storage, much like an append-only log. 
* At this point, the workflow dialog ends its turn and when the dialog is resumed, the dispatcher re-executes the entire function
* from the start to rebuild the local state. During the replay, if the code tries to begin a child dialog (or do any  async work), 
* the dispatcher consults the execution history, replays that result and the workflow code continues to run. 
* The replay continues until the function code is finished or until it yields a new suspension task.
*
 * @param O (Optional) type of options passed to the workflow dialog in the call to `DialogContext.beginDialog()`.
 * @param T (Optional) type of value returned by the workflow function.
 */
export class WorkflowDialog<O extends object = {}, T = any> extends Dialog<O> {

    /**
     * Creates a new workflow dialog.
     *
     * @param dialogId Unique ID of the dialog within the component or set its being added to.
     * @param workflow The workflow generator function.
     */
    constructor(dialogId: string, private readonly workflow: (context: WorkflowContext<O>) => Generator<WorkflowTask, T>) {
        super(dialogId);
    }

    /**
     * Called when the workflow is started and pushed onto the dialog stack.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @param options Optional, initial information to pass to the [Dialog](xref:botbuilder-dialogs.Dialog).
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the [Dialog](xref:botbuilder-dialogs.Dialog) is still
     * active after the turn has been processed by the dialog.
     */
    public override beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        const state: WorkflowDialogState<O> = dc.activeDialog!.state as WorkflowDialogState<O>;
        state.options = options || ({} as O);
        state.history = [];

        return this.runWorkflow(dc, DialogReason.beginCalled);
    }

    /**
     * Called when the workflow is _continued_, where it is the active dialog and the
     * user replies with a new [Activity](xref:botframework-schema.Activity).
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog. The result may also contain a
     * return value.
     */
    public override continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Don't do anything for non-message activities
        if (dc.context.activity.type !== ActivityTypes.Message) {
            return Promise.resolve(Dialog.EndOfTurn);
        }

        return this.resumeDialog(dc, DialogReason.continueCalled, dc.context.activity.text);
    }

    /**
     * Called when a child dialog completed its turn, returning control to this workflow.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of the conversation.
     * @param reason [Reason](xref:botbuilder-dialogs.DialogReason) why the dialog resumed.
     * @param result Optional, value returned from the dialog that was called. The type
     * of the value returned is dependent on the child dialog.
     * @returns A Promise representing the asynchronous operation.
     */
    public override resumeDialog(dc: DialogContext, reason: DialogReason, result?: any): Promise<DialogTurnResult> {
        return this.runWorkflow(dc, reason, result);
    }

    /**
     * Executes the workflow up to the next task 
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @param reason The [Reason](xref:botbuilder-dialogs.DialogReason) the workflow is being executed.
     * @param result Optional, result returned by a dialog called in the previous workflow step.
     * @returns A Promise that represents the work queued to execute.
     */
    protected runWorkflow(dc: DialogContext, reason: DialogReason, result?: any): Promise<DialogTurnResult> {
        const context = new WorkflowDispatcher<O,T>(dc);
        return context.run(this.workflow, reason, result);
    }
}
