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
    // bot.on('conversationUpdate', message => {
    //     // Add user event
    //     if (message.membersAdded && message.membersAdded.length > 0) {
    //         return session.beginDialog('welcomeUserDialog', message);
    //
    //     }
    //
    //     // Remove user event
    //     if (message.membersRemoved && message.membersRemoved.length > 0) {
    //         return session.beginDialog('byeUserDialog', message);
    //     }
    //
    // });

    // Add & Remove bot event
    // bot.on('contactRelationUpdate', message => {
    //     if (message.action && message.action === 'add') {
    //         bot.send(new botbuilder.Message().address(message.address).text('Welcome my bot friend ' + message.address.id));
    //     }
    //     if (message.action && message.action === 'remove') {
    //         bot.send(new botbuilder.Message().address(message.address).text('Good bye my bot friend ' + message.address.id));
    //     }
    // });


    // Typing event
    // bot.on('typing', message => {
    //     session.send(message);
    //     return session.beginDialog('typingEventDialog', message);
    // });

    // Echo message received
    //session.beginDialog('echoDialog', session);

    // Launch waterfall reservation
    session.beginDialog('reserveDialog', session)


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
    bot.send(new botbuilder.Message().address(message.address).text('Welcome home to ' + membersAdded + '\n \n' + helpMessage));
    session.endDialog();
}));

// Welcome user dialog
bot.dialog('byeUserDialog', new botbuilder.SimpleDialog((session, message) => {

    let membersRemoved = message.membersRemoved.map(member => {
        let isSelf = member.id === message.address.bot.id;
        return (isSelf ? message.address.bot.id : member.id) || '' + ' (Id: ' + member.id + ')';
    }).join(', ');
    bot.send(new botbuilder.Message().address(message.address).text('Goodbye to ' + membersRemoved + '. The member was removed or left the conversation.'));
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
            {url: 'https://media.giphy.com/media/jtMqCDl7E07mM/giphy.gif'}
        ]);
    let msg = new botbuilder.Message().address(session.address).addAttachment(card);
    session.send('I\'m faster than you !');
    session.send(msg);

    session.endDialog();
}));

// Dialog Echo : Repeat user response
bot.dialog('echoDialog', new botbuilder.SimpleDialog(session => {
    session.send('Simon says : ' + session.message.text);
    session.endDialog();

}));

// Dialog greetings : ask name & say Hi
bot.dialog('greetings', [
    (session) => {
        session.beginDialog('askName')
    },
    (session, results) => {
        session.endDialog('Hello %s!', results.response)
    }
]);

// Dialog ask name
bot.dialog('askName', [
    (session) => {
        botbuilder.Prompts.text(session, 'What\'s your name ?')
    },
    (session, results) => {
        session.endDialogWithResult(results)
    }
]);

// Dialog ensure user Profile
bot.dialog('ensureProfile', [
    (session, args, next) => {
        session.dialogData.profile = args || {}; // Set the profile or create the object
        if (session.dialogData.profile.name) {
            // Prompt
        } else {
            next(); // skip if we already have this info
        }

    },
    (session, results, next) => {
        if (results.response) {
            // Save user's name if we asked for it
            session.dialogData.profile.name = results.response;
        }
        if (!session.dialogData.profile.company) {
            botbuilder.Prompts.text(session, 'What company do you work for?')
        } else {
            next(); // skip if we already have this info
        }
    },
    (session, results) => {
        if (results.response) {
            // Save company name if we asked for it
            session.dialogData.profile.company = results.response;
        }
        session.endDialogWithResult({response: session.dialogData.profile})
    }
]);

// Dialog reservation : ask name, datetime reservation, name reservation
// Can skip waterfall with : cancel, goodbye, stop, skip
bot.dialog('reserveDialog', [
    (session) => {
        session.send("Welcome to the dinner reservation.");
        session.beginDialog('askName', session);
    },
    (session) => {
        botbuilder.Prompts.time(session, "Please provide a reservation date and time (e.g.: June 6th at 5pm)");
    },
    (session, results) => {
        session.dialogData.reservationDate = botbuilder.EntityRecognizer.resolveTime([results.response]);
        session.dialogData.reservationDate = new Date(Date.parse(session.dialogData.reservationDate)).toUTCString()
        botbuilder.Prompts.text(session, "How many people are in your party?");
    },
    (session, results) => {
        session.dialogData.partySize = results.response;
        botbuilder.Prompts.text(session, "Who's name will this reservation be under?");
    },
    (session, results) => {
        session.dialogData.reservationName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmed ! <br/>Reservation details: <br/>Date/Time: ${session.dialogData.reservationDate} <br/>Party size: ${session.dialogData.partySize} <br/>Reservation name: ${session.dialogData.reservationName}`);
        session.endDialog();
    }
]).endConversationAction(
    "endOrderDinner", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^skip$|^stop$/i,
        confirmPrompt: "This will cancel your order. Are you sure?"
    }
);

// Dialog time prompt
// ToDo : add a cancel / skip feature
bot.dialog('timePrompt', [
    (session, args) => {
        if(args && args.reprompt){
            botbuilder.Prompts.text();
        }else{
            botbuilder.Prompts.text();
        }
    },
    (session, results) => {
        let matched = results.response.match()
        if (!matched){
            //undefined
            session.replaceDialog(timePrompt);
        }else{
            // Good date
            session.endDialogWithResult(results.response);
        }
    }
]);

// 2 manieres de rentrer dans un dialog
//
// beginDialog ou triggerAction avec match regex, like endConversationAction, reloadAction, cancelAction
// .triggerAction({
//      matches: /^main menu$/i
//        confirmPrompt: "This will cancel your request. Are you sure ?"
// })

/*Bot de résa pour manger

Greeting et recup de nom
3 step:
    -    Date de la resa
-    Nombre de personne
-    Nom de la personne qui porte la resa
End :
    -    Bot confirme la resa avec toutes les info
A tout moment pouvoir annuler le système de résa*/

/*
bot gerer des alarmes
alarme : date + nom
bonjour => list de choix
consulter les alarmes actives,
historique alarmes actives et non, afficher sous forme liste ou rich card ou button => au click il affiche detail
creer par qui, a quel heure, recap, name
celle qui sont a venir

trigger, reload, cancel, action
un main menu
 */