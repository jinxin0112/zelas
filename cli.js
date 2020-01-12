#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const program = require("commander");
const ini = require("ini");
const extend = require("extend");
const humps = require("humps");
const gitConfigPath = require("git-config-path")("global");

const ZELASRC = path.join(process.env.HOME, ".zelasrc");
const registries = require(ZELASRC) || {};
const PKG = require("./package.json");
const GITINFO = gitConfigPath;

const FIELD_SHOW_URL = "show-url";

program.version(PKG.version);

program
    .command("ls")
    .description("List all the git user")
    .action(onList);

program
    .command("current")
    .option("-e, --show-email", "Show the user name or email")
    .description("Show current user name")
    .action(showCurrent);

program
    .command("use <registry>")
    .description("Change user")
    .action(onUse);

program
    .command("add <registry> <url>")
    .description("Add one user")
    .action(onAdd);

program
    .command("del <registry>")
    .description("Delete one user")
    .action(onDel);

program
    .command("help", { isDefault: true })
    .description("Print this help")
    .action(function() {
        program.outputHelp();
    });

program.parse(process.argv);

if (process.argv.length === 2) {
    program.outputHelp();
}

/*//////////////// cmd methods /////////////////*/

function onList() {
    getCurrentEmail(function(cur) {
        var info = [""];
        var allRegistries = getAllEmail();
        const keys = Object.keys(allRegistries);
        const len = Math.max(...keys.map(key => key.length)) + 3;

        Object.keys(allRegistries).forEach(function(key) {
            var item = allRegistries[key];
            var prefix = equalsIgnoreCase(item.registry, cur) ? "* " : "  ";
            info.push(prefix + key + line(key, len) + item.registry);
        });

        info.push("");
        printMsg(info);
    });
}

function showCurrent(cmd) {
    getCurrentEmail(function(cur) {
        var allRegistries = getAllRegistry();
        Object.keys(allRegistries).forEach(function(key) {
            var item = allRegistries[key];
            if (equalsIgnoreCase(item.registry, cur)) {
                const showUrl = cmd[humps.camelize(FIELD_SHOW_URL, { separator: "-" })];
                printMsg([showUrl ? item.registry : key]);
                return;
            }
        });
    });
}

function onUse(name) {
    if (typeof name === undefined) {
        execSync(`git config --global user.name ""`);
        execSync(`git config --global user.email ""`);
    }
    var allRegistries = getAllRegistry();
    if (allRegistries.hasOwnProperty(name)) {
        getCurrentEmail(function(cur) {
            const curName = Object.entries(allRegistries).find(
                ([_, { registry }]) => registry === cur
            )[0];
            if (equalsIgnoreCase(name, curName)) return;
            const email = Object.entries(allRegistries).find(([n]) => n === name)[1].home;
            execSync(`git config --global user.name ${name}`);
            execSync(`git config --global user.email ${email}`);
            printMsg(["", "    use user " + name + "(" + email + ") success", ""]);
        });
    } else {
        printMsg(["", "   Not find user: " + name, ""]);
    }
}

function onDel(name) {
    var customRegistries = getAllRegistry();
    if (!customRegistries.hasOwnProperty(name)) return;
    getCurrentEmail(function(cur) {
        if (equalsIgnoreCase(customRegistries[name].registry, cur)) {
            onUse();
        }
        delete customRegistries[name];
        setCustomRegistry(customRegistries, function(err) {
            if (err) return exit(err);
            printMsg(["", "    delete user " + name + " success", ""]);
        });
    });
}

function onAdd(name, url) {
    var customRegistries = getAllEmail();
    if (customRegistries.hasOwnProperty(name)) return;

    customRegistries[name] = {
        registry: url,
        home: url
    };
    setCustomRegistry(customRegistries, function(err) {
        if (err) return exit(err);
        printMsg(["", "    add user " + name + "(" + url + ") success", ""]);
        if (Object.keys(customRegistries).length === 1) onUse(name);
    });
}

/*//////////////// helper methods /////////////////*/

/*
 * get current registry
 */

function getCurrentEmail(cbk) {
    const {
        user: { email }
    } = getINIInfo(GITINFO);
    cbk(email);
}

function getCustomRegistry() {
    const gitInfo = getINIInfo(GITINFO);
    const {
        user: { name, email }
    } = gitInfo;
    return {
        [name]: {
            home: email,
            registry: email
        }
    };
}

function setCustomRegistry(config, cbk) {
    fs.writeFile(ZELASRC, JSON.stringify(config), cbk);
}

function getAllRegistry() {
    const custom = getCustomRegistry();
    const all = extend({}, registries, custom);
    for (let name in registries) {
        if (name in custom) {
            all[name] = extend({}, custom[name], registries[name]);
        }
    }
    return all;
}
function getAllEmail() {
    const custom = getCustomRegistry();
    const all = extend({}, registries, custom);
    for (let name in registries) {
        if (name in custom) {
            all[name] = extend({}, custom[name], registries[name]);
        }
    }
    return all;
}

function printErr(err) {
    console.error("an error occured: " + err);
}

function printMsg(infos) {
    infos.forEach(function(info) {
        console.log(info);
    });
}

function getINIInfo(path) {
    return fs.existsSync(path) ? ini.parse(fs.readFileSync(path, "utf-8")) : {};
}

/*
 * print message & exit
 */
function exit(err) {
    printErr(err);
    process.exit(1);
}

function line(str, len) {
    var line = new Array(Math.max(1, len - str.length)).join("-");
    return " " + line + " ";
}

/**
 * compare ignore case
 *
 * @param {string} str1
 * @param {string} str2
 */
function equalsIgnoreCase(str1, str2) {
    if (str1 && str2) {
        return str1.toLowerCase() === str2.toLowerCase();
    } else {
        return !str1 && !str2;
    }
}

function cleanRegistry() {
    setCustomRegistry("", function(err) {
        if (err) exit(err);
        onUse();
    });
}

module.exports = {
    cleanRegistry,
    errExit: exit
};
