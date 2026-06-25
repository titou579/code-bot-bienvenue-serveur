const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const http = require('http');

// Mini serveur web pour Render
http.createServer((req, res) => {
   res.write("Le bot est en ligne !");
   res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates // Essentiel pour détecter quand un membre rejoint/quitte un salon vocal
    ]
});

// Configuration de ton serveur
const CONFIG = {
    WELCOME_CHANNEL_ID: '1519746058656153680', // Ton salon de bienvenue
    CATEGORY_TICKETS_ID: '', // ID de la catégorie ticket (optionnel)
    ROLE_STAFF_ID: '', // ID de ton rôle Modérateur/Staff (optionnel)
    VOICE_CREATOR_CHANNEL_ID: '1519782037215776952' // Ton salon "➕ Créer un salon"
};

// Stockage des salons vocaux temporaires créés
const tempVoiceChannels = new Map();

client.once('ready', () => {
    console.log(`Le bot ${client.user.tag} est en ligne et paré pour toutes les fonctionnalités !`);
});

// ================= FONTIONNALITÉ : BIENVENUE =================
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle('🎉 Bienvenue sur le serveur !')
        .setDescription(`Bienvenue à toi ${member} parmi **les fans de Brawl Stars** ! Passe un super moment avec nous !`)
        .setColor('#FF9900')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    channel.send({ embeds: [embed] });
});

// ================= FONTIONNALITÉ : COMMANDES SETUP (TICKETS & RÈGLES) =================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // Commandes pour les tickets
    if (message.content === '!setup-ticket') {
        await message.delete();

        const embed = new EmbedBuilder()
            .setTitle('💎 Besoin d\'aide ?')
            .setDescription('Si tu as un problème, une question ou besoin de contacter le staff, clique sur le bouton ci-dessous pour ouvrir un ticket de support.')
            .setColor('#4361EE');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Ouvrir un ticket')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    // Commande pour le règlement (Avec tout ton texte complet)
    if (message.content === '!setup-regles') {
        await message.delete();

        const embed = new EmbedBuilder()
            .setTitle('📜 Règlement du Serveur')
            .setDescription('Bienvenue sur le serveur ! Merci de respecter ces quelques règles de bonne conduite pour que l\'espace reste agréable pour tous.')
            .setColor('#FFCC00')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '1. Respect et bienveillance avant tout', value: 'Le respect mutuel est la règle d\'or. Les insultes, provocations, discriminations (racisme, sexisme, homophobie, etc.) et les propos haineux ne seront pas tolérés, que ce soit en public ou en message privé (MP).' },
                { name: '2. Pas de harcèlement ni de toxicité', value: 'Le harcèlement, l\'intimidation, le chantage ou le comportement toxique visant à nuire à un autre membre ou à l\'équipe de modération entraîneront un bannissement immédiat.' },
                { name: '3. Contenu approprié (Pas de NSFW)', value: 'Le serveur est un espace public destiné à tous. Le partage de contenus choquants, violents, pornographiques (NSFW), illégaux ou politiquement sensibles est strictement interdit.' },
                { name: '4. Utilisation correcte des salons', value: 'Merci de respecter le thème de chaque salon textuel et vocal (ex : pas de discussions générales dans le salon dédié aux médias, pas de spam dans les salons de jeu).' },
                { name: '5. Interdiction du spam et du flood', value: 'Le spam (envoi de messages répétés), le flood (écriture en majuscules excessives, spam d\'emojis) et les mentions inutiles (@everyone, @here ou ping répété des modérateurs) sont interdits.' },
                { name: '6. Publicité et démarchage interdits', value: 'La publicité non sollicitée (liens vers d\'autres serveurs Discord, chaînes Twitch/YouTube personnelles, réseaux sociaux) est interdite dans les salons et en MP aux membres, sauf dans les espaces explicitement prévus à cet effet.' },
                { name: '7. Protection de la vie privée (Pas de Doxxing)', value: 'Ne partagez jamais les informations personnelles d\'autres membres (nom réel, adresse, photos, réseaux privés) sans leur consentement explicite. La sécurité de chacun est une priorité.' },
                { name: '8. Profils corrects (Pseudos et Avatars)', value: 'Vos pseudos, statuts et photos de profil doivent respecter les autres règles du serveur (pas d\'insultes, pas de contenu choquant). L\'équipe se réserve le droit de vous demander de les modifier.' },
                { name: '9. Respect des décisions de la modération', value: 'L\'équipe de modération est là pour assurer le bon fonctionnement du serveur. Leurs décisions (avertissements, mutes, ban) doivent être respectées. Si vous contestez une sanction, faites-le calmement en MP avec un administrateur.' }
            )
            .setFooter({ text: 'L\'équipe de modération de les fans de Brawl Stars' });

        await message.channel.send({ embeds: [embed] });
    }
});

// ================= FONTIONNALITÉ : GESTION DU BOUTON TICKET =================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() || interaction.customId !== 'open_ticket') return;

    await interaction.deferReply({ ephemeral: true });

    const ticketName = `ticket-${interaction.user.username}`;
    const channel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: CONFIG.CATEGORY_TICKETS_ID || null,
        permissionOverwrites: [
            { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: CONFIG.ROLE_STAFF_ID || interaction.guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle('🎟️ Ticket Ouvert')
        .setDescription(`Bonjour ${interaction.user}, l'équipe de modération a été alertée. Tu peux expliquer ton problème ici.`)
        .setColor('#2ECC71')
        .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.editReply({ content: `Ton ticket a été créé avec succès ici : ${channel}`, ephemeral: true });
});

// ================= FONTIONNALITÉ : SALONS VOCAUX TEMPORAIRES =================
client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;

    // Cas 1 : L'utilisateur rejoint le salon vocal "Créateur"
    if (newState.channelId === CONFIG.VOICE_CREATOR_CHANNEL_ID) {
        try {
            // Création du salon vocal temporaire au nom du joueur
            const tempChannel = await newState.guild.channels.create({
                name: `🎮 Salon de ${user.username}`,
                type: ChannelType.GuildVoice,
                parent: newState.channel.parent, // Se crée dans la même catégorie
            });

            // On garde en mémoire le salon créé
            tempVoiceChannels.set(tempChannel.id, tempChannel.id);

            // On déplace automatiquement le joueur dedans
            await newState.member.voice.setChannel(tempChannel);
        } catch (error) {
            console.error("Erreur lors de la création du salon vocal :", error);
        }
    }

    // Cas 2 : Un utilisateur quitte un salon (ancien statut)
    if (oldState.channelId) {
        const oldChannel = oldState.channel;
        
        // Si ce salon fait partie de notre liste de salons temporaires et qu'il est désormais vide
        if (tempVoiceChannels.has(oldChannel.id) && oldChannel.members.size === 0) {
            try {
                await oldChannel.delete();
                tempVoiceChannels.delete(oldChannel.id); // On le retire de la mémoire
            } catch (error) {
                console.error("Erreur lors de la suppression du salon vocal vide :", error);
            }
        }
    }
});

client.login(process.env.TOKEN);
