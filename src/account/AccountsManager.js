'use strict';

const fs = require('fs');
const Account = require('./Account');

// read configs

class PagesManager {

    constructor ( file_path ) {
        this.accountData = JSON.parse(fs.readFileSync(file_path, 'utf8')).accounts;
    }

    createBots () {
        this.bots = [];
        this.accountData.forEach(e => {
            this.bots.push( new Account(e.name, e.page_id, e.user_id, e.fb_secrets.FB_APP_SECRET, e.fb_secrets.FB_ACCESS_TOKEN, e.fb_secrets.FB_VERIFY_TOKEN) );
        });
    }

    handlePostData ( page_id, data ) {

    }

}

module.exports = PagesManager;