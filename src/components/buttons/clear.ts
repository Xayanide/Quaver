import { ForceType } from '#src/lib/ReplyHandler.js';
import type { QuaverInteraction } from '#src/lib/util/common.d.js';
import {
    confirmationTimeout,
    MessageOptionsBuilderType,
} from '#src/lib/util/common.js';
import { Check } from '#src/lib/util/constants.js';
import { settings } from '#src/lib/util/settings.js';
import type { ButtonInteraction } from 'discord.js';

export default {
    name: 'clear',
    checks: [
        Check.InteractionStarter,
        Check.ActiveSession,
        Check.InVoice,
        Check.InSessionVoice,
    ],
    async execute(
        interaction: QuaverInteraction<ButtonInteraction>,
    ): Promise<void> {
        const { io } = await import('#src/main.js');
        const player = interaction.client.music.players.get(
            interaction.guildId,
        );
        clearTimeout(confirmationTimeout[interaction.message.id]);
        delete confirmationTimeout[interaction.message.id];
        if (player.queue.tracks.length === 0) {
            await interaction.replyHandler.locale(
                'CMD.CLEAR.RESPONSE.QUEUE_EMPTY',
                {
                    type: MessageOptionsBuilderType.Error,
                    components: [],
                    force: ForceType.Update,
                },
            );
            return;
        }
        player.queue.clear();
        if (settings.features.web.enabled) {
            io.to(`guild:${interaction.guildId}`).emit('queueUpdate', []);
        }
        await interaction.replyHandler.locale('CMD.CLEAR.RESPONSE.SUCCESS', {
            type: MessageOptionsBuilderType.Success,
            components: [],
            force: ForceType.Update,
        });
    },
};
