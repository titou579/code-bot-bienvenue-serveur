const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const http = require('http');

// Mini serveur web pour Render
http.createServer((req, res) => {
   res.write("Le bot est en ligne !");
   res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const SALON_ID = "1519746058656153680"; // Ton salon de bienvenue

// ID de la catégorie où les tickets vont s'ouvrir (Optionnel)
const CATEGORIE_TICKETS_ID = ""; 

client.once('ready', () => {
    console.log(`Le bot ${client.user.tag} est en ligne !`);
});

// --- BIENVENUE ---
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(SALON_ID);
    if (!channel) return;
    channel.send(`Bienvenue sur le serveur **${member.guild.name}**, ${member} ! 🎉`);
});

// --- COMMANDE POUR CONFIGURER LE RÈGLEMENT ---
// Tape "!setup-regles" dans ton salon #règles
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup-regles') {
        // Vérifie si l'utilisateur est administrateur
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("Tu dois être administrateur pour configurer le règlement.");
        }

        const embedReglement = {
            title: "📜 RÈGLEMENT DU SERVEUR",
            description: "Bienvenue sur **Les fans de Brawl stars** ! Pour que le serveur reste agréable, amical et sécurisé pour tout le monde, merci de lire et de respecter scrupuleusement les règles ci-dessous.\n\n⠀",
            color: 0xFFAA1A, // Un joli jaune/orange doré style Brawl Stars
            thumbnail: {
                url: message.guild.iconURL({ dynamic: true }) || null
            },
            fields: [
                {
                    name: "1. Respect et bienveillance avant tout",
                    value: "Le respect mutuel est la règle d'or. Les insultes, provocations, discriminations (racisme, sexisme, homophobie, etc.) et les propos haineux ne seront pas tolérés, que ce soit en public ou en message privé (MP)."
                },
                {
                    name: "2. Pas de harcèlement ni de toxicité",
                    value: "Le harcèlement, l'intimidation, le chantage ou le comportement toxique visant à nuire à un autre membre ou à l'équipe de modération entraîneront un bannissement immédiat."
                },
                {
                    name: "3. Contenu approprié (Pas de NSFW)",
                    value: "Le serveur est un espace public destiné à tous. Le partage de contenus choquants, violents, pornographiques (NSFW), illégaux ou politiquement sensibles est strictement interdit."
                },
                {
                    name: "4. Utilisation correcte des salons",
                    value: "Merci de respecter le thème de chaque salon textuel et vocal (ex : pas de discussions générales dans le salon dédié aux médias, pas de spam dans les salons de jeu)."
                },
                {
                    name: "5. Interdiction du spam et du flood",
                    value: "Le spam (envoi de messages répétés), le flood (écriture en majuscules excessives, spam d'emojis) et les mentions inutiles (@everyone, @here ou pings répétés des modérateurs) sont interdits."
                },
                {
                    name: "6. Publicité et démarchage interdits",
                    value: "La publicité non sollicitée (liens vers d'autres serveurs Discord, chaînes Twitch/Youtube personnelles, réseaux sociaux) est interdite dans les salons et en MP aux membres, sauf dans les espaces explicitement prévus à cet effet."
                },
                {
                    name: "7. Protection de la vie privée (Pas de Doxxing)",
                    value: "Ne partagez jamais les informations personnelles d'autres membres (nom réel, adresse, photos, réseaux privés) sans leur consentement explicite. La sécurité de chacun est une priorité."
                },
                {
                    name: "8. Profils corrects (Pseudos et Avatars)",
                    value: "Vos pseudos, statuts et photos de profil doivent respecter les autres règles du serveur (pas d'insultes, pas de contenu choquant). L'équipe se réserve le droit de vous demander de les modifier."
                },
                {
                    name: "9. Respect des décisions de la modération",
                    value: "L'équipe de modération est là pour assurer le bon fonctionnement du serveur. Leurs décisions (avertissements, mutes, ban) doivent être respectées. Si vous contestez une sanction, faites-le calmement en MP avec un administrateur."
                }
            ],
            footer: {
                text: "L'équipe de modération • Merci de respecter ces règles pour le bien de tous !"
            },
            timestamp: new Date()
        };

        await message.channel.send({ embeds: [embedReglement] });
        await message.delete(); // Supprime la commande !setup-regles pour que ce soit propre
    }
});

// --- COMMANDE POUR ENVOYER LE PANNEAU DE TICKET ---
// Tape "!setup-ticket" dans le salon où tu veux afficher le bouton de ticket
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("Tu dois être administrateur pour configurer le système de ticket.");
        }

        const embed = {
            title: "🎫 Besoin d'aide ?",
            description: "Si tu as un problème, une question ou besoin de contacter le staff, clique sur le bouton ci-dessous pour ouvrir un ticket de support.",
            color: 0x5865F2,
        };

        const bouton = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Ouvrir un ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📩');

        const row = new ActionRowBuilder().addComponents(bouton);

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete();
    }
});

// --- GESTION DU BOUTON DE TICKET ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const user = interaction.user;
        const channelName = `ticket-${user.username}`.toLowerCase();

        const existingChannel = guild.channels.cache.find(c => c.name === channelName);
        if (existingChannel) {
            return interaction.editReply({ content: `Tu as déjà un ticket ouvert ici : ${existingChannel}`, ephemeral: true });
        }

        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: CATEGORIE_TICKETS_ID || null,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
            ],
        });

        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Fermer le ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒');

        const row = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({
            content: `Bonjour ${user}, bienvenue dans ton ticket. Le staff va t'aider d'ici quelques instants.`,
            components: [row]
        });

        await interaction.editReply({ content: `Ton ticket a été créé avec succès : ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: "Fermeture du ticket dans 5 secondes..." });
        
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error("Impossible de supprimer le salon :", error);
            }
        }, 5000);
    }
});

client.login(TOKEN);