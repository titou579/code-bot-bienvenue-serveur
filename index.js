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

// ID de la catégorie où les tickets vont s'ouvrir (Optionnel - à remplir si tu veux)
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

// --- COMMANDE POUR ENVOYER LE PANNEAU DE TICKET ---
// Tape "!setup-ticket" dans le salon où tu veux afficher le bouton de ticket
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup-ticket') {
        // Vérifie si l'utilisateur est administrateur
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
        await message.delete(); // Supprime le "!setup-ticket" pour que ce soit propre
    }
});

// --- GESTION DU BOUTON DE TICKET ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const user = interaction.user;

        // Nom du salon de ticket (ex: ticket-titou579)
        const channelName = `ticket-${user.username}`.toLowerCase();

        // Vérifier si l'utilisateur a déjà un ticket ouvert
        const existingChannel = guild.channels.cache.find(c => c.name === channelName);
        if (existingChannel) {
            return interaction.editReply({ content: `Tu as déjà un ticket ouvert ici : ${existingChannel}`, ephemeral: true });
        }

        // Création du salon privé
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: CATEGORIE_TICKETS_ID || null, // Se met dans la catégorie si l'ID est rempli
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel], // Bloque tout le monde
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory], // Autorise l'auteur du ticket
                },
                // Les administrateurs verront automatiquement le salon
            ],
        });

        // Message à l'intérieur du ticket
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

    // Gestion de la fermeture du ticket
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
