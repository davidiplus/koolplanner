module.exports.init = function(controller) {

    //Alert Attenddes Users
    function alertAttendees(customMessage, eventId) {
        controller.storage.rsvp.all(function(err, all_attend_data) {
            var length = all_attend_data.length,
                attendees;
            //Iterate Over Event's Attenddes
            for(var i=0; i<length; i++) {
                if(all_attend_data[i].id == eventId) {
                    //Get Event Attenddes
                    attendees = all_attend_data[i].attend;
                    break;
                }
            }
            //Iterate Over Attenddes Obj And Get User's Names
            for(var prop in attendees){
                bot.api.users.info({user: prop}, function(err, user) {
                    convo.say('Hey ' + user.user.real_name + '!\n' + customMessage);
                });
            }
        });
    }

    //Event Constructor
    var Event = function(name, description, dateTime, location, mTimeStamp, mChannel) {
        this.title = name;
        this.description = description;
        this.dateTime = dateTime;
        this.location = location;
        this.mTimeStamp = mTimeStamp;
        this.mChannel = mChannel;
    };
    //Creation, Editing and Attend Conversation
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
            convo.ask('When will take place (format: mm/dd/yyyy hh:mm)?', [
                {
                    //Test The Date Against This RegExp To Match The Format
                    pattern: new RegExp("^[0-9]{1,2}/[0-9]{1,2}/[0-9]{1,4} [0-9]{1,2}:[0-9]{1,2}$", "g"),
                    callback: function(response, convo) {
                        //Get Event Location
                        convo.ask('Where will it take place?', function(response, convo) {
                            convo.next();
                        }, {'key': 'location'});
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.repeat();
                        convo.next();
                    }
                }
            ], {'key': 'dateTime'});
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
                            /*
                            * CRON PARA SALVAR CADA TANTO LAS REACTIONS Y TAMBIEN HAY QUE SALVAR
                            * LOS DATOS DE LOS REACTIONS EN EL EVENTO
                            * */
                            //Send Reactions
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
                            event = new Event(eTitle, eDescription, eDateTime, eLocation, message.ts, message.channel);
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
    //Listing Conversation
    var listing = function(bot, message, eventId) {
        //Start Conversation
        bot.startConversation(message, function(err, convo) {
            //Get List Of Attenddes
            controller.storage.rsvp.all(function(err, all_attend_data) {
                var length = all_attend_data.length,
                    attendees;
                //Get Event Title
                var reply_with_attachments = {
                    'attachments': [
                        {
                            'title': 'Here are the attendees for ' + eventId,
                            'color': '#7CD197'
                        }
                    ]
                };
                bot.reply(message, reply_with_attachments);
                //Iterate Over Event's Attenddes
                for(var i=0; i<length; i++) {
                    if(all_attend_data[i].id == eventId) {
                        //Get Event Attenddes
                        attendees = all_attend_data[i].attend;
                        break;
                    }
                }
                //Iterate Over Attenddes Obj And Get User's Names
                for(var prop in attendees){
                    bot.api.users.info({user: prop}, function(err, user) {
                        convo.say(user.user.real_name);
                    });
                }
            });
            convo.stop();
        });
    };
    //Listing Events
    var listEvents = function(bot, message) {
        //Start Conversation
        bot.startConversation(message, function(err, convo) {
            //Get List Of Attenddes
            controller.storage.events.all(function(err, all_events_data) {
                //Get Today's Date
                var date = new Date(),
                    day = date.getDate(),
                    month = date.getMonth() + 1,
                    year = date.getFullYear(),
                    formatDate = month + '/' + day + '/' + year;
                //Iterate Over All Events
                var eventsLength = all_events_data.length;
                futureEvents = [];
                for(var i=0;i<eventsLength;i++) {
                    var eventDate = all_events_data[i].event_data.dateTime.replace(/( )[0-9]{2}:[0-9]{2}/g, '');
                    //Push Future Events Into List
                    if(new Date(eventDate) > new Date(formatDate)) {
                        futureEvents.push(all_events_data[i]);
                    }
                }
                //Reply With Future Events
                bot.startConversation(message, function(err,convo) {
                    bot.say(
                        {
                            text: 'Here are the are the upcoming events for your team:\nFor more info on an event, type "list"\+\<event_id\>\nTo attend an event, type "attend"\+\<event_id\>',
                            channel: message.channel
                        }
                    );
                    //List
                    var futureLength = futureEvents.length;
                    for(var j=0;j<futureLength;j++) {
                        console.log(futureEvents[j].event_data.title);
                        bot.reply(message, {
                            "attachments": [
                                {
                                    "pretext": 'Event ID: ' + futureEvents[j].id,
                                    "title": futureEvents[j].event_data.title,
                                    "color": '#3498db',
                                    "fields": [
                                        {
                                            "title": 'Date',
                                            "value": futureEvents[j].event_data.dateTime,
                                            "short": true
                                        },
                                        {
                                            "title": 'Location',
                                            "value": futureEvents[j].event_data.location,
                                            "short": true
                                        }
                                    ]
                                }
                            ]
                        });
                    }
                    //Offer More Events
                    //End Conversation
                    convo.stop();
                });
            });
            convo.stop();
        });
    };
    //Notify Upcoming Events
    var notifyUpcoming = function(bot, message) {
        //Get Actual Date
        var date = new Date(),
            day = date.getDate(),
            month = date.getMonth() + 1,
            year = date.getFullYear(),
            tHour = date.getHours() + ':' + date.getMinutes(),
            today = month + '/' + day + '/' + year;
        //Retrieve All Events
        controller.storage.events.all(function(err, all_events_data) {
            var length = all_events_data.length;
            for(var i=0;i<length;i++) {
                var eHour = all_events_data[i].event_data.dateTime.replace(/[0-9]{2}\/[0-9]{2}\/[0-9]{4} /, ''),
                    eDate = all_events_data[i].event_data.dateTime.replace(/ [0-9]{2}:[0-9]{2}/, ''),
                    todayFormatted = new Date(today),
                    dateFormatted =  new Date(eDate);
                //Compare Year And Month
                if((todayFormatted.getFullYear() == dateFormatted.getFullYear()) && (todayFormatted.getMonth()+1 == dateFormatted.getMonth()+1)) {
                    var daysLeft = dateFormatted.getDate() - todayFormatted.getDate();
                    //If *daysLeft results negative it means that the event already past(ex: yesterday).
                    switch (daysLeft) {
                        case 7:
                            //Code to notify users
                            console.log('Falta una semana para este evento');
                            break;
                        case 1:
                            alertAttendees('Falta una hora para el evento', all_events_data[i].id);
                            eHour = eHour.replace(':','');
                            tHour = tHour.replace(':','');
                            var timeLeft = parseInt(parseFloat(eHour) - parseFloat(tHour));
                            if(timeLeft == 100) {
                                console.log('Falta una hora para este evento');
                            }
                            break;
                    }
                }
            }
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
    //Conversation Controller "ATTEND EVENT"
    controller.hears('attend (.*)',['direct_message','direct_mention'],function(bot,message) {
        //TODO: add a validation to check if received event exists.
        var eventId = message.match[1];
        //Get User
        var user = message.user;
        //Get Attenddes List
        controller.storage.rsvp.get('event_' + eventId, function(err, attend_data) {
            console.log(attend_data);
            var attend = {};
            //Check If Attend's Already Exists
            if (attend_data != null && typeof attend_data.attend != "undefined") {
                attend = attend_data.attend;
            }
            attend[user] = true;
            //Save Attend
            controller.storage.rsvp.save({id: 'event_' + eventId, attend:attend}, function(err) {});
        });

    });
    //Conversation Controller "LIST ATTENDS"
    controller.hears('list (.*)',['direct_message','direct_mention'],function(bot,message) {
        var eventId = message.match[1];
        //Start Conversation
        listing(bot, message, eventId);
    });
    //Conversation Controller "REACTIONS"
    controller.hears('reactions of (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Start Conversation
        var eventId = message.match[1];
        //Search Event In DB
        controller.storage.events.get(eventId, function(err, event) {
            console.log(event.event_data);
            //Get Reactions
            bot.api.reactions.get({
                channel: event.event_data.mChannel,
                timestamp: event.event_data.mTimeStamp
            }, function(err, reactions) {
                console.log("El err es:" + err);
                console.log(reactions);
            });
        });
    });
    //Conversation Contoller "LIST FUTURE EVENTS"
    controller.hears('events',['direct_message','direct_mention'],function(bot,message) {
        listEvents(bot, message);
    });
    //Scheduled Function To Notify Users For An Upcoming Event
    controller.hears('notify',['direct_message','direct_mention'],function(bot,message) {
        notifyUpcoming(bot, message);
    });
};
