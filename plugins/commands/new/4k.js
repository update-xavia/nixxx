import axios from "axios";
import { createWriteStream, createReadStream, existsSync, unlinkSync } from "fs";
import { join } from "path";

const config = {
    name: "4k",
    aliases: ["upscale"],
    version: "1.1",
    description: "Upscale images to 4K resolution",
    usage: "[reply to image]",
    permissions: [0],
    credits: "ArYAN",
    cooldowns: 10,
    category: "media"
};

async function onCall({ message }) {
    if (
        !message.messageReply ||
        !message.messageReply.attachments ||
        !message.messageReply.attachments[0] ||
        message.messageReply.attachments[0].type !== "photo"
    ) {
        return message.reply("📸 Please reply to an image to upscale it.");
    }

    const imageUrl = message.messageReply.attachments[0].url;
    const outputPath = join(global.cachePath, `upscaled_${Date.now()}.png`);
    let processingMsg;

    try {
        processingMsg = await message.reply("🔄 Processing your image, please wait...");

        const apiResponse = await axios.get(`http://65.109.80.126:20409/aryan/4k?imageUrl=${encodeURIComponent(imageUrl)}`);
        if (!apiResponse.data.status) throw new Error(apiResponse.data.message || "API error");

        const imageStream = await axios.get(apiResponse.data.enhancedImageUrl, { responseType: "stream" });
        const writer = createWriteStream(outputPath);
        imageStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        await message.reply({
            body: "✅ Your 4K upscaled image is ready!",
            attachment: createReadStream(outputPath),
        });

    } catch (error) {
        console.error("Upscale Error:", error);
        message.reply("❌ An error occurred while upscaling the image. Please try again later.");
    } finally {
        if (processingMsg) processingMsg.unsend();
        if (existsSync(outputPath)) unlinkSync(outputPath);
    }
}

export default {
    config,
    onCall
};
