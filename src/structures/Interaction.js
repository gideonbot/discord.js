'use strict';

const APIMessage = require('./APIMessage');
const Base = require('./Base');
const Snowflake = require('../util/Snowflake');

/**
 * Represents an interaction, see {@link InteractionClient}.
 * @extends {Base}
 */
class Interaction extends Base {
  constructor(client, data, syncHandle) {
    super(client);
    this.syncHandle = syncHandle;
    this._patch(data);
  }

  _patch(data) {
    /**
     * The ID of this interaction.
     * @type {Snowflake}
     */
    this.id = data.id;

    /**
     * The token of this interaction.
     * @type {string}
     */
    this.token = data.token;

    /**
     * The ID of the invoked command.
     * @type {Snowflake}
     */
    this.commandID = data.data.id;

    /**
     * The name of the invoked command.
     * @type {string}
     */
    this.commandName = data.data.name;

    /**
     * The options passed to the command.
     * @type {Object}
     */
    this.options = data.data.options;

    /**
     * The channel this interaction was sent in.
     * @type {Channel}
     */
    this.channel = this.client.channels?.cache.get(data.channel_id);

    /**
     * The guild this interaction was sent in, if any.
     * @type {?Guild}
     */
    this.guild = data.guild_id ? this.client.guilds?.cache.get(data.guild_id) : null;

    /**
     * If this interaction was sent in a guild, the member which sent it.
     * @type {?Member}
     */
    this.member = data.member ? this.guild?.members.add(data.member, false) : null;
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
   * Acknowledge this interaction without content.
   */
  async acknowledge() {
    await this.syncHandle.acknowledge();
  }

  /**
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
      if (Array.isArray(apiMessage.data.content)) {
        throw new Error('Message is too long');
      }
    }

    const resolved = await apiMessage.resolveFiles();

    if (!this.syncHandle.reply(resolved)) {
      const clientID =
        this.client.interactionClient.clientID || (await this.client.api.oauth2.applications('@me').get()).id;

      await this.client.api.webhooks(clientID, this.token).post({
        auth: false,
        data: resolved.data,
        files: resolved.files,
      });
    }
  }
}

module.exports = Interaction;
