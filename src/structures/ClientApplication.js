'use strict';

const Team = require('./Team');
const Application = require('./interfaces/Application');

/**
 * Represents a Client OAuth2 Application.
 * @extends {Application}
 */
class ClientApplication extends Application {
  _patch(data) {
    super._patch(data);

    /**
     * The app's cover image
     * @type {?string}
     */
    this.cover = data.cover_image || null;

    /**
     * The app's RPC origins, if enabled
     * @type {string[]}
     */
    this.rpcOrigins = data.rpc_origins || [];

    /**
     * If this app's bot requires a code grant when using the OAuth2 flow
     * @type {?boolean}
     */
    this.botRequireCodeGrant = typeof data.bot_require_code_grant !== 'undefined' ? data.bot_require_code_grant : null;

    /**
     * If this app's bot is public
     * @type {?boolean}
     */
    this.botPublic = typeof data.bot_public !== 'undefined' ? data.bot_public : null;

    /**
     * The owner of this OAuth application
     * @type {?User|Team}
     */
    this.owner = data.team ? new Team(this.client, data.team) : data.owner ? this.client.users.add(data.owner) : null;
  }

  /**
   * Fetch the commands associated with this application. See {@link InteractionClient}.
   * @returns {ApplicationCommand[]} A list of commands.
   */
  fetchCommands() {
    return this.client.interactionClient.fetchCommands();
  }

  /**
   * Set the commands for this application. See {@link InteractionClient}.
   * @param {ApplicationCommandOptions[]} commands The command description.
   * @returns {ApplicationCommand[]} The created commands.
   */
  setCommands(commands) {
    return this.client.interactionClient.setCommands(commands);
  }

  /**
   * Create a command. See {@link InteractionClient}.
   * @param {ApplicationCommandOptions} command The command description.
   * @returns {ApplicationCommand} The created command.
   */
  createCommand(command) {
    return this.client.interactionClient.createCommand(command);
  }
}

module.exports = ClientApplication;
