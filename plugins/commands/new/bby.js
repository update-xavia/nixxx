import axios from "axios";

const config = {
    name: "bby",
    aliases: ["baby"],
    version: "0.0.1",
    description: "AI chat bot with learning",
    usage: "[msg] | teach [msg] - [reply1, reply2] | teach react [msg] - [react1, react2] | remove [msg] | rm [msg] - [index or reply] | list all | list | edit [msg] - [oldReply] - [newReply]",
    cooldown: 0,
    permissions: [0],
    credits: "ArYAN",
    category: "chat"
}

const langData = {
    "en_US": {
        "noResponse": "❌ | No response found. Please teach me!",
        "failedToFetch": "❌ | Failed to fetch reply.",
        "removed": "✅ | {message}",
        "invalidFormat": "❌ | Use: {usage}",
        "teachers": "👑 | Teachers:\n{list}",
        "info": "❇️ | Total Teach = {totalKeys}\n♻️ | Total Response = {totalReplies}",
        "edited": "✅ | {message}",
        "taught": "✅ | Replies added \"{addedReplies}\" added to \"{question}\".\nTeacher: {teacher}\nTeachs: {teachCount}",
        "alreadyExists": "❌ | All replies already exist for this question.\nExisting: {existingReplies}",
        "error": "❌ | Something went wrong."
    },
    "vi_VN": {
        "noResponse": "❌ | Không tìm thấy phản hồi. Vui lòng dạy tôi!",
        "failedToFetch": "❌ | Không thể lấy phản hồi.",
        "removed": "✅ | {message}",
        "invalidFormat": "❌ | Sử dụng: {usage}",
        "teachers": "👑 | Giáo viên:\n{list}",
        "info": "❇️ | Tổng số dạy = {totalKeys}\n♻️ | Tổng phản hồi = {totalReplies}",
        "edited": "✅ | {message}",
        "taught": "✅ | Đã thêm phản hồi \"{addedReplies}\" vào \"{question}\".\nGiáo viên: {teacher}\nSố lần dạy: {teachCount}",
        "alreadyExists": "❌ | Tất cả phản hồi đã tồn tại cho câu hỏi này.\nĐã có: {existingReplies}",
        "error": "❌ | Đã xảy ra lỗi."
    }
}

const apiUrl = "https://baby-apis-nix.vercel.app";
const nix = ["😚", "Yes 😀, I am here", "What's up?", "Bolo jaan ki korte panmr jonno"];
const ok = ["baby", "bby", "bot", "বেবি", "জান", "jan", "বট", "বেবী", "বাবু", "janu"];
const getRand = () => nix[Math.floor(Math.random() * nix.length)];

async function handleReply(message, text, getLang) {
    const { senderID, threadID, messageID } = message;
    try {
        const res = await axios.get(`${apiUrl}/baby?text=${encodeURIComponent(text)}&senderID=${senderID}&font=1`);
        const aryan = res?.data?.reply;
        if (aryan) {
            message.reply(aryan, (err, info) => {
                if (!err && info) {
                    message.addReplyEvent({
                        callback: async ({ message: replyMessage }) => {
                            if (!replyMessage.body) return;
                            handleReply(replyMessage, replyMessage.body.toLowerCase(), getLang);
                        }
                    }, 60000);
                }
            });
        } else {
            message.reply(getLang("noResponse"));
        }
    } catch {
        message.reply(getLang("failedToFetch"));
    }
}

async function onCall({ message, args, getLang }) {
    if (!message.body) return;
    const txt = args.join(" ").trim();
    const uid = message.senderID;

    try {
        if (!txt) return message.reply(getRand());

        const isCommand = ["remove", "rm", "list", "edit", "teach"].includes(args[0]);
        if (isCommand) {
            if (args[0] === "remove") {
                const key = txt.slice(7).trim();
                const res = await axios.get(`${apiUrl}/baby-remove?key=${encodeURIComponent(key)}`);
                return message.reply(getLang("removed", { message: res.data.message || "Removed" }));
            }
            if (args[0] === "rm" && txt.includes("-")) {
                const parts = txt.slice(3).split(/\s*-\s*/).map(p => p.trim());
                const key = parts[0];
                const repOrIdx = parts[1];
                if (!key || repOrIdx === undefined) return message.reply(getLang("invalidFormat", { usage: "rm [msg] - [reply/index]" }));
                const param = !isNaN(parseInt(repOrIdx)) && String(parseInt(repOrIdx)) === repOrIdx ? `index=${encodeURIComponent(repOrIdx)}` : `reply=${encodeURIComponent(repOrIdx)}`;
                const res = await axios.get(`${apiUrl}/baby-remove?key=${encodeURIComponent(key)}&${param}`);
                return message.reply(getLang("removed", { message: res.data.message || "Removed" }));
            }
            if (args[0] === "list") {
                if (args[1] === "all") {
                    const tRes = await axios.get(`${apiUrl}/teachers`);
                    const teachers = tRes.data.teachers || {};
                    const sorted = Object.keys(teachers).sort((a, b) => teachers[b] - teachers[a]);
                    const list = await Promise.all(sorted.map(async id => {
                        const name = (await global.controllers.Users.getInfo(id))?.name || id;
                        return `• ${name}: ${teachers[id]}`;
                    }));
                    return message.reply(getLang("teachers", { list: list.join("\n") }));
                } else {
                    const infoRes = await axios.get(`${apiUrl}/baby-info`);
                    return message.reply(getLang("info", {
                        totalKeys: infoRes.data.totalKeys || "api off",
                        totalReplies: infoRes.data.totalReplies || "api off"
                    }));
                }
            }
            if (args[0] === "edit") {
                const parts = txt.split(/\s*-\s*/).map(p => p.trim());
                if (parts.length < 3) return message.reply(getLang("invalidFormat", { usage: "edit [msg] - [oldReply] - [newReply]" }));
                const oldMsg = parts[0].replace("edit", "").trim();
                const oldReply = parts[1];
                const newReply = parts[2];
                if (!oldMsg || !oldReply || !newReply) return message.reply(getLang("invalidFormat", { usage: "edit [msg] - [oldReply] - [newReply]" }));
                const res = await axios.get(`${apiUrl}/baby-edit?key=${encodeURIComponent(oldMsg)}&oldReply=${encodeURIComponent(oldReply)}&newReply=${encodeURIComponent(newReply)}&senderID=${uid}`);
                return message.reply(getLang("edited", { message: res.data.message || "Edited" }));
            }
            if (args[0] === "teach" && args[1] === "react") {
                const parts = txt.split(/\s*-\s*/).map(p => p.trim());
                const final = parts[0].replace("teach react", "").trim();
                const cmd = parts[1];
                if (!cmd) return message.reply(getLang("invalidFormat", { usage: "teach react [msg] - [react1, react2]" }));
                const res = await axios.get(`${apiUrl}/baby?teach=${encodeURIComponent(final)}&react=${encodeURIComponent(cmd)}`);
                return message.reply(res.data.message);
            }
            if (args[0] === "teach") {
                const parts = txt.split(/\s*-\s*/).map(p => p.trim());
                const final = parts[0].replace("teach", "").trim();
                const cmd = parts[1];
                if (!cmd) return message.reply(getLang("invalidFormat", { usage: "teach [msg] - [reply1, reply2]" }));
                const res = await axios.get(`${apiUrl}/baby?teach=${encodeURIComponent(final)}&reply=${encodeURIComponent(cmd)}&senderID=${uid}`);
                const teacher = (await global.controllers.Users.getInfo(uid))?.name || uid;
                if (res.data.addedReplies?.length === 0) {
                    const existingMsg = res.data.existingReplies.join(", ");
                    return message.reply(getLang("alreadyExists", { existingReplies: existingMsg }));
                }
                const teachsRes = await axios.get(`${apiUrl}/teachers`);
                const teachCount = teachsRes.data.teachers[uid] || 0;
                const addedReplies = res.data.addedReplies?.join(", ") || cmd;
                return message.reply(getLang("taught", {
                    addedReplies: addedReplies,
                    question: final,
                    teacher: teacher,
                    teachCount: teachCount
                }));
            }
        }
        handleReply(message, txt, getLang);
    } catch {
        message.reply(getLang("error"));
    }
}

async function onChat({ message, getLang }) {
    if (message.senderID === global.api.getCurrentUserID() || !message.body) return;
    const txt = message.body.toLowerCase().trim();
    const parts = txt.split(" ");
    const firstWord = parts[0];
    if (!ok.includes(firstWord)) return;
    const rest = parts.slice(1).join(" ").trim();
    if (!rest) {
        const messageText = getRand();
        return message.reply(messageText, (err, info) => {
            if (!err && info) {
                message.addReplyEvent({
                    callback: async ({ message: replyMessage, getLang: replyGetLang }) => {
                        if (!replyMessage.body) return;
                        handleReply(replyMessage, replyMessage.body.toLowerCase(), replyGetLang);
                    }
                }, 60000);
            }
        });
    }
    handleReply(message, rest, getLang);
}

export default {
    config,
    langData,
    onCall,
    onChat
}
