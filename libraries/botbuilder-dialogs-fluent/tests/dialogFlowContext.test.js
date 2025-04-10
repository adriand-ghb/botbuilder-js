const { ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { DialogSet, DialogTurnStatus, Dialog, TextPrompt } = require('botbuilder-dialogs');
const { FluentDialog } = require('../lib');

const assert = require('assert');
const { mock } = require('node:test');

const beginMessage = { text: 'begin', type: 'message' };

function setupDialogFlowTest(...dialogsOrFlows) {
    const adapter = new TestAdapter(async (turnContext) => {
        const dc = await dialogs.createContext(turnContext);

        const results = await dc.continueDialog();
        switch (results.status) {
            case DialogTurnStatus.empty:
                await dc.beginDialog('a0');
                break;

            case DialogTurnStatus.complete:
                await turnContext.sendActivity(results.result);
                break;
        }
        await convoState.saveChanges(turnContext);
    });

    // Create new ConversationState with MemoryStorage and register the state as middleware.
    const convoState = new ConversationState(new MemoryStorage());

    // Create a DialogState property, DialogSet and register the dialog flow.
    const dialogState = convoState.createProperty('dialogState');
    const dialogs = new DialogSet(dialogState);

    dialogsOrFlows.forEach((dialogOrFlow, index) => {
        // Register the dialog flow with a unique ID.
        if (!(dialogOrFlow instanceof Dialog)) {
            dialogOrFlow = new FluentDialog(`a${index}`, dialogOrFlow);
        }

        dialogs.add(dialogOrFlow);
    });

    return adapter;
}

describe('FluentDialog', function () {
    this.timeout(5000);

    it('should send and receive activities.', async function () {
        function* testDialogFlow(context) {
            yield context.sendActivity('bot responding.');

            const message = yield context.receiveActivity().then((activity) => activity.text);
            assert(message === 'continue', 'Unexpected input received.');

            return 'ending dialog flow.';
        }

        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending dialog flow.')
            .startTest();
    });

    it('should call child dialog.', async function () {
        function* testDialogFlow(context) {
            const response = yield context.prompt('prompt', 'say something');

            yield context.sendActivity(`you said: ${response}`);

            const message = yield context.receiveActivity().then((activity) => activity.text);
            assert(message === 'continue', 'Unexpected input received.');

            return 'ending dialog flow.';
        }

        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow, new TextPrompt('prompt'));

        await adapter
            .send(beginMessage)
            .assertReply('say something')
            .send('hello world')
            .assertReply('you said: hello world')
            .send('continue')
            .assertReply('ending dialog flow.')
            .startTest();
    });

    it('should call async function.', async function () {
        const tracked = mock.fn((context) => context.sendActivity('bot responding.'));

        function* testDialogFlow(context) {
            yield context.call(tracked);

            const message = yield context.receiveActivity().then((activity) => activity.text);
            assert(message === 'continue', 'Unexpected input received.');

            return 'ending dialog flow.';
        }

        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending dialog flow.')
            .startTest();

        assert.strictEqual(tracked.mock.callCount(), 1, 'Unexpected call count.');
    });

    it('should restart dialog flow.', async function () {
        function* testDialogFlow(context) {
            yield context.sendActivity('bot responding.');

            const message = yield context.receiveActivity().then((activity) => activity.text);
            assert(message === 'continue', 'Unexpected input received.');

            let iterationCount = context.options?.iterationCount ?? 0;
            if (++iterationCount <= 2) {
                yield context.restart({ iterationCount: iterationCount });
            }

            return 'ending dialog flow.';
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
            .assertReply('ending dialog flow.')
            .startTest();
    });

    it('currentUtcTime should be deterministic.', async function () {
        let refTime = undefined;

        function* testDialogFlow(context) {
            const time = context.currentUtcTime;
            const replayed = context.isReplaying;

            if (!context.isReplaying) {
                assert(refTime === undefined, 'Unexpected replay detected.');
                refTime = time;
            } else {
                assert(refTime.getTime() === time.getTime(), 'Unexpected currentUtcTime received.');
            }

            const message = yield context.receiveActivity().then((activity) => activity.text);
            assert(message === 'continue', 'Unexpected input received.');
            assert(replayed, 'Unexpected replay detected.');

            return 'ending dialog flow.';
        }

        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter.send(beginMessage).send('continue').assertReply('ending dialog flow.').startTest();
    });

    it('newGuid should be deterministic.', async function () {
        let refGuid1 = undefined;
        let refGuid2 = undefined;

        function* testDialogFlow(context) {
            const guid1 = context.newGuid();
            const guid2 = context.newGuid();

            assert(guid1 !== guid2, 'Unexpected newGuid received.');

            if (!context.isReplaying) {
                refGuid1 = guid1;
                refGuid2 = guid2;
            } else {
                assert(refGuid1 === guid1, 'Unexpected value received.');
                assert(refGuid2 === guid2, 'Unexpected value received.');
            }

            const replayed = context.isReplaying;
            const message = yield context.receiveActivity().then((activity) => activity.text);
            assert(message === 'continue', 'Unexpected input received.');
            assert(replayed, 'Unexpected replay detected.');

            return 'ending dialog flow.';
        }

        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter.send(beginMessage).send('continue').assertReply('ending dialog flow.').startTest();
    });

    it('bound functions should be deterministic.', async function () {
        let refMessage1 = undefined;
        let refMessage2 = undefined;

        function bindableFunction(message) {
            return message + new Date().toISOString();
        }

        function* testDialogFlow(context) {
            const bound1 = context.bind(bindableFunction);

            const result1 = bound1('test message1');
            const result2 = bound1('test message2');
            const replayed = context.isReplaying;

            if (!context.isReplaying) {
                refMessage1 = result1;
                refMessage2 = result2;
            } else {
                assert(refMessage1 === result1, 'Unexpected value received.');
                assert(refMessage2 === result2, 'Unexpected value received.');
            }

            const message = yield context.receiveActivity().then((activity) => activity.text);
            assert(message === 'continue', 'Unexpected input received.');
            assert(replayed, 'Unexpected replay detected.');

            return 'ending dialog flow.';
        }

        // Initialize TestAdapter.
        const adapter = setupDialogFlowTest(testDialogFlow);

        await adapter.send(beginMessage).send('continue').assertReply('ending dialog flow.').startTest();
    });
});
