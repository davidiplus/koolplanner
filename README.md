# KoolPlanner

KoolPlanner is a bot destined to help people plan events.

It is based on the module concept of NodeJS

* [Slack](http://api.slack.com)
* [Facebook Messenger](http://developers.facebook.com)


## Prerequisites

In order to run the bot, you will need to have node and npm installed.

For development purpose, you will have to create your own
organization on slack and register a new bot in the menu "Custom Integrations"
of slack's app manager.

At last, you will have to go to the "Dev Mode" tab on the BeepBoop KoolPlanner interface
https://beepboophq.com/0_o/my-projects/ab9f5ec2d5a34732950591961083dc66/develop
And add your custom slack organization to the "Test Teams".

Write down the environment variables from the BeepBoop Dev Mode page,
you will need it to launch the bot with the correct configuration.

The "bot-token" used later can be found on the custom bot page on slack under
"Integration Settings" -> "API Token".

## Installation


```

npm install
```

## Running

```

cd [bot-folder]
token=[bot-token] node index.js
```

## Running as a Service using

```

cd [bot-folder]
token=[bot-token] pm2 start index.js
```