const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter, assertActivity } = require('botbuilder-core');
const { ActivityPrompt, DialogReason, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { FluentDialog, DialogFlowContext } = require('../lib');

const assert = require('assert');
const { text } = require('stream/consumers');

const beginMessage = { text: 'begin', type: 'message' };

function setupDialogFlowTest(dialogFlow) {
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
        new FluentDialog('a', dialogFlow)
    );

    return adapter;
}

describe('FluentDialog', function () {
    this.timeout(5000);

    it('should send and receive activities.', async function () {

        function *testDialogFlow(context) {
            yield *context.sendActivity('bot responding.').execute();
        
            let message = yield *context.receiveActivity().then(activity => activity.text).execute();
            assert(message === 'continue', 'Unexpected input received.');
        
            return 'ending WorkflowDialog.';
        }
        
        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WorkflowDialog.')
            .startTest();
    });

    it('should restart dialog flow.', async function () {

        function *testDialogFlow(context) {            
            yield *context.sendActivity('bot responding.').execute();
        
            let message = yield *context.receiveActivity().then(activity => activity.text).execute();
            assert(message === 'continue', 'Unexpected input received.');

            let iterationCount = context.options?.iterationCount ?? 0;
            if (++iterationCount <= 2) {
                yield context.restart({iterationCount: iterationCount});
            }

            return 'ending WorkflowDialog.';
        }
        
        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WorkflowDialog.')
            .startTest();
    });

    it('should replay currentUtcTime.', async function () {

        var refTime = undefined;

        function *testDialogFlow(context) {            
            let time = context.currentUtcTime;
            let replayed = context.isReplaying;

            if (!context.isReplaying) {
                assert(refTime === undefined, 'Unexpected replay detected.');
                refTime = time;
            }
            else {
                assert(refTime.getTime() === time.getTime(), 'Unexpected currentUtcTime received.');
            }
        
            let message = yield *context.receiveActivity().then(activity => activity.text).execute();
            assert(message === 'continue', 'Unexpected input received.');
            assert(replayed, 'Unexpected replay detected.');

            return 'ending WorkflowDialog.';
        }
        
        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter
            .send(beginMessage)
            .send('continue')
            .assertReply('ending WorkflowDialog.')
            .startTest();
    });
});
