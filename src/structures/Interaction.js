'use strict';

const APIMessage = require('./APIMessage');
const Base = require('./Base');
const { InteractionResponseType } = require('../util/Constants');
const Snowflake = require('../util/Snowflake');

/**
 * Represents an interaction, see {@link InteractionClient}.
 * @extends {Base}
 */
class Interaction extends Base {
  constructor(client, data) {
    super(client);
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
    this.channel = this.client.channels.cache.get(data.channel_id);

    /**
     * The guild this interaction was sent in, if any.
     * @type {?Guild}
     */
    this.guild = data.guild_id ? this.client.guilds.cache.get(data.guild_id) : null;

    /**
     * If this interaction was sent in a guild, the member which sent it.
     * @type {?Member}
     */
    this.member = data.member ? this.guild.members.add(data.member, false) : null;
  }

  /**
   * The timestamp the emoji was created at, or null if unicode
   * @type {?number}
   * @readonly
   */
  get createdTimestamp() {
    if (!this.id) return null;
    return Snowflake.deconstruct(this.id).timestamp;
  }

  /**
   * The time the emoji was created at, or null if unicode
   * @type {?Date}
   * @readonly
   */
  get createdAt() {
    if (!this.id) return null;
    return new Date(this.createdTimestamp);
  }

  async reply(content, options) {
    let apiMessage;

    if (content instanceof APIMessage) {
      apiMessage = content.resolveData();
    } else {
      apiMessage = APIMessage.create(this, content, options).resolveData();
      if (Array.isArray(apiMessage.data.content)) {
        throw new Error();
      }
    }

    const { data, files } = await apiMessage.resolveFiles();

    return this.client.api.interactions(this.id, this.token).callback.post({
      data: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data,
      },
      files,
    });
  }
}

module.exports = Interaction;
