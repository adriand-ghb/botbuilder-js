const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { ActivityPrompt, DialogReason, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { WorkflowDialog, WorkflowContext } = require('../');

const assert = require('assert');
const { text } = require('stream/consumers');

const beginMessage = { text: 'begin', type: 'message' };

function *testWorkflow(context) {
    yield *context.sendActivity('bot responding.').execute();

    let activity = yield *context.receiveActivity().execute();
    assert(activity?.text === 'continue', 'Unexpected input received.');

    return 'ending WorkflowDialog.';
}


describe('WorkflowDialog', function () {
    this.timeout(5000);

    it('should execute a sequence of waterfall steps.', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;

                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
                    break;
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and register the WorkflowDialog.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WorkflowDialog('a', testWorkflow)
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WorkflowDialog.')
            .startTest();
    });

});
