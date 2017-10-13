const greetings = require('./dialogs/greetings');
const reservation = require('./dialogs/reservation');
const globalMenu = require('./dialogs/globalMenu');
const help = require('./dialogs/help');
const alarms = require('./dialogs/alarms');
const cron = require('cron');

const restify = require('restify');         // Needed to create server
const botbuilder = require('botbuilder');   // Needed to create bot
const cognitiveservices = require('botbuilder-cognitiveservices');

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
let recognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: 'a4b9b461-bae2-4eb5-b762-1b325b492bb6',
    subscriptionKey: 'f3be13292c85470aa3bebb6983294576'
});

let basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No good match in FAQ.',
    qnaThreshold: 0.5
});
// const bot = new botbuilder.UniversalBot(connector);
// bot.dialog('/', basicQnAMakerDialog);

 const bot = new botbuilder.UniversalBot(connector, session => {
//
//
//     // Echo message received
//     //session.beginDialog('echoDialog');
//
//     // Launch waterfall reservation
   //     session.beginDialog('example2');
//     //session.beginDialog('reserveDialog');
     //session.beginDialog('greetings:greetingsDialog');
     //session.beginDialog('globalMenu:globalMenuDialog');
//     //session.beginDialog('reservation:reserveDialog');

//
 });

const helpMessage = '\n * I\'m Simon, I repeat everything you say. \n * I announce when an user comes or leaves the conversation. \n * The feature works with bots too.';
let savedAddress;

let username = '';


// Import dialogs
bot.library(greetings);
//bot.library(reservation);
bot.library(globalMenu);
bot.library(help);
bot.library(alarms);

// Enable conversation data persistence
bot.set('persistConversationData', true);


// Do GET this endpoint to delivey a notification
server.get('/api/CustomWebApi', (req, res, next) => {
        sendProactiveMessage(savedAddress);
        res.send('triggered');
        next();
    }
);

// send simple notification
function sendProactiveMessage(address) {
    let msg = new botbuilder.Message().address(address);
    msg.text('Hello, this is a notification');
    msg.textLocale('en-US');
    bot.send(msg);
}

// root dialog
bot.dialog('example', (session, args) => {

    savedAddress = session.message.address;

    let message = 'Hello! In a few seconds I\'ll send you a message proactively to demonstrate how bots can initiate messages.';
    session.send(message);

    message = 'You can also make me send a message by accessing: ';
    message += 'http://localhost:' + server.address().port + '/api/CustomWebApi';
    session.send(message);

    setTimeout(() => {
        sendProactiveMessage(savedAddress);
    }, 5000);
});

// root dialog
bot.dialog('example2', (session, args) => {

    // ListStyle passed in as Enum
    botbuilder.Prompts.choice(session, "Which color?", "red|green|blue", { listStyle: botbuilder.ListStyle.button });

});

// 2 manieres de rentrer dans un dialog
//
// beginDialog ou triggerAction avec match regex, like endConversationAction, reloadAction, cancelAction
// .triggerAction({
//      matches: /^main menu$/i
//        confirmPrompt: "This will cancel your request. Are you sure ?"
// })

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
