import axios from "axios";
import fs from "fs-extra";
import { join } from "path";

const { writeFileSync, existsSync, readFileSync } = fs;

const config = {
    name: "cmd",
    version: "1.17",
    aliases: ["command"],
    description: "Manage your command files",
    usage: "load <command file name> | loadAll | install <url> <command file name>",
    permissions: [2],
    cooldown: 5,
    credits: "ArYAN",
    category: "owner"
}

const langData = {
    "en_US": {
        "missingFileName": "⚠️ | Please enter the command name you want to reload",
        "loaded": "✅ | Loaded command \"{name}\" successfully",
        "loadedError": "❌ | Failed to load command \"{name}\" with error\n{error}",
        "loadedSuccess": "✅ | Loaded successfully ({count}) command(s)",
        "loadedFail": "❌ | Failed to load ({count}) command(s)\n{errors}",
        "openConsoleToSeeError": "👀 | Open console to see error details",
        "missingUrlCodeOrFileName": "⚠️ | Please enter the url or code and command file name you want to install",
        "missingUrlOrCode": "⚠️ | Please enter the url or code of the command file you want to install",
        "missingFileNameInstall": "⚠️ | Please enter the file name to save the command (with .js extension)",
        "invalidUrl": "⚠️ | Please enter a valid url",
        "invalidUrlOrCode": "⚠️ | Unable to get command code",
        "alreadyExist": "⚠️ | The command file already exists, react to this message to overwrite",
        "installed": "✅ | Installed command \"{name}\" successfully, the command file is saved at {path}",
        "installedError": "❌ | Failed to install command \"{name}\" with error\n{error}",
        "missingFile": "⚠️ | Command file \"{name}\" not found",
        "invalidFileName": "⚠️ | Invalid command file name"
    },
    "vi_VN": {
        "missingFileName": "⚠️ | Vui lòng nhập vào tên lệnh bạn muốn reload",
        "loaded": "✅ | Đã load command \"{name}\" thành công",
        "loadedError": "❌ | Load command \"{name}\" thất bại với lỗi\n{error}",
        "loadedSuccess": "✅ | Đã load thành công ({count}) lệnh",
        "loadedFail": "❌ | Load thất bại ({count}) lệnh\n{errors}",
        "openConsoleToSeeError": "👀 | Hãy mở console để xem chi tiết lỗi",
        "missingUrlCodeOrFileName": "⚠️ | Vui lòng nhập vào url hoặc code và tên file lệnh bạn muốn cài đặt",
        "missingUrlOrCode": "⚠️ | Vui lòng nhập vào url hoặc code của tệp lệnh bạn muốn cài đặt",
        "missingFileNameInstall": "⚠️ | Vui lòng nhập vào tên file để lưu lệnh (đuôi .js)",
        "invalidUrl": "⚠️ | Vui lòng nhập vào url hợp lệ",
        "invalidUrlOrCode": "⚠️ | Không thể lấy được mã lệnh",
        "alreadyExist": "⚠️ | File lệnh đã tồn tại, thả cảm xúc vào tin nhắn này để tiếp tục",
        "installed": "✅ | Đã cài đặt command \"{name}\" thành công, file lệnh được lưu tại {path}",
        "installedError": "❌ | Cài đặt command \"{name}\" thất bại với lỗi\n{error}",
        "missingFile": "⚠️ | Không tìm thấy tệp lệnh \"{name}\"",
        "invalidFileName": "⚠️ | Tên tệp lệnh không hợp lệ"
    }
}

function getDomain(url) {
    const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function isURL(str) {
    try {
        new URL(str);
        return true;
    }
    catch (e) {
        return false;
    }
}

async function onCall({ message, args, getLang }) {
    const { senderID } = message;

    try {
        const query = args[0]?.toLowerCase();

        if (query === "load") {
            const commandName = args[1];
            
            if (!commandName) {
                return message.reply(getLang("missingFileName"));
            }

            const fileName = commandName.endsWith('.js') ? commandName : `${commandName}.js`;
            const commandPath = join(process.cwd(), 'plugins', 'commands');
            
            let foundPath = null;
            let foundCategory = null;
            const checkCategories = ['new', 'admin', 'general', 'economy', 'group', 'media', 'ai', 'tools', 'nix'];

            for (const category of checkCategories) {
                const path = join(commandPath, category, fileName);
                if (existsSync(path)) {
                    foundPath = path;
                    foundCategory = category;
                    break;
                }
            }

            if (!foundPath) {
                return message.reply(getLang("missingFile", { name: commandName }));
            }

            try {
                const { pathToFileURL } = await import('url');
                const actualCommandName = fileName.slice(0, fileName.lastIndexOf('.')).toLowerCase();

                if (global.plugins.commands.has(actualCommandName)) {
                    global.plugins.commands.delete(actualCommandName);
                }

                if (global.plugins.commandsConfig.has(actualCommandName)) {
                    const oldConfig = global.plugins.commandsConfig.get(actualCommandName);
                    if (oldConfig.aliases && Array.isArray(oldConfig.aliases)) {
                        for (const alias of oldConfig.aliases) {
                            global.plugins.commandsAliases.delete(alias);
                        }
                    }
                    global.plugins.commandsConfig.delete(actualCommandName);
                }

                for (const lang in global.data.langPlugin) {
                    if (global.data.langPlugin[lang][actualCommandName]) {
                        delete global.data.langPlugin[lang][actualCommandName];
                    }
                }

                const pluginURL = pathToFileURL(foundPath);
                pluginURL.searchParams.set("version", Number(Date.now()));

                let pluginExport = await import(pluginURL.href);
                pluginExport = pluginExport.default || pluginExport;

                if (typeof pluginExport === "object" && pluginExport !== null && !Array.isArray(pluginExport)) {
                    const { config: pluginConfig, onLoad, langData, onCall, onChat } = pluginExport;

                    if (!pluginConfig || !pluginConfig.name) {
                        throw new Error("Invalid plugin config");
                    }

                    pluginConfig.category = foundCategory;
                    pluginConfig.permissions = Array.isArray(pluginConfig.permissions) ? pluginConfig.permissions : [0];

                    if (langData && typeof langData === "object" && !Array.isArray(langData)) {
                        for (const langKey in langData) {
                            if (!global.data.langPlugin[langKey]) {
                                global.data.langPlugin[langKey] = {};
                            }
                            global.data.langPlugin[langKey][pluginConfig.name] = langData[langKey];
                        }
                    }

                    global.plugins.commandsConfig.set(pluginConfig.name, pluginConfig);
                    global.plugins.commands.set(pluginConfig.name, { onCall, onChat });

                    const aliases = pluginConfig.aliases || [pluginConfig.name];
                    for (const alias of aliases) {
                        if (!global.plugins.commandsAliases.has(alias)) {
                            global.plugins.commandsAliases.set(alias, [pluginConfig.name]);
                        }
                    }

                    if (typeof onLoad === "function") {
                        await onLoad({ extra: pluginConfig.extra || {} });
                    }

                    return message.reply(getLang("loaded", { name: pluginConfig.name }));
                } else {
                    throw new Error("Invalid plugin export");
                }
            } catch (error) {
                console.error(error);
                return message.reply(getLang("loadedError", { name: commandName, error: error.message }));
            }

        } else if (query === "loadall") {
            delete global.plugins;
            global.plugins = new Object({
                commands: new Map(),
                commandsAliases: new Map(),
                commandsConfig: new Map(),
                customs: new Number(0),
                events: new Map(),
                onMessage: new Map()
            });

            for (const lang in global.data.langPlugin) {
                for (const plugin in global.data.langPlugin[lang]) {
                    if (plugin == config.name) continue;
                    delete global.data.langPlugin[lang][plugin];
                }
            }

            delete global.data.temps;
            global.data.temps = new Array();

            await global.modules.get("loader").loadPlugins();
            return message.reply(getLang("loadedSuccess", { count: global.plugins.commands.size }));

        } else if (query === "install") {
            let url = args[1];
            let fileName = args[2];
            let rawCode;

            if (!url || !fileName)
                return message.reply(getLang("missingUrlCodeOrFileName"));

            if (url.endsWith(".js") && !isURL(url)) {
                const tmp = fileName;
                fileName = url;
                url = tmp;
            }

            if (url.match(/(https?:\/\/(?:www\.|(?!www)))/)) {
                if (!fileName || !fileName.endsWith(".js"))
                    return message.reply(getLang("missingFileNameInstall"));

                const domain = getDomain(url);
                if (!domain)
                    return message.reply(getLang("invalidUrl"));

                if (domain == "pastebin.com") {
                    const regex = /https:\/\/pastebin\.com\/(?!raw\/)(.*)/;
                    if (url.match(regex))
                        url = url.replace(regex, "https://pastebin.com/raw/$1");
                    if (url.endsWith("/"))
                        url = url.slice(0, -1);
                }
                else if (domain == "github.com") {
                    const regex = /https:\/\/github\.com\/(.*)\/blob\/(.*)/;
                    if (url.match(regex))
                        url = url.replace(regex, "https://raw.githubusercontent.com/$1/$2");
                }

                try {
                    rawCode = (await axios.get(url)).data;
                } catch (error) {
                    return message.reply(getLang("invalidUrlOrCode"));
                }
            }
            else {
                return message.reply(getLang("missingUrlOrCode"));
            }

            if (!rawCode)
                return message.reply(getLang("invalidUrlOrCode"));

            const targetPath = join(process.cwd(), 'plugins', 'commands', 'new', fileName);
            
            if (existsSync(targetPath)) {
                return message.reply(getLang("alreadyExist"), (err, info) => {
                    if (!err && info) {
                        message.addReplyEvent({
                            callback: async ({ message: replyMessage }) => {
                                try {
                                    writeFileSync(targetPath, rawCode);
                                    await global.modules.get("loader").loadPlugins();
                                    return replyMessage.reply(getLang("installed", {
                                        name: fileName.replace('.js', ''),
                                        path: targetPath.replace(process.cwd(), '')
                                    }));
                                } catch (error) {
                                    return replyMessage.reply(getLang("installedError", {
                                        name: fileName.replace('.js', ''),
                                        error: error.message
                                    }));
                                }
                            }
                        }, 60000);
                    }
                });
            }
            else {
                try {
                    writeFileSync(targetPath, rawCode);
                    await global.modules.get("loader").loadPlugins();
                    return message.reply(getLang("installed", {
                        name: fileName.replace('.js', ''),
                        path: targetPath.replace(process.cwd(), '')
                    }));
                } catch (error) {
                    return message.reply(getLang("installedError", {
                        name: fileName.replace('.js', ''),
                        error: error.message
                    }));
                }
            }
        }
        else {
            return message.reply("Usage: " + config.usage);
        }
    } catch (e) {
        console.error(e);
        return message.reply(getLang("loadedError", {
            name: args[0] || "unknown",
            error: e.message
        }));
    }
}

export default {
    config,
    langData,
    onCall
}
