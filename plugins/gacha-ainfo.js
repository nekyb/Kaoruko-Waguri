export default {
    commands: ['ainfo', 'animeinfo'],
    tags: ['gacha'],
    help: ['ainfo <nombre del anime>'],

    async execute(ctx) {
        const { text, gachaService } = ctx;

        console.log('[DEBUG ainfo] Comando ejecutado');
        console.log('[DEBUG ainfo] text:', text);
        console.log('[DEBUG ainfo] gachaService:', typeof gachaService);
        console.log('[DEBUG ainfo] gachaService.characters:', Array.isArray(gachaService.characters));
        console.log('[DEBUG ainfo] Total characters:', gachaService.characters?.length);

        // Log first 3 characters
        if (gachaService.characters && gachaService.characters.length > 0) {
            console.log('[DEBUG ainfo] Primer personaje:', JSON.stringify(gachaService.characters[0], null, 2));
            console.log('[DEBUG ainfo] Segundo personaje source:', gachaService.characters[1]?.source);
            console.log('[DEBUG ainfo] Tercer personaje source:', gachaService.characters[2]?.source);
        }

        if (!text) {
            return await ctx.reply('ꕤ Debes especificar el nombre de un anime.\nEjemplo: #ainfo Naruto');
        }

        // Remove the command from the text (e.g., "#ainfo Konosuba" -> "Konosuba")
        const cleanText = text.replace(/^#?\w+\s+/, '').trim();
        const searchTerm = cleanText.toLowerCase();

        console.log('[DEBUG ainfo] Text original:', text);
        console.log('[DEBUG ainfo] Text limpio:', cleanText);
        console.log('[DEBUG ainfo] Buscando:', searchTerm);

        // Search for characters from the specified anime
        const charactersFromAnime = gachaService.characters.filter(char => {
            console.log('[DEBUG ainfo] Revisando:', char.name, '| source:', char.source);
            const hasSource = char.source && char.source.toLowerCase().includes(searchTerm);
            if (hasSource) {
                console.log('[DEBUG ainfo] ✓ Encontrado:', char.name, 'de', char.source);
            }
            return hasSource;
        });

        console.log('[DEBUG ainfo] Total encontrados:', charactersFromAnime.length);

        if (charactersFromAnime.length === 0) {
            return await ctx.reply(`ꕤ No se encontraron personajes del anime "${text}" en el gacha.`);
        }

        // Sort by rarity (assuming higher value = rarer)
        charactersFromAnime.sort((a, b) => b.value - a.value);

        // Build message
        let message = `🎌 *Personajes de "${text}"*\n\n`;
        message += `📊 Total: ${charactersFromAnime.length} personajes\n\n`;

        // Group by rarity
        const rarityGroups = {};
        charactersFromAnime.forEach(char => {
            const rarity = char.value || 0;
            if (!rarityGroups[rarity]) {
                rarityGroups[rarity] = [];
            }
            rarityGroups[rarity].push(char);
        });

        // Display grouped by rarity
        const rarities = Object.keys(rarityGroups).sort((a, b) => b - a);

        for (const rarity of rarities) {
            const chars = rarityGroups[rarity];
            message += `✨ *Rareza ${rarity}:*\n`;

            chars.forEach(char => {
                message += `• ${char.name} (ID: ${char.id})\n`;
            });
            message += '\n';
        }

        message += `━━━━━━━━━━━━━━━\n`;
        message += `💡 Usa #winfo <nombre> para más detalles`;

        console.log('[DEBUG ainfo] Enviando mensaje...');
        await ctx.reply(message);
    }
};
