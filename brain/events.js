module.exports.init = function(controller) {

    //Event Constructor
    var Event = function(name, description, dateTime, location) {
        this.title = name;
        this.description = description;
        this.dateTime = dateTime;
        this.location = location;
    };

    var conversation = function (bot, message, eventId) {
        //Start Conversation
        bot.startConversation(message, function(err, convo) {
            //Get Event Title
            convo.say('Hey! Let\'s plan this event together!');
            convo.ask('First, what is the title of the event?', function(response, convo) {
                convo.next();
            }, {'key': 'title'});
            //Get Event Description
            convo.ask('What is the description of the event?', function(response, convo) {
                convo.next();
            }, {'key': 'description'});
            //Get Event Date And Time
            convo.ask('When will take place (format: mm/dd/yyyy hh:mm)?', function(response, convo) {
                convo.next();
            }, {'key': 'dateTime'});
            //Get Event Location
            convo.ask('Where will it take place?', function(response, convo) {
                convo.next();
            }, {'key': 'location'});
            //End Conversation
            convo.on('end', function(convo) {
                if (convo.status == 'completed') {
                    //Create Temp Var's
                    var eTitle = convo.extractResponse('title'),
                        eDescription = convo.extractResponse('description'),
                        eDateTime = convo.extractResponse('dateTime'),
                        eLocation = convo.extractResponse('location'),
                        createdEventMsg = 'Awesome! Your event ' + eTitle + ' is planned!\n' + eDescription + '\nIt will take place in ' + eDateTime + '\nI will communicate this to your team on #Events.\n Cheers!';

                    //New Event Message
                    bot.reply(message, createdEventMsg, function(err,response) {
                        //Broadcast Event
                        bot.api.chat.postMessage({
                            text: 'Hey there! the user X ' + 'has planned a new event: ' + eTitle +'!\n' + 'Here\'s the description of the event:\n' + eDescription + '\nTo answer, click on the good emoji below.\n You may only choose one option. to answer click on the good emoji below',
                            channel: 'C0STACP6G'
                        }, function(err, message) {
                            bot.api.reactions.add({
                                timestamp: message.ts,
                                channel: message.channel,
                                name: 'white_check_mark',
                            },function(err) {
                                if (err) { console.log(err) }
                            });
                            bot.api.reactions.add({
                                timestamp: message.ts,
                                channel: message.channel,
                                name: 'question',
                            },function(err) {
                                if (err) { console.log(err) }
                            });
                            bot.api.reactions.add({
                                timestamp: message.ts,
                                channel: message.channel,
                                name: 'x',
                            },function(err) {
                                if (err) { console.log(err) }
                            });
                        });

                    });
                    //Code to create and store the new event
                    controller.storage.events.all(function(err, all_team_data) {
                        var newId = all_team_data.length + 1,
                            event = new Event(eTitle, eDescription, eDateTime, eLocation);
                        //Botkit Method To Storage
                        if(!eventId) {
                            controller.storage.events.save({id: 'event_' + newId, event_data: event}, function(err) {});

                        } else {
                            controller.storage.events.save({id: eventId, event_data: event}, function(err) {});
                        }

                    });
                } else {
                    //Handle Error
                }
            });
        });
    };
    //Conversation Controller "NEW EVENT"
    controller.hears('new event',['direct_message','direct_mention'],function(bot,message) {
        conversation(bot, message, false);
    });
    //Conversation Controller "EDIT EVENT"
    controller.hears('edit (.*)',['direct_message','direct_mention'],function(bot,message) {
        var eventId = message.match[1];
        //Start Conversation
        conversation(bot, message, eventId);
    });

    controller.hears('attend (.*)',['direct_message','direct_mention'],function(bot,message) {
        var eventId = message.match[1];
        var user = message.user;

        //Start Conversation


        controller.storage.rsvp.save({id: 'event_' + eventId, attend: [user]}, function(err) {});
        //controller.storage.rsvp.save({id: 'event_' + eventId, attend: [user]}, function(err) {});


        controller.storage.rsvp.get(eventId, function(err, attend_data) {
            console.log(attend_data);
        });

    });
};
