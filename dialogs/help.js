const botbuilder = require('botbuilder');

const library = new botbuilder.Library('help');

library.dialog('helpDialog', (session, args, next) => {
    //Send a help message
    let msg = `Hello buddy, I'm Simon.<br/> This is the help message. You can call me with 'help'<br/>with this bot you can :<br/>`
    +`'save alarm' : save an alarm<br/>`
    +`'get alarms' : show all yours alarms<br/>`
    +`'get activ alarms' : show only yours activ alarms<br/>`
    +`'cancel' : interupt the current dialog<br/>`
    +`'start over' : relaunch the current dialog<br/>`;
    session.endDialog(msg);
})
// Once triggered, will start a new dialog as specified by
// the 'onSelectAction' option.
    .triggerAction({
        matches: /^help$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the top of the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });

module.exports = library;


