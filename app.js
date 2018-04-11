var builder = require('botbuilder');
var restify = require('restify');
var botbuilder_azure = require("botbuilder-azure");
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
var tableName = 'botTestdata';
var storageName = "phonebotmarisionia46a";
var storageKey = "PHA9uaJRytfGpIvF8LWgCf7dF2fiMdg9RrdDgI1dlf28XPvXlbBuXrWHkoGWmGmOEMA+3WIgj0Ensl8PF4wbcw==";
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, storageName,storageKey);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
var bot = new builder.UniversalBot(connector);
bot.dialog('/', [
    function (session) {
        session.beginDialog('showPromo');
    }
]);


bot.set('storage', tableStorage);

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
               // bot.beginDialog(message.address, 'showPromo');
               var txt = "Hello user";
               var reply = new builder.Message()
                .address(message.address)
                .text(txt);
                bot.send(reply);
            }
            
        });
    }
    
    
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me.", name || 'there');
        bot.send(reply);
        bot.beginDialog('showPromo');
    }
});

bot.dialog('normalPromo', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Promotions")
            .text("Hi, I saw you like my offer ':-)' do you want to proceed  with the payment?")
            
            .images([builder.CardImage.create(session, 'https://www.apkmirror.com/wp-content/uploads/2018/02/5a923158e6749.png')])
            .buttons([
                builder.CardAction.imBack(session, "yes", "Yes"),
                builder.CardAction.imBack(session, "no", "No")
            ])
    ]);
    session.send(msg).endDialog();
});

// Add dialog to handle 'Buy' button click
bot.dialog('yesDialogButtonClick', [
    function (session, args, next) {
        
            // Invalid product
            session.send("Great! I am starting the process right now, give me a sec").endDialog();
        
    }
]).triggerAction({ matches: /(yes|add)/i });

bot.dialog('noDialogButtonClick', [
    function (session, args, next) {
        
            // Invalid product
            session.send("No problem. Would you like to see etc etc…").endDialog();
        
    }
]).triggerAction({ matches: /(no|add)/i });

// Add dialog to return list of shirts available
bot.dialog('showPromo', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Promotions")
            .text("Hi, I saw you like my offer  😊 do you want to proceed  with the payment?")
            
            .images([builder.CardImage.create(session, 'https://www.apkmirror.com/wp-content/uploads/2018/02/5a923158e6749.png')])
            .buttons([
                builder.CardAction.imBack(session, "yes", "Yes"),
                builder.CardAction.imBack(session, "no", "No")
            ])
    ]);
    session.send(msg).endDialog();
});

// Add dialog to handle 'Buy' button click
bot.dialog('yesButtonClick', [
    function (session, args, next) {
        
            // Invalid product
            session.send("Great! I am starting the process right now, give me a sec").endDialog();
        
    }
]).triggerAction({ matches: /(yes|add)/i });

bot.dialog('noButtonClick', [
    function (session, args, next) {
        
            // Invalid product
            session.send("No problem. Would you like to see etc etc…").endDialog();
        
    }
]).triggerAction({ matches: /(no|add)/i });

bot.dialog('showOffers',[
    function(session){
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
         msg.attachments([
             new builder.HeroCard(session)
            .title("Promotions")
            
            .text("Hi, I saw you like my offer  😊 do you want to proceed  with the payment?")
            .images([builder.CardImage.create(session, 'https://www.apkmirror.com/wp-content/uploads/2018/02/5a923158e6749.png')])
            .buttons([
                builder.CardAction.imBack(session, "YES", "YES"),
                builder.CardAction.imBack(session, "NO", "NO")
            ])
         ]);
         session.send(msg).endDialog();
    }
]);




bot.dialog('userProfile',[
    function(session,args,next){
        session.sendTyping();
        session.dialogData.profile = args || {}; //set profile or create the object.
        
        if(!session.dialogData.profile.name){
            setTimeout(function () {
                session.send("Let us know about you!!");
                builder.Prompts.text(session,'What is your name?');
            },3000);
            
        }
        else
        {
            setTimeout(function () {
                session.send("As per our prior interactions we know you!!");
            },3000);
            
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

