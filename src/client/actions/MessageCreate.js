'use strict';

const Action = require('./Action');
const { Events, ChannelTypes } = require('../../util/Constants');

class MessageCreateAction extends Action {
  handle(data) {
    const client = this.client;
    let channel = client.channels.cache.get(data.channel_id);

    if (!channel && !data.guild_id) {
      channel = client.channels.add({ id: data.channel_id, type: ChannelTypes.DM, recipients: [data.author] });
    }

    const existing = channel.messages.cache.get(data.id);
    if (existing) return { message: existing };
    const message = channel.messages.add(data);
    const user = message.author;
    let member = message.member;
    channel.lastMessageID = data.id;
    if (user) {
      user.lastMessageID = data.id;
      user.lastMessageChannelID = channel.id;
    }
    if (member) {
      member.lastMessageID = data.id;
      member.lastMessageChannelID = channel.id;
    }

    /**
     * Emitted whenever a message is created.
     * @event Client#message
     * @param {Message} message The created message
     */
    client.emit(Events.MESSAGE_CREATE, message);
    return { message };
  }
}

module.exports = MessageCreateAction;
