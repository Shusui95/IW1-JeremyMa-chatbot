const botbuilder = require('botbuilder');
const cron = require('cron');

const library = new botbuilder.Library('alarms');
let alarmToSave;
library.dialog('saveAlarmDialog', [
    (session) => {
        alarmToSave = {};
        botbuilder.Prompts.text(session, 'What\'s your alarm name ?')
    },
    (session, results) => {
        alarmToSave.name = results.response;
        botbuilder.Prompts.text(session, `What's your name ?`)
    },
    (session, results, args) => {

        alarmToSave.author = results.response;
        botbuilder.Prompts.time(session, "Please provide a alarm date and time (e.g.: June 6th at 5pm)");

    },
    (session, results) => {
        //let matched = results.response.match();
        if (false) { // typeof results.response === 'undefined'
            //undefined
            session.replaceDialog('saveAlarmDialog');
        } else {
            // Good date
            alarmToSave.date = botbuilder.EntityRecognizer.resolveTime([results.response]);
            //alarmToSave.date = new Date(Date.parse(alarmToSave.date)).toUTCString();
            let date = new Date(alarmToSave.date).getUTCDate();
            let month = new Date(alarmToSave.date).getUTCMonth();
            let hours = new Date(alarmToSave.date).getUTCHours();
            let minutes = new Date(alarmToSave.date).getUTCMinutes();
            // alarmToSave.cron = new cron.CronJob({
            //     cronTime: minutes+' '+hours+' '+date+' '+month+' *',
            //     onTick: () => {
            //         let msg = new botbuilder.Message().address(address);
            //         msg.text(`Alarm  is now triggered !`);
            //         bot.send(msg);
            //     },
            //     start: false,
            //     timeZone: 'Europe/Paris'
            // });
            botbuilder.Prompts.confirm(session, 'Do you want activ alarm ?')
        }
    },
    (session, results) => {
        alarmToSave.status = results.response;
        // if (alarmToSave.status){
        //     alarmToSave.cron.start()
        // }else{
        //     alarmToSave.cron.stop()
        // }
        alarmToSave.createdDate = new Date().toUTCString();
        alarmToSave.historique = [];

        if (typeof  session.userData.alarms === 'undefined') {
            session.userData.alarms = []
        }
        session.userData.alarms.push(alarmToSave);

        if (typeof  session.userData.cron === 'undefined') {
            session.userData.cron = []
        }
        if (typeof  session.userData.history === 'undefined') {
            session.userData.history = []
        }
        let date = new Date(alarmToSave.date).getUTCDate();
        let month = new Date(alarmToSave.date).getUTCMonth();
        let hours = new Date(alarmToSave.date).getUTCHours();
        let minutes = new Date(alarmToSave.date).getUTCMinutes();
        session.userData.cron.push(
            new cron.CronJob({
                cronTime: minutes+' '+hours+' '+date+' '+month+' *',
                onTick: () => {
                    session.userData.history.push(`${alarmToSave.name} at ${alarmToSave.date}`);
                    bot.send(`Alarm ${alarmToSave.name} is now triggered !`);
                },
                start: false,
                timeZone: 'Europe/Paris'
            })
        );


        //console.log('result', alarmToSave);
        session.endDialog(`It's done, your alarm is saved !`
            + `<br/>Alarm name : ${alarmToSave.name}<br/>`
            + `<br/>Trigger at : ${alarmToSave.date}<br/>`
            + `<br/>Activ : ${alarmToSave.status}<br/>`
            + `<br/>created by ${alarmToSave.author} at ${alarmToSave.createdDate}`);


    }
]).endConversationAction(
    "endAskTime", "Ok. It's done.",
    {
        matches: /^cancel$|^goodbye$|^skip$|^stop$/i,
        confirmPrompt: "This will cancel your request. Are you sure?"
    }
)
// Once triggered, will start a new dialog as specified by
// the 'onSelectAction' option.
    .triggerAction({
        matches: /^save alarm$|^enregistrer une alarme$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the top of the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    })// Once triggered, will restart the dialog.
    .reloadAction('startOver', 'Ok, starting over.', {
        matches: /^start over$/i
    });

library.dialog('getActivAlarmsDialog', [
    (session) => {
        console.log('test', session.userData.alarms)
        console.log('test', session.userData.alarms.length)
        if (session.userData.alarms && session.userData.alarms.length > 0) {
            session.send("Voici la liste de vos alarmes :")
            let msg = "";
            let flag = 0;
            for (let i = 0; i < session.userData.alarms.length; i++) {
                if (session.userData.alarms[i].status) {
                    let date = new Date(session.userData.alarms[i].date).getUTCDate();
                    let month = new Date(session.userData.alarms[i].date).getUTCMonth();
                    let hours = new Date(session.userData.alarms[i].date).getUTCHours();
                    let minutes = new Date(session.userData.alarms[i].date).getUTCMinutes();
                    if (flag === 0) {
                        flag++;

                        msg += `${i}. ` + session.userData.alarms[i].name+' // '+date+'-'+month+' '+hours+':'+minutes;
                    } else {
                        msg += '|' + `${i}. ` + session.userData.alarms[i].name+' // '+date+'-'+month+' '+hours+':'+minutes


                    }
                }
            }
            botbuilder.Prompts.choice(session, `Voici la liste de vos alarmes :<br/>Vous pouvez cliquer sur le bouton ou tapez le nom de l'alarme pour afficher le détail`, msg, {listStyle: botbuilder.ListStyle.button});
        } else {
            session.endDialog("Vous n'avez aucune alarme enregistrée pour le moment<br/>Vous pouvez en enregistrer en tapant 'save alarm' ou 'enregistrer une alarme'")
        }
    }
]).triggerAction({
    matches: /^get activ alarms$|^consulter les alarmes actives$/i,
    onSelectAction: (session, args, next) => {
        // Add the help dialog to the top of the dialog stack
        // (override the default behavior of replacing the stack)
        session.beginDialog(args.action, args);
    }
}).reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i
});

library.dialog('test', [
    (session) => {

    }
]).triggerAction({
    matches: /^test$/i,
    onSelectAction: (session, args, next) => {
        // Add the help dialog to the top of the dialog stack
        // (override the default behavior of replacing the stack)
        session.beginDialog(args.action, args);
    }
});

library.dialog('getAlarmsDialog', [(session, args, next) => {
    if (session.userData.alarms && session.userData.alarms.length > 0) {
        session.send("Voici la liste de vos alarmes :")
        let msg = "";
        for (let i = 0; i < session.userData.alarms.length; i++) {
            let date = new Date(session.userData.alarms[i].date).getUTCDate();
            let month = new Date(session.userData.alarms[i].date).getUTCMonth();
            let hours = new Date(session.userData.alarms[i].date).getUTCHours();
            let minutes = new Date(session.userData.alarms[i].date).getUTCMinutes();
            if (i === 0) {
                msg += `${i}. ` + session.userData.alarms[i].name +' // '+date+'-'+month+' '+hours+':'+minutes+ ' // ' + ((session.userData.alarms[i].status) ? 'Activ' : 'Inactive');
            } else {
                msg += '|' + `${i}. ` + session.userData.alarms[i].name +' // '+date+'-'+month+' '+hours+':'+minutes+ ' // ' + ((session.userData.alarms[i].status) ? 'Activ' : 'Inactive');
            }

        }
        botbuilder.Prompts.choice(session, `Voici la liste de vos alarmes :<br/>Vous pouvez cliquer sur le bouton ou tapez le nom de l'alarme pour afficher le détail`, msg, {listStyle: botbuilder.ListStyle.button});
    } else {
        session.endDialog("Vous n'avez aucune alarme enregistrée pour le moment<br/>Vous pouvez en enregistrer en tapant 'save alarm' ou 'enregistrer une alarme'")
    }

},
    (session, results, next) => {
        session.send(`Here is your requested alarm :<br/>`
            + `${results.response.index}. Alarm ${session.userData.alarms[results.response.index].name}<br/>`
            + `Trigger at : ${session.userData.alarms[results.response.index].date}<br/>`
            + `Activ : ${session.userData.alarms[results.response.index].status}<br/>`
            + `created by ${session.userData.alarms[results.response.index].author} at ${session.userData.alarms[results.response.index].createdDate}<br/>`)
    }]).endConversationAction(
    "endAskTime", "Ok. It's done.",
    {
        matches: /^cancel$|^goodbye$|^skip$|^stop$/i,
        confirmPrompt: "This will cancel your request. Are you sure?"
    }
)
// Once triggered, will start a new dialog as specified by
// the 'onSelectAction' option.
    .triggerAction({
        matches: /^get alarms$|^consulter les alarmes$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the top of the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    }).reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i
});

library.dialog('getHistoryDialog', [(session, args, next) => {
    if (session.userData.history && session.userData.history.length > 0) {
        session.send("Voici l'historique de déclenchement de vos alarmes :<br/>")
        let msg = "";
        for (let i = 0; i < session.userData.history.length; i++) {
            msg += `${session.userData.history[i]}<br/>`
        }
        session.endDialog(msg)
    } else {
        session.endDialog("Vous n'avez aucun historique de déclenchement d'alarme pour le moment")
    }

}
    ]).endConversationAction(
    "endAskTime", "Ok. It's done.",
    {
        matches: /^cancel$|^goodbye$|^skip$|^stop$/i,
        confirmPrompt: "This will cancel your request. Are you sure?"
    }
)
// Once triggered, will start a new dialog as specified by
// the 'onSelectAction' option.
    .triggerAction({
        matches: /^get history$|^get history alarms$|^consulter l'historique$|^consulter l'historique des alarmes$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the top of the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    }).reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i
});

module.exports = library;


