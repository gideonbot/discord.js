'use strict';

const Base = require('./Base');

/**
 * Represents a ban of a guild on Discord.
 * @extends {Base}
 */
class GuildBan extends Base {
  /**
   * @param {Client} client The instantiating client
   * @param {Object} data The data for the ban
   * @param {Guild} guild The guild the ban is part of
   */
  constructor(client, data, guild) {
    super(client);

    /**
     * The guild that this member is part of
     * @type {Guild}
     */
    this.guild = guild;

    /**
     * The reason for the ban
     * @type {?string}
     */
    this.reason = null;

    /**
     * The user this ban applies to
     * @type {User}
     */
    this.user = null;

    if (data) this._patch(data);
  }

  _patch(data) {
    if ('user' in data) this.user = this.client.users.add(data.user, true);
    if ('reason' in data) this.reason = data.reason;
  }

  /**
   * Whether this GuildBan is a partial
   * If the reason is not provided the value is null
   * @type {boolean}
   * @readonly
   */
  get partial() {
    return this.reason === undefined;
  }

  /**
   * Fetches this GuildBan.
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<GuildBan>}
   */
  fetch(force = false) {
    return this.guild.bans.fetch({ user: this.user, cache: true, force });
  }
}

module.exports = GuildBan;
