var builder = require('botbuilder');
var restify = require('restify');
var botbuilder_azure = require("botbuilder-azure");
var sql = require('mssql');
var inMemoryStorage = new builder.MemoryBotStorage();
// var connector = new builder.ConsoleConnector().listen();
// var bot = new builder.UniversalBot(connector, function (session) {
//     session.send("You said: %s", session.message.text);
// });
var config = {
    server: '10.0.10.60\\MSSQLSERVER16',
    database: 'botDB',
    user: 'sa',
    password: 'sap@123'
};

//SQL Server 
function insertRow(BotMessage,userName) {
    //2.
    console.log("Insert DB: "+BotMessage+", UserName: "+userName );
    var dbConn = new sql.Connection(config);
    //3.
    
    dbConn.connect().then(function () {
        //4.
        var transaction = new sql.Transaction(dbConn);
        //5.
        transaction.begin().then(function () {
            //6.
            var request = new sql.Request(transaction);
            
            //7.
            request.query(`Insert into tbl_Bot_Info (UserName,BotMessage) values ('${userName}','${BotMessage}')`)
        .then(function () {
                //8.
                transaction.commit().then(function (recordSet) {
                    console.log(recordSet);
                    dbConn.close();
                }).catch(function (err) {
                    //9.
                    console.log("Error in Transaction Commit " + err);
                    dbConn.close();
                });
            }).catch(function (err) {
                //10.
                console.log("Error in Transaction Begin " + err);
                dbConn.close();
            });
             
        }).catch(function (err) {
            //11.
            console.log(err);
            dbConn.close();
        });
    }).catch(function (err) {
        //12.
        console.log(err);
    });
}
//----------

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
var bot = new builder.UniversalBot(connector);
// var tableName = 'botTestdata';
// var storageName = "phonebotmarisionia46a";
// var storageKey = "PHA9uaJRytfGpIvF8LWgCf7dF2fiMdg9RrdDgI1dlf28XPvXlbBuXrWHkoGWmGmOEMA+3WIgj0Ensl8PF4wbcw==";
// var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, storageName,storageKey);
// var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
 
// bot.set('storage', tableStorage);

var documentDbOptions = {
    host: 'https://vivacomdb.documents.azure.com:443/', 
    masterKey: 'LucDvFRsljjPYAJyYixriXLpmu1C1QPKl7E4fWhZpAGtXsTYRCp4L97URKS1IQA3PbylqPWddc0UuPPLb1iACA==', 
    database: 'botdocs',   
    collection: 'botdata'
};

var docDbClient = new botbuilder_azure.DocumentDbClient(documentDbOptions);

var cosmosStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, docDbClient);

bot.set('storage', cosmosStorage);

var luisAppId = '81827e19-d3ad-4c11-9269-9b3509cc0371';
var luisAPIKey = 'd231b0cd743640849cf7fdf8bb5ed8ed';
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey+'&verbose=true&timezoneOffset=0&q=';
console.log(LuisModelUrl);
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);
var msg = "";
const logBotConversation = (event) => {
    for(var i = 0; i < event.attachments.length; i++) {
        var obj = event.attachments[i];
    
        console.log(obj.content.text);
        msg = obj.content.text;
    }
    
    insertRow(msg,event.address.user.name);
    console.log('BotMessage: ' + msg + ', user: ' + event.address.user.name);
    
    
};
const logUserConversation = (session) => {
    console.log('message: ' + session.message.text );
};

bot.use({
    receive: function (event, next) {
        logBotConversation(event);
        next();
    },
    send: function (event, next) {
        logBotConversation(event);
        next();
    },
    botbuilder: function (session, next) {
        logUserConversation(session);
        next();
    }
});

bot.dialog('TurnOn',
    (session) => {
        session.send('You reached the TurnOn intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'HomeAutomation.TurnOn'
});
bot.dialog('TurnOff',
    (session) => {
        session.send('You reached the TurnOff intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'HomeAutomation.TurnOff'
})



bot.on('conversationUpdate', function (message) {
   
    if (message.membersAdded) {
       
        message.membersAdded.forEach(function (identity) {
              
            if (identity.id === message.address.bot.id) {
               var name = message.user ? message.user.name : null;
                var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me.", name || 'there');
                bot.send(reply);
                bot.beginDialog(message.address,'showPromo');
            }
            
        });
    }
    // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                    
                }
            });
        }
    
    
});

bot.set(`persistUserData`, true);
bot.set(`persistConversationData`, true);

bot.on('contactRelationUpdate', function (message) {
    console.log(message);
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me.", name || 'there');
        bot.send(reply);
        
        bot.beginDialog(message.address,'showPromo');
    }
    else
    {
        console.log(message);
        bot.send("Welcome!!");
    }
});

// Add dialog to handle 'Buy' button click
bot.dialog('yesDialogButtonClick', [
    function (session, args, next) {
        
          session.beginDialog('showCarousel');
            
        
    }
]).triggerAction({ matches: /(yes|add)/i });

bot.dialog('yeahDialogButtonClick', [
    function (session, args, next) {
        
          session.send('Ok');
            
        
    }
]).triggerAction({ matches: /(yeah)/i });



bot.dialog('showCarousel',function(session){
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Classic SmartPhones")
            .subtitle("SmartPhones")
            .text("Midrange SmartPhones")
            .images([builder.CardImage.create(session, 'https://www.samsung.com/us/support/get-started/assets/images/edge-plus.png')])
            .buttons([
                builder.CardAction.imBack(session, "yeah", "Yes"),
                builder.CardAction.imBack(session, "nope", "No")
            ]),
        new builder.HeroCard(session)
            .title("Classic SmartPhones")
            .subtitle("SmartPhones")
            .text("Midrange SmartPhones")
            .images([builder.CardImage.create(session, 'https://www.samsung.com/us/support/get-started/assets/images/galaxy-s7.png')])
            .buttons([
                builder.CardAction.imBack(session, "yeah", "Yes"),
                builder.CardAction.imBack(session, "nope", "No")
            ])
            ,
        new builder.HeroCard(session)
            .title("Classic SmartPhones")
            .subtitle("SmartPhones")
            .text("Midrange SmartPhones")
            .images([builder.CardImage.create(session, 'https://www.91-img.com/pictures/samsung-galaxy-j2-ace-mobile-phone-large-1.jpg')])
            .buttons([
                builder.CardAction.imBack(session, "yeah", "Yes"),
                builder.CardAction.imBack(session, "nope", "No")
            ])
             ,
        new builder.HeroCard(session)
            .title("Classic SmartPhones")
            .subtitle("SmartPhones")
            .text("Midrange SmartPhones")
            .images([builder.CardImage.create(session, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR30j1nUNC6dbn44TEHunf8NhvzEhFY6cT_E9TfN5FWuhwbvaY7')])
            .buttons([
                builder.CardAction.imBack(session, "yeah", "Yes"),
                builder.CardAction.imBack(session, "nope", "No")
            ])
    ]);
    session.send(msg).endDialog();
});

bot.dialog('noDialogButtonClick', [
    function (session, args, next) {
        
            // Invalid product
           
            session.beginDialog('showButtons');
        
    }
]).triggerAction({ 
        matches: 'No.Device'
    });

bot.dialog('showButtons',function(session){
    var msg = new builder.Message(session);
    
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    msg.attachments([
        new builder.HeroCard(session)
            
            .text("Do you want to see other devices?")
            .buttons([
                builder.CardAction.imBack(session, "yes", "Yes"),
                builder.CardAction.imBack(session, "no", "No")
            ])
    ]);
    session.send(msg).endDialog();
})
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



bot.dialog('showVideo',function(session){
    var msg = new builder.Message(session);
    //msg.addAttachment({contentType: 'video/mp4', contentUrl: 'https://youtu.be/A9Vu9n7YxrI'});
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    msg.attachments([
      new builder.VideoCard(session)
        .title('Vivacom Promotions')
        .subtitle('by Vivacom')
        .autostart('true')
        
        .text('Vivacom')
        .image(builder.CardImage.create(session, 'https://img.youtube.com/vi/Nl_ZOWJZfyY/0.jpg'))
        .media([
            { url: 'http://115.249.145.115:7073/Download/HuaweiPSmartVIVACOM.mp4' }
        ])
        
    ]);
    session.send(msg).endDialog();
});


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
