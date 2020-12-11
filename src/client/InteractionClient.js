'use strict';

const BaseClient = require('./BaseClient');
const APIMessage = require('../structures/APIMessage');
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

    this.handler = handler;
    this.token = options.token;
    this.publicKey = options.publicKey ? Buffer.from(options.publicKey, 'hex') : undefined;
    this.clientId = options.clientId;

    // Compat for direct usage
    this.client = client || this;
    this.interactionClient = this;
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
        const interaction = new Interaction(this.client, data);

        let done = false;
        const r0 = new Promise(resolve => {
          this.client.setTimeout(() => {
            done = true;
            resolve({
              type: InteractionResponseType.ACKNOWLEDGE_WITH_SOURCE,
            });
          }, 500);
        });
        const r1 = this.handler(interaction).then(async r => {
          if (done) {
            interaction.reply(r).catch(e => {
              this.client.emit('error', e);
            });
            return undefined;
          }

          let apiMessage;

          if (r instanceof APIMessage) {
            apiMessage = r.resolveData();
          } else {
            apiMessage = APIMessage.create(interaction, r).resolveData();
            if (Array.isArray(apiMessage.data.content)) {
              throw new Error();
            }
          }

          const resolved = await apiMessage.resolveFiles();
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: resolved.data,
          };
        });

        const result = await Promise.race([r0, r1]);

        return result;
      }
      default:
        throw new RangeError('Invalid interaction data');
    }
  }

  middleware() {
    return async (req, res, next) => {
      const timestamp = req.get('x-signature-timestamp');
      const signature = req.get('x-signature-ed25519');

      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);

      if (sodium === undefined) {
        sodium = require('../util/Sodium');
      }
      if (
        !sodium.methods.verify(
          Buffer.from(signature, 'hex'),
          Buffer.concat([Buffer.from(timestamp), body]),
          this.publicKey,
        )
      ) {
        res.status(403).end();
        return;
      }

      const data = JSON.parse(body.toString());

      const result = await this.handle(data);
      res.status(200).end(JSON.stringify(result));

      next();
    };
  }

  async handleFromGateway(data) {
    const interaction = new Interaction(this.client, data);
    await this.handler(interaction);
  }
}

module.exports = InteractionClient;
