'use strict';

const APIMessage = require('./APIMessage');
const Interaction = require('./Interaction');
const Channel = require('../structures/Channel');
const Role = require('../structures/Role');
const User = require('../structures/User');
const { ApplicationCommandOptionType } = require('../util/Constants');
const Snowflake = require('../util/Snowflake');

/**
 * Represents a command interaction, see {@link InteractionClient}.
 * @extends {Interaction}
 */
class CommandInteraction extends Interaction {
  constructor(client, data, syncHandle) {
    super(client, data);

    this.syncHandle = syncHandle;

    /**
     * The ID of the invoked command.
     * @type {Snowflake}
     * @readonly
     */
    this.commandID = data.data.id;

    /**
     * The name of the invoked command.
     * @type {string}
     * @readonly
     */
    this.commandName = data.data.name;

    const map = o => {
      switch (o.type) {
        case ApplicationCommandOptionType.SUB_COMMAND:
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            options: o.options.map(map),
          };
        case ApplicationCommandOptionType.SUB_COMMAND_GROUP:
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            options: o.options.map(map),
          };
        case ApplicationCommandOptionType.STRING:
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            value: o.value,
          };
        case ApplicationCommandOptionType.INTEGER:
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            value: o.value,
          };
        case ApplicationCommandOptionType.BOOLEAN:
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            value: o.value,
          };
        case ApplicationCommandOptionType.USER: {
          const rawUser = data.data.resolved.users[o.value];
          const rawMember = data.data.resolved.members[o.value];
          if (rawMember) {
            rawMember.user = rawUser;
          }
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            user: this.client.users ? this.client.users.add(rawUser, false) : new User(this.client, rawUser),
            member: rawMember ? this.guild?.members.add(rawMember, false) ?? null : null,
          };
        }
        case ApplicationCommandOptionType.CHANNEL: {
          const raw = data.data.resolved.channels[o.value];
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            channel: this.client.channels
              ? this.client.channels.add(raw, false)
              : Channel.create(this.client, raw, this.guild),
          };
        }
        case ApplicationCommandOptionType.ROLE: {
          const raw = data.data.resolved.roles[o.value];
          return {
            name: o.name,
            type: ApplicationCommandOptionType[o.type],
            role: this.guild ? this.guild.roles.add(raw, false) : new Role(this.client, raw, undefined),
          };
        }
        default:
          return o;
      }
    };
    /**
     * The options passed to the command.
     * @type {Object}
     * @readonly
     */
<<<<<<< HEAD
    this.options = data.data.options;
=======
    this.options = data.data.options.map(map);
>>>>>>> 8dbd695f19e98734532e774171be9e813c236a94
  }

  /**
   * The timestamp the interaction was created at.
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return Snowflake.deconstruct(this.id).timestamp;
  }

  /**
   * The time the interaction was created at.
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
<<<<<<< HEAD
   * Acknowledge this interaction without content.
   * @param {Object} [options] Options
   */
  async acknowledge(options = {}) {
    await this.syncHandle.acknowledge(options);
  }

  /**
=======
>>>>>>> 8dbd695f19e98734532e774171be9e813c236a94
   * Reply to this interaction.
   * @param {(StringResolvable | APIMessage)?} content The content for the message.
   * @param {(MessageOptions | MessageAdditions)?} options The options to provide.
   */
  async reply(content, options) {
    let apiMessage;

    if (content instanceof APIMessage) {
      apiMessage = content.resolveData();
    } else {
      apiMessage = APIMessage.create(this, content, options).resolveData();
<<<<<<< HEAD
      if (Array.isArray(apiMessage.data.content)) {
        throw new Error('Message is too long');
      }
=======
>>>>>>> 8dbd695f19e98734532e774171be9e813c236a94
    }

    const resolved = await apiMessage.resolveFiles();

    if (!this.syncHandle.reply(resolved)) {
<<<<<<< HEAD
      const clientID =
        this.client.interactionClient.clientID || (await this.client.api.oauth2.applications('@me').get()).id;

      await this.client.api.webhooks(clientID, this.token).post({
        auth: false,
        data: resolved.data,
        files: resolved.files,
=======
      await this.client.api.webhooks(this.applicationID, this.token).post({
        auth: false,
        data: resolved.data,
        files: resolved.files,
        query: { wait: true },
>>>>>>> 8dbd695f19e98734532e774171be9e813c236a94
      });
    }
  }
}

module.exports = CommandInteraction;
