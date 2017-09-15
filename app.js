const restify = require('restify');         // Needed to create server
const botbuilder = require('botbuilder');   // Needed to create bot

/**
 * Setup restify server
 * @type {*|Server}
 */
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function () {
    console.log('%s bot started at %s', server.name, server.url)
});

/**
 * Create chat connector
 * @type {ChatConnector}
 */
const connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

/**
 * Listening for user inputs
 */
server.post('/api/messages', connector.listen());
const helpMessage = '\n * I\'m Simon, I repeat everything you say. \n * I announce when an user comes or leaves the conversation. \n * The feature works with bots too.';

let username = '';

const bot = new botbuilder.UniversalBot(connector, session => {

        // Add & Remove user event
        bot.on('conversationUpdate', message => {
            // Add user event
            if (message.membersAdded && message.membersAdded.length > 0) {
                return session.beginDialog('welcomeUserDialog', message);

            }

            // Remove user event
            if (message.membersRemoved && message.membersRemoved.length > 0) {
                return session.beginDialog('byeUserDialog', message);
            }

        });

        bot.on('contactRelationUpdate', message => {
            if (message.action && message.action === 'add') {
                bot.send(new botbuilder.Message().address(message.address).text('Welcome my bot friend ' + message.address.id));
            }
            if (message.action && message.action === 'remove') {
                bot.send(new botbuilder.Message().address(message.address).text('Good bye my bot friend ' + message.address.id));
            }
        });



        // Typing event
        bot.on('typing', message => {
            return session.beginDialog('typingEventDialog', message);
        });

        // Echo message received
        session.beginDialog('echoDialog', session);

});

// Enable conversation data persistence
bot.set('persistConversationData', true);

// Greet dialog
bot.dialog('helpDialog', new botbuilder.SimpleDialog((session, results) => {
    session.send(helpMessage);
    session.endDialog();
}));

// Welcome user dialog
bot.dialog('welcomeUserDialog', new botbuilder.SimpleDialog((session, message) => {

    let membersAdded = message.membersAdded.map(member => {
        let isSelf = member.id === message.address.bot.id;
        //return (isSelf ? message.address.bot.name : member.name) || ' ' + 'Anon Member (Id = ' + member.id + ')'
        return (isSelf ? message.address.bot.name.concat(' with id : ', message.address.bot.id) : member.name.concat(' with id : ', member.id)) || ' ' + 'Anon Member (Id = ' + member.id + ')';

    }).join(', ');
    bot.send(new botbuilder.Message().address(message.address).text('Welcome home to ' + membersAdded +'\n \n'+helpMessage));
    session.endDialog();
}));

// Welcome user dialog
bot.dialog('byeUserDialog', new botbuilder.SimpleDialog((session, message) => {

    let membersRemoved = message.membersRemoved.map(member => {
        let isSelf = member.id === message.address.bot.id;
        return (isSelf ? message.address.bot.id : member.id) || '' + ' (Id: ' + member.id + ')';
    }).join(', ');
    bot.send(new botbuilder.Message().address(message.address).text('Goodbye to ' + membersRemoved +'. The member was removed or left the conversation.'));
    session.endDialog();
}));

// Typing event dialog
bot.dialog('typingEventDialog', new botbuilder.SimpleDialog(session => {
    console.log('sess', session);
    let card = new botbuilder.AnimationCard(session)
        .title(null)
        .subtitle(null)
        .image(botbuilder.CardImage.create(session, 'https://media.giphy.com/media/jtMqCDl7E07mM/giphy.gif'))
        .media([
            { url: 'https://media.giphy.com/media/jtMqCDl7E07mM/giphy.gif' }
        ]);
    let msg = new botbuilder.Message().address(session.address).addAttachment(card);
    session.send('I\'m faster than you !');
    session.send(msg);

    session.endDialog();
}));

bot.dialog('echoDialog', new botbuilder.SimpleDialog(session => {
    session.send('Simon says : ' + session.message.text);
    session.endDialog();
}));