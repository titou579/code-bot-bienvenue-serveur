const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// Mini serveur web pour que Render garde le bot en vie H24
http.createServer((req, res) => {
   res.write("Le bot est en ligne !");
   res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// Remplace ici par tes informations de connexion
const TOKEN = process.env.TOKEN;
const SALON_ID = "1519746058656153680"; 

client.once('ready', () => {
    console.log(`Le bot ${client.user.tag} est en ligne !`);
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(SALON_ID);
    if (!channel) return;
    
    // Message de bienvenue personnalisé
    channel.send(`Bienvenue sur le serveur **${member.guild.name}**, ${member} ! 🎉`);
});

client.login(TOKEN);
