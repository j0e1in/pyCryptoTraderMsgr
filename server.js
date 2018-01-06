'use strict';

require('dotenv').config()
const BootBot = require('bootbot');


const bot = new BootBot({
    accessToken: process.env.FB_ACCESS_TOKEN,
    verifyToken: process.env.FB_VERIFY_TOKEN,
    appSecret: process.env.FB_APP_SECRET
});

bot.hear(['hello', 'info', 'help', 'command'], (payload, chat) => {
    chat.say('Commands:').then(() => {
        chat.say("1. Summary\n2. ORDER\n3. MARGIN");
    });
});


bot.hear('ORDER', (payload, chat) => {
	const twoFactorAuthentication = (convo) => {
		convo.ask(`Please enter the 2FA code:`, (payload, convo) => {
            const text = payload.message.text;
            
            const isVerified = true;
            // TODO: check if 2fa is correct
            if ( isVerified ) {
                convo.say(`2FA verified!`).then(() => askFavoriteFood(convo));
            } else {
                let tryCount = convo.get('triedCount') ? convo.get('triedCount') : 0;
                
                if (tryCount > 4) {
                    convo.say('Error too many times! Leaving conversation');
                    convo.end();
                } else {
                    convo.set('triedCount', ++tryCount);
                    convo.say(`Wrong 2FA code, please try it again!`).then(() => twoFactorAuthentication(convo));
                }
            }
			
		});
	};

	const askFavoriteFood = (convo) => {
		convo.ask(`What's your favorite food?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set('food', text);
			convo.say(`Got it, your favorite food is ${text}`).then(() => sendSummary(convo));
		});
	};

	const sendSummary = (convo) => {
		convo.say(`Ok, here's what you told me about you:
	      - Name: ${convo.get('name')}
	      - Favorite Food: ${convo.get('food')}`);
      convo.end();
    };
    
    chat.conversation((convo) => {
		twoFactorAuthentication(convo);
	});
});

bot.start();