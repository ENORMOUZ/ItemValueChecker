import { itemValueCheckerData } from "./utils"

const gc = (text) => ChatLib.getCenteredText(text) // getCentered
const cc = (text) => ChatLib.chat(gc(text)) // centerChat

let checked = false
register("step", () => {
    if (checked) return
    checked = true
    if (!itemValueCheckerData.firstTime) return
    itemValueCheckerData.firstTime = false 
    itemValueCheckerData.save()
    ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
    cc(`&b&l&nItemValueChecker ${JSON.parse(FileLib.read("ItemValueChecker", "metadata.json")).version}`)
    cc("&a&a&b&c&d&e")
    cc("&aThank you for installing ItemValueChecker!")
    cc("&a&a&b&c&d&e&r")
    new TextComponent(gc("&6Click here &7to join my Discord server ")).setClick("open_url", "https://discord.gg/wjChDvs9DT").setHover("show_text", "&9https://discord.gg/wjChDvs9DT").chat()
    cc("&7to make suggestions and report bugs!")
    cc("&a&a&b&c&d&d&e")
    ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
}).setFps(5)
