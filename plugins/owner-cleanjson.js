import fs from 'fs';
import path from 'path';
import { styleText } from '../lib/utils.js';

export default {
    commands: ['cleanjson'],
    
    async execute(ctx) {
        // Verificar owner
        const ownerJid = '573115434166@s.whatsapp.net'; // ID del owner hardcodeado o importar de constants
        if (ctx.sender !== ownerJid && !ctx.isOwner) {
             return await ctx.reply(styleText('ꕤ Este comando es solo para el owner.'));
        }

        const dbPath = path.join(process.cwd(), 'database', 'new-char.json');

        try {
            if (!fs.existsSync(dbPath)) {
                return await ctx.reply(styleText('❌ El archivo new-char.json no existe.'));
            }

            const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            let count = 0;

            const cleanString = (str) => {
                if (typeof str === 'string') {
                    // Remover * al inicio y al final, y también si están dobles **
                    return str.replace(/^\*+|\*+$/g, ''); 
                }
                return str;
            };

            const startTime = Date.now();

            data.forEach(char => {
                let modified = false;
                
                ['name', 'gender', 'source', 'status'].forEach(field => {
                    if (char[field]) {
                        const original = char[field];
                        const cleaned = cleanString(original);
                        if (original !== cleaned) {
                            char[field] = cleaned;
                            modified = true;
                        }
                    }
                });

                if (modified) count++;
            });

            fs.writeFileSync(dbPath, JSON.stringify(data, null, 3));

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            await ctx.reply(styleText(
                `✅ *Limpieza Completada*\n\n` +
                `> Archivo: new-char.json\n` +
                `> Personajes procesados: ${data.length}\n` +
                `> Personajes modificados: ${count}\n` +
                `> Tiempo: ${duration}s`
            ));

        } catch (error) {
            console.error(error);
            await ctx.reply(styleText(`❌ Error: ${error.message}`));
        }
    }
};
