import axios from "axios";
import { styleText } from '../lib/utils.js';
import { downloadMediaMessage } from 'baileys';
import pino from "pino";
const logger = pino({ level: "silent" });

const GEMINI_API_KEYS = [
    "AIzaSyBt77r0sl4YDcBqQBjHIMxu9ZvbjbzVqrk",
    "AIzaSyB147GA8T_Yw3YMChXocBL0W4qvIFYGw6o",
    "AIzaSyDi444P77L6Xor9w8Nq1mXT-eT_7jyybGA",
];

export default {
    commands: ["vision", "analyze", "whatisthis", "describe"],
    tags: ["tools"],
    help: ["vision [pregunta] (responder a imagen o enviar imagen con caption)"],

    async execute(ctx) {
        const { bot, msg, text, chatId } = ctx;
        const sock = bot.sock;
        const args = text ? text.split(" ") : [];

        try {
            let imageBuffer = null;
            let imageMessage = msg.message?.imageMessage;
            if (
                !imageMessage &&
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ) {
                imageMessage =
                    msg.message.extendedTextMessage.contextInfo.quotedMessage
                        .imageMessage;
            }

            if (!imageMessage) {
                return await sock.sendMessage(chatId, {
                    text: styleText(
                        `《✿》 *Vision AI - Análisis de Imágenes* 《✧》\n\n` +
                        `Envía una imagen con tu pregunta o responde a una imagen.\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #vision ¿Qué ves en esta imagen?\n` +
                        `✿ #vision Describe esta foto en detalle\n` +
                        `✿ #vision ¿Qué emociones transmite?\n` +
                        `✿ #vision ¿Qué texto tiene esta imagen?\n` +
                        `✿ #vision ¿Cuántas personas hay?\n\n` +
                        `💡 *Tip:* Puedes hacer cualquier pregunta sobre la imagen.\n\n` +
                        `📊 *API Keys disponibles:* ${GEMINI_API_KEYS.length}`),
                });
            }

            const prompt = text || "¿Qué ves en esta imagen? Descríbela en detalle.";

            try {
                const messageToDownload = msg.message?.imageMessage
                    ? msg
                    : {
                        message: {
                            imageMessage:
                                msg.message.extendedTextMessage.contextInfo
                                    .quotedMessage.imageMessage,
                        },
                        key: msg.message.extendedTextMessage.contextInfo
                            .stanzaId
                            ? {
                                remoteJid: msg.key.remoteJid,
                                id: msg.message.extendedTextMessage
                                    .contextInfo.stanzaId,
                                participant:
                                    msg.message.extendedTextMessage
                                        .contextInfo.participant,
                            }
                            : msg.key,
                    };

                imageBuffer = await downloadMediaMessage(
                    messageToDownload,
                    "buffer",
                    {},
                    {
                        logger,
                        reuploadRequest: sock.updateMediaMessage,
                    },
                );
            } catch (downloadError) {
                console.error("Error al descargar imagen:", downloadError);
                return await sock.sendMessage(chatId, {
                    text: styleText(
                        "《✿》Error al descargar la imagen.\n\n" +
                        "💡 *Tip:* Intenta enviar la imagen nuevamente."),
                });
            }

            if (!imageBuffer) {
                return await sock.sendMessage(chatId, {
                    text: styleText("《✿》 No se pudo obtener la imagen."),
                });
            }

            let analysis = "";
            let usedKeyIndex = -1;
            let usedModel = "";
            try {
                const result = await analyzeWithGemini(imageBuffer, prompt);
                analysis = result.text;
                usedKeyIndex = result.keyIndex;
                usedModel = result.model;
            } catch (geminiError) {
                console.error("Error con Gemini Vision:", geminiError);
                return await sock.sendMessage(chatId, {
                    text: styleText(
                        "《✿》 Error al analizar la imagen con Gemini Vision.\n\n" +
                        "💡 *Posibles causas:*\n" +
                        `✿ Todas las API keys alcanzaron su límite\n` +
                        `✿ Imagen muy grande o formato no soportado\n` +
                        `✿ Servicio temporalmente no disponible\n` +
                        `✿ API keys inválidas o sin permisos\n\n` +
                        `🔑 API keys probadas: ${GEMINI_API_KEYS.length}\n` +
                        `❌ Error: ${geminiError.message || "Desconocido"}`),
                });
            }

            const response =
                `╔═══《 GEMINI VISION AI 》═══╗\n` +
                `║\n` +
                `║ ✦ *Pregunta:* ${prompt}\n` +
                `║ ✦ *Modelo:* ${usedModel}\n` +
                `║ ✦ *API Key:* #${usedKeyIndex + 1} de ${GEMINI_API_KEYS.length}\n` +
                `║\n` +
                `╚═════════════════════════╝\n\n` +
                `*Análisis:*\n${analysis}\n\n` +
                `> _*By Soblend | Development Studio Creative*_`;

            await sock.sendMessage(
                chatId,
                {
                    text: styleText(response),
                },
                { quoted: msg },
            );
        } catch (error) {
            console.error("Error en comando vision:", error);
            await sock.sendMessage(chatId, {
                text: styleText(
                    "《✿》 Ocurrió un error inesperado al analizar la imagen.\n\n" +
                    "💡 *Tip:* Intenta con una imagen más pequeña o diferente."),
            });
        }
    }
};

async function analyzeWithGemini(imageBuffer, prompt) {
    const models = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash-thinking-exp-1219",
        "gemini-exp-1206",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
    ];

    let lastError = null;

    for (let keyIndex = 0; keyIndex < GEMINI_API_KEYS.length; keyIndex++) {
        const apiKey = GEMINI_API_KEYS[keyIndex];
        console.log(`\n🔑 Probando API Key #${keyIndex + 1}...`);

        for (const modelName of models) {
            try {
                console.log(`  └─ Intentando modelo: ${modelName}...`);

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                const data = {
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: imageBuffer.toString("base64")
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 2048,
                        temperature: 0.4
                    }
                };

                const response = await axios.post(url, data, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!text || text.trim().length === 0) {
                    throw new Error(`${modelName} devolvió respuesta vacía`);
                }

                console.log(
                    `  ✓ ¡ÉXITO! API Key #${keyIndex + 1} con modelo ${modelName}`,
                );
                return {
                    text: text,
                    keyIndex: keyIndex,
                    model: modelName,
                };
            } catch (error) {
                const errorMessage = error.response?.data?.error?.message || error.message;
                console.error(`  ✗ Falló ${modelName}: ${errorMessage}`);
                lastError = error;

                if (
                    errorMessage.includes("quota") ||
                    errorMessage.includes("rate limit") ||
                    errorMessage.includes("429") ||
                    errorMessage.includes("RESOURCE_EXHAUSTED")
                ) {
                    console.log(
                        `  ⚠️  Límite alcanzado con esta API key, probando siguiente...`,
                    );
                    break;
                }

                if (
                    errorMessage.includes("404") ||
                    errorMessage.includes("not found") ||
                    errorMessage.includes("does not exist")
                ) {
                    console.log(
                        `  ⚠️  Modelo no disponible, probando siguiente...`,
                    );
                    continue;
                }

                if (
                    errorMessage.includes("403") ||
                    errorMessage.includes("permission") ||
                    errorMessage.includes("PERMISSION_DENIED")
                ) {
                    console.log(
                        `  ⚠️  Sin permisos para este modelo, probando siguiente...`,
                    );
                    continue;
                }

                continue;
            }
        }
    }

    console.error(
        `\n❌ Todas las ${GEMINI_API_KEYS.length} API keys fallaron con todos los modelos disponibles`,
    );
    throw (
        lastError ||
        new Error(
            `Todas las ${GEMINI_API_KEYS.length} API keys de Gemini Vision fallaron. Verifica que las keys sean válidas y tengan permisos para Vision API.`,
        )
    );
}
