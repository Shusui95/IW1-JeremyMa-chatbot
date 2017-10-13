const botbuilder = require('botbuilder');

const library = new botbuilder.Library('greetings');

library.dialog('greetingsDialog', [

    (session) => {
        session.beginDialog('askName')
    },
    (session, results) => {
        session.endDialog('Hello %s!', results.response)
    }

]);

// Dialog ask name
library.dialog('askName', [
    (session) => {
        botbuilder.Prompts.text(session, 'What\'s your name ?')
    },
    (session, results) => {
        session.endDialogWithResult(results)
    }
]);

module.exports = library;