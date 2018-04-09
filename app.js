var builder = require('botbuilder');
var restify = require('restify');
var inMemoryStorage = new builder.MemoryBotStorage();
// var connector = new builder.ConsoleConnector().listen();
// var bot = new builder.UniversalBot(connector, function (session) {
//     session.send("You said: %s", session.message.text);
// });

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: '27d68a41-2c2a-4348-81c4-8fac8ad6fd6d',
    appPassword: 'jiCMKY62#howetKMI535:?;'
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.beginDialog('userProfile',session.userData.profile);
    },
    
    function(session,results){
        session.userData.profile = results.response; // save user profile
        session.send(`Hello ${session.userData.profile.name}! You work for ${session.userData.profile.company}!`);
    }
]).set('storage',inMemoryStorage);

bot.dialog('userProfile',[
    function(session,args,next){
        session.dialogData.profile = args || {}; //set profile or create the object.
        
        if(!session.dialogData.profile.name){
            session.send("Let us know about you!!");
            builder.Prompts.text(session,'What is your name?');
        }
        else
        {
            session.send("As per our prior interactions we know you!!");
            next();//skip if we have user name 
        }
    },
    function(session,results,next){
        if(results.response){
            //save users name if we asked for it
            session.dialogData.profile.name = results.response;
        }
        if(!session.dialogData.profile.company){
            builder.Prompts.text(session,'What company do you work for?');
        }
        else
        {
            next();
        }
    },
    function(session,results){
        if(results.response){
            //save company name
            session.dialogData.profile.company = results.response;
        }
        session.endDialogWithResult({response:session.dialogData.profile});
    }
]);