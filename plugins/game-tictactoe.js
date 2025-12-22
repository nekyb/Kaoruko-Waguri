
import { styleText } from '../lib/utils.js';

const tttGames = new Map();

export default {
    commands: ['tictactoe', 'ttt', 'gato'],
    tags: ['game'],
    help: ['tictactoe @user'],

    async before(ctx) {
        const { chatId, body, sender } = ctx;
        if (!tttGames.has(chatId) || ctx.isCmd) return;

        const game = tttGames.get(chatId);
        const text = body.trim();

        // Check if it's a move (1-9)
        if (!/^[1-9]$/.test(text)) return;

        // Check if it's the player's turn
        // Normalize JIDs to ensure matching works even with different formatting
        const senderId = sender.split('@')[0];
        const playerXId = game.playerX.split('@')[0];
        const playerOId = game.playerO.split('@')[0];

        const isX = senderId === playerXId;
        const isO = senderId === playerOId;

        if (!isX && !isO) return; // Not a player
        if (isX && game.turn !== 'X') return; // Not X's turn
        if (isO && game.turn !== 'O') return; // Not O's turn

        const pos = parseInt(text) - 1;
        if (game.board[pos] !== null) {
            return await ctx.reply(styleText('ꕤ Esa casilla ya está ocupada.'));
        }

        // Make move
        game.board[pos] = game.turn;
        game.turn = game.turn === 'X' ? 'O' : 'X';

        // Check win
        const winner = checkWin(game.board);
        if (winner) {
            const winPlayer = winner === 'X' ? game.playerX : game.playerO;

            // Add reward
            const reward = Math.floor(Math.random() * 2000) + 1000;
            const userData = ctx.dbService.getUser(winPlayer);
            userData.economy.coins = (userData.economy.coins || 0) + reward;
            ctx.dbService.markDirty();

            tttGames.delete(chatId);
            return await ctx.reply(styleText(`🎉 *¡Tenemos ganador!* Felicidades @${winPlayer.split('@')[0]}\n💰 Ganaste *${reward}* coins`), { mentions: [winPlayer] });
        }

        // Check draw
        if (game.board.every(cell => cell !== null)) {
            tttGames.delete(chatId);
            return await ctx.reply(styleText('🤝 *¡Empate!*'));
        }

        // Send updated board
        await ctx.reply(styleText(renderBoard(game.board, game.turn)));

        // Return true to stop other plugins from processing this message if specifically needed
        // But usually returning undefined is fine. 
        return true;
    },

    async execute(ctx) {
        const { chatId, sender, msg } = ctx;
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (tttGames.has(chatId)) {
            return await ctx.reply(styleText('ꕤ Ya hay un juego en curso en este chat.'));
        }

        if (!mentionedJid || mentionedJid.length === 0) {
            return await ctx.reply(styleText('ꕤ Etiqueta a alguien para jugar.\nEjemplo: #ttt @usuario'));
        }

        const opponent = mentionedJid[0];
        if (opponent === sender) {
            return await ctx.reply(styleText('ꕤ No puedes jugar contra ti mismo.'));
        }

        // Initialize game
        tttGames.set(chatId, {
            playerX: sender,
            playerO: opponent,
            turn: 'X',
            board: Array(9).fill(null)
        });

        await ctx.reply(
            styleText(`🎮 *Tic Tac Toe*\n\n` +
                `❌ @${sender.split('@')[0]} vs ⭕ @${opponent.split('@')[0]}\n\n` +
                `Empieza: ❌\n` +
                `Escribe un número del 1 al 9 para jugar.\n\n` +
                renderBoard(Array(9).fill(null), 'X')),
            { mentions: [sender, opponent] }
        );
    }
}

function checkWin(board) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function renderBoard(board, turn) {
    const map = { null: '⬜', 'X': '❌', 'O': '⭕' };
    const b = board.map((cell, i) => cell ? map[cell] : `${i + 1}️⃣`);

    return `
${b[0]}${b[1]}${b[2]}
${b[3]}${b[4]}${b[5]}
${b[6]}${b[7]}${b[8]}

Turno: ${map[turn]}
`.trim();
}
