'use strict';

const fs = require('fs');
const { inspect } = require('util');
const crypto = require('crypto');
const PageBot = require('./PageBot');

const notificationModule = require('../notification').module;

// read configs

class PagesManager {

    constructor ( file_path, app ) {
        const data = JSON.parse(fs.readFileSync(file_path, 'utf8'));
        this.app = app;
        this.pagesData = data.pages;
        this.accountsData = data.accounts;
        this._createMappings();
        this._createBots(); 
    }

    webhookValidation( verify_token ) {
        for (let page_id in this.pagesData) {
            if ( verify_token === this.pagesData[page_id].fb_secrets.FB_VERIFY_TOKEN )
                return true;
        }
        return false;
    }


    broadcast (msg, level = 0) {
        for (let page_id in this.bots)
            this.bots[page_id].broadcast(msg, level);
    }

    notify ( username, type, data) {
        let page_id = this.username2page[username];
        if (page_id)
            this.bots[page_id].notify( username, type, data);
    }

    handlePostData ( page_id, data ) {
        for (let pid in this.bots)
            if (page_id.toString() === pid){
                this.bots[pid].handlePostData(data);
                break;
            }
    }


    _createMappings () {
        this.username2page = {};

        for (let page_id in this.pagesData)
            this.pagesData[page_id].user_lists.forEach(e => {
                this.username2page[e] = page_id;
            })
    }

    _createBots () {
        this.bots = {};
        for (let page_id in this.pagesData){
            let e = this.pagesData[page_id];
            let user_list_mapping = {};
            e.user_lists.forEach(e => {
                user_list_mapping[e] = {
                    'name': e,
                    'default_exchange': this.accountsData[e].default_exchange,
                    'uid' : this.accountsData[e].user_id,
                    'perm' : this.accountsData[e].bot_permission || 0,
                    'subscription': this.accountsData[e].subscription,
                }
            })

            this.bots[page_id] = new PageBot(e.name, user_list_mapping, e.fb_secrets.FB_APP_SECRET, e.fb_secrets.FB_ACCESS_TOKEN, e.fb_secrets.FB_VERIFY_TOKEN, e.subscribed_service);
        }
        notificationModule.apply(this, [this, this.app, this.bots, this.accountsData, this.broadcast]);
    }

}

module.exports = PagesManager;