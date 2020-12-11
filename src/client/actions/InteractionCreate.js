'use strict';

const Action = require('./Action');
const Interaction = require('../../structures/Interaction');
const { Events } = require('../../util/Constants');

class InteractionCreateAction extends Action {
  handle(data) {
    const client = this.client;
    const channel = this.getChannel(data);
    const guild = client.guilds.cache.get(data.guild_id);
    if (!channel || !guild) return false;
    const member = this.getMember(data.member, guild);

    const interactionData = Object.assign(data, { channel, guild, member });
    const interaction = new Interaction(client, interactionData);
    /**
     * Emitted when an interaction is created.
     * @event Client#interactionCreate
     * @param {Interaction} interaction The interaction that was created
     */
    client.emit(Events.INTERACTION_CREATE, interaction);
    return { interaction };
  }
}

module.exports = InteractionCreateAction;
