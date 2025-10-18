const config = {
    name: "wl",
    version: "1.0",
    aliases: [],
    description: "Add, remove, edit whiteListIds",
    usage: "[add | -a] <uid | @tag> | [remove | -r] <uid | @tag> | [list | -l] | [on | off]",
    permissions: [2],
    cooldown: 5,
    credits: "ArYAN",
    category: "𝗔𝗗𝗠𝗜𝗡"
}

const langData = {
    "en_US": {
        "added": "✅ | Added whiteList role for {count} users:\n{list}",
        "alreadyAdmin": "\n⚠ | {count} users already have whiteList role:\n{list}",
        "missingIdAdd": "⚠ | Please enter ID or tag user to add in whiteListIds",
        "removed": "✅ | Removed whiteList role of {count} users:\n{list}",
        "notAdmin": "⚠ | {count} users don't have whiteListIds role:\n{list}",
        "missingIdRemove": "⚠ | Please enter ID or tag user to remove whiteListIds",
        "listAdmin": "👑 | List of whiteListIds:\n{list}",
        "enable": "✅ Whitelist mode turned on",
        "disable": "✅ Whitelist mode turned off"
    },
    "vi_VN": {
        "added": "✅ | Đã thêm vai trò whiteList cho {count} người dùng:\n{list}",
        "alreadyAdmin": "\n⚠ | {count} người dùng đã có vai trò whiteList:\n{list}",
        "missingIdAdd": "⚠ | Vui lòng nhập ID hoặc tag người dùng để thêm vào whiteListIds",
        "removed": "✅ | Đã xóa vai trò whiteList của {count} người dùng:\n{list}",
        "notAdmin": "⚠ | {count} người dùng không có vai trò whiteListIds:\n{list}",
        "missingIdRemove": "⚠ | Vui lòng nhập ID hoặc tag người dùng để xóa whiteListIds",
        "listAdmin": "👑 | Danh sách whiteListIds:\n{list}",
        "enable": "✅ Đã bật chế độ whitelist",
        "disable": "✅ Đã tắt chế độ whitelist"
    }
}

async function onCall({ message, args, getLang }) {
    const { senderID, mentions, messageReply } = message;

    if (!global.config.WHITE_LIST) {
        global.config.WHITE_LIST = {
            enable: false,
            ids: []
        };
    }

    switch (args[0]) {
        case "add":
        case "-a": {
            if (args[1]) {
                let uids = [];
                if (Object.keys(mentions || {}).length > 0)
                    uids = Object.keys(mentions);
                else if (messageReply)
                    uids.push(messageReply.senderID);
                else
                    uids = args.filter(arg => !isNaN(arg));

                const notAdminIds = [];
                const adminIds = [];
                for (const uid of uids) {
                    if (global.config.WHITE_LIST.ids.includes(uid))
                        adminIds.push(uid);
                    else
                        notAdminIds.push(uid);
                }

                global.config.WHITE_LIST.ids.push(...notAdminIds);

                const getNames = await Promise.all(uids.map(async uid => {
                    const name = (await global.controllers.Users.getInfo(uid))?.name || uid;
                    return { uid, name };
                }));

                global.config.save();

                return message.reply(
                    (notAdminIds.length > 0 ? getLang("added", {
                        count: notAdminIds.length,
                        list: getNames.filter(u => notAdminIds.includes(u.uid)).map(({ uid, name }) => `• ${name} (${uid})`).join("\n")
                    }) : "")
                    + (adminIds.length > 0 ? getLang("alreadyAdmin", {
                        count: adminIds.length,
                        list: adminIds.map(uid => `• ${uid}`).join("\n")
                    }) : "")
                );
            }
            else
                return message.reply(getLang("missingIdAdd"));
        }
        case "remove":
        case "-r": {
            if (args[1]) {
                let uids = [];
                if (Object.keys(mentions || {}).length > 0)
                    uids = Object.keys(mentions);
                else if (messageReply)
                    uids.push(messageReply.senderID);
                else
                    uids = args.filter(arg => !isNaN(arg));

                const notAdminIds = [];
                const adminIds = [];
                for (const uid of uids) {
                    if (global.config.WHITE_LIST.ids.includes(uid))
                        adminIds.push(uid);
                    else
                        notAdminIds.push(uid);
                }

                for (const uid of adminIds)
                    global.config.WHITE_LIST.ids.splice(global.config.WHITE_LIST.ids.indexOf(uid), 1);

                const getNames = await Promise.all(adminIds.map(async uid => {
                    const name = (await global.controllers.Users.getInfo(uid))?.name || uid;
                    return { uid, name };
                }));

                global.config.save();

                return message.reply(
                    (adminIds.length > 0 ? getLang("removed", {
                        count: adminIds.length,
                        list: getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")
                    }) : "")
                    + (notAdminIds.length > 0 ? getLang("notAdmin", {
                        count: notAdminIds.length,
                        list: notAdminIds.map(uid => `• ${uid}`).join("\n")
                    }) : "")
                );
            }
            else
                return message.reply(getLang("missingIdRemove"));
        }
        case "list":
        case "-l": {
            const getNames = await Promise.all(global.config.WHITE_LIST.ids.map(async uid => {
                const name = (await global.controllers.Users.getInfo(uid))?.name || uid;
                return { uid, name };
            }));
            return message.reply(getLang("listAdmin", {
                list: getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")
            }));
        }
        case "on": {
            global.config.WHITE_LIST.enable = true;
            global.config.save();
            return message.reply(getLang("enable"));
        }
        case "off": {
            global.config.WHITE_LIST.enable = false;
            global.config.save();
            return message.reply(getLang("disable"));
        }
        default:
            return message.reply("Usage: " + config.usage);
    }
}

export default {
    config,
    langData,
    onCall
}
