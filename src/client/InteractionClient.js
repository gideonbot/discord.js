'use strict';

const BaseClient = require('./BaseClient');
const Interaction = require('../structures/Interaction');
const { ApplicationCommandOptionType, InteractionType, InteractionResponseType } = require('../util/Constants');

let sodium;

/**
 * Interaction client is used for interactions.
 *
 * ```js
 * const client = new InteractionClient({
 *   token: ABC,
 *   publicKey: XYZ,
 * }, async (interaction) => {
 *   if (will take a long time) {
 *     doSomethingLong.then((d) => {
 *       interaction.reply({
 *         content: 'wow that took long',
 *       });
 *     });
 *     // return null to signal that we will be replying via `interaction.reply`.
 *     return null;
 *   }
 *   return { content: 'hi!' };
 * });
 * ```
 */
class InteractionClient extends BaseClient {
  /**
   * @param {Options} options Options for the client.
   * @param {Handler} handler Handler to handle things.
   * @param {undefined} client For internal use.
   */
  constructor(options, handler, client) {
    super(options);
    this.client = client || this;
    this.handler = handler;
    this.publicKey = options.publicKey ? Buffer.from(options.publicKey, 'hex') : undefined;
  }

  getCommands(guildID) {
    let path = this.client.api.applications('@me');
    if (guildID) {
      path = path.guilds(guildID);
    }
    return path.commands.get();
  }

  createCommand(command, guildID) {
    let path = this.client.api.applications('@me');
    if (guildID) {
      path = path.guilds(guildID);
    }
    return path.commands.post({
      data: {
        name: command.name,
        description: command.description,
        options: command.options.map(function m(o) {
          return {
            type: ApplicationCommandOptionType[o.type],
            name: o.name,
            description: o.description,
            default: o.default,
            required: o.required,
            choices: o.choices,
            options: o.options.map(m),
          };
        }),
      },
    });
  }

  deleteCommand(commandID, guildID) {
    let path = this.client.api.applications('@me');
    if (guildID) {
      path = path.guilds(guildID);
    }
    return path.commands(commandID).delete();
  }

  async handle(data) {
    switch (data.type) {
      case InteractionType.PING:
        return {
          type: InteractionResponseType.PONG,
        };
      case InteractionType.APPLICATION_COMMAND: {
        try {
          const interaction = new Interaction(this.client, data);
          const result = await this.handler(interaction);
          if (result === null) {
            return {
              type: InteractionResponseType.ACKNOWLEDGE,
            };
          }
          // handle result as message resolvable here, probably DRY this branch with code in
          // `Interaction#reply`, except `Interaction#reply` obviously does a POST and this just
          // returns the data.
          throw new Error('fucc');
        } catch (e) {
          this.client.emit('error', e);
          return {
            type: InteractionResponseType.ACKNOWLEDGE,
          };
        }
      }
      default:
        throw new RangeError('Invalid interaction data');
    }
  }

  async handleFromHTTP(body, signature) {
    if (sodium === undefined) {
      sodium = require('../util/Sodium');
    }
    if (!sodium.methods.verify(Buffer.from(signature, 'hex'), Buffer.from(body), this.publicKey)) {
      throw new Error('Invalid signature');
    }
    const data = JSON.parse(body);
    const result = await this.handle(data);
    return JSON.stringify(result);
  }

  async handleFromGateway(data) {
    await this.handle(data);
  }
}

module.exports = InteractionClient;
