import settings from "./settings"
import RenderLib from "../RenderLib"
import request from "../requestV2"
import sleep from '../sleep'

const mc = Client.getMinecraft()

const itemValueBind = new KeyBind("Item Value Checker", Keyboard.KEY_I, "ItemValueChecker")

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function c(message) { ChatLib.chat(message) }

function s(message) { ChatLib.say(message) }

// Switch to my own API when possible
function fetchLowestBin() {
	request(`https://moulberry.codes/lowestbin.json`).then((data1) => {
		lowestBinData = JSON.parse(data1)
	})
}

function fetchBazaar() {
	request(`https://api.hypixel.net/skyblock/bazaar`).then((data1) => {
		bazaarData = JSON.parse(data1)
	})
}

function fetchEnchants() {
	request('https://raw.githubusercontent.com/ENORMOUZ/ItemValueChecker/main/ItemValueChecker/constants/maxenchants.json').then((data1) => {
		enchantsData = JSON.parse(data1)
	})
}

fetchLowestBin()
fetchBazaar()
fetchEnchants()

register('step', () => {
	fetchLowestBin()
	fetchBazaar()
	fetchEnchants()
}).setDelay(120)

register("guiKey", (key, gui, event) => {
  	if (String(event).includes('net.minecraft.client.gui.inventory') && !String(event).includes('net.minecraft.client.gui.inventory.GuiEditSign') && Keyboard.isKeyDown(itemValueBind.getKeyCode()) === true) {
		if (Client.currentGui.get().getSlotUnderMouse()) {
			let item = Player.getOpenedInventory().getStackInSlot(Client.currentGui.get().getSlotUnderMouse().field_75222_d)
			itemValueChecker(item)
		}
	}
})

function petItemId(tier) {
	if (tier.equals("COMMON")) {
		return "0"
	}
	if (tier.equals("UNCOMMON")) {
		return "1"
	}
	if (tier.equals("RARE")) {
		return "2"
	}
	if (tier.equals("EPIC")) {
		return "3"
	}
	if (tier.equals("LEGENDARY")) {
		return "4"
	}
	if (tier.equals("MYTHIC")) {
		return "5"
	}
}

function itemValueChecker(item) {
	const extraAttributes = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes")

	let itemId = extraAttributes.getString("id")
	c(`Name: ${ChatLib.removeFormatting(item.getName())}, Id: ${itemId}`)
	let itemValue = lowestBinData[`${itemId}`]
	let enchantsValue = 0

	if (itemId.equals("PET")) {
		let petInfo = extraAttributes.getString(["petInfo"])
		petInfo = JSON.parse(petInfo)
		itemId = `${petInfo["type"]};${petItemId(petInfo["tier"])}`
		itemValue = lowestBinData[itemId]
		c(`Item Value: ${numberWithCommas(Math.round(itemValue))}`)
		let petItemValue = lowestBinData[petInfo["heldItem"]]
		itemValue = itemValue + petItemValue
		c(`&ePet Item Value: ${numberWithCommas(Math.round(petItemValue))}`)
		if (petInfo["skin"]) {
			let petSkinValue = lowestBinData[`PET_SKIN_${petInfo["skin"]}`]
			itemValue = itemValue + petSkinValue
			c(`&ePet Skin Value: ${numberWithCommas(Math.round(petSkinValue))}`)
		}
	}
	else {
		c(`Item Value: ${numberWithCommas(Math.round(itemValue))}`)
	}

	for (let number of Array.from(Array(extraAttributes.getInteger("rarity_upgrades")).keys())) {
		itemValue += Number(bazaarData["products"]["RECOMBOBULATOR_3000"]["buy_summary"][0]["pricePerUnit"])
		c(`&eRecombed: ${numberWithCommas(Math.round(bazaarData["products"]["RECOMBOBULATOR_3000"]["buy_summary"][0]["pricePerUnit"]))}`)
	}
	for (let number of Array.from(Array(extraAttributes.getInteger("art_of_war_count")).keys())) {
		itemValue += Number(lowestBinData['THE_ART_OF_WAR'])
		c(`&eArt of war'ed: ${numberWithCommas(Math.round(lowestBinData['THE_ART_OF_WAR']))}`)
	}
	if (extraAttributes.getInteger("hot_potato_count") > 0 && extraAttributes.getInteger("hot_potato_count") <= 10) {
		for (let number of Array.from(Array(extraAttributes.getInteger("hot_potato_count")).keys())) {
			itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
		c(`&eHpb'ed x ${extraAttributes.getInteger("hot_potato_count")}: ${numberWithCommas(Math.round((bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * extraAttributes.getInteger("hot_potato_count")))}`)
	}
	else if (extraAttributes.getInteger("hot_potato_count") > 10) {
		for (let number of Array.from(Array(10).keys())) {
			itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
		for (let number of Array.from(Array(extraAttributes.getInteger("hot_potato_count") - 10).keys())) {
			itemValue += Number(bazaarData["products"]["FUMING_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
		c(`&eHpb'ed and Fuming'ed x ${extraAttributes.getInteger("hot_potato_count")}: ${numberWithCommas(Math.round((Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * 10) + (Number(bazaarData["products"]["FUMING_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * (extraAttributes.getInteger("hot_potato_count") - 10))))}`)
	}
	for (let number of Array.from(Array(extraAttributes.getInteger("ethermerge")).keys())) {
		itemValue += Number(lowestBinData["ETHERWARP_CONDUIT"])
		c(`&eEtherwarp'ed: ${numberWithCommas(Math.round(lowestBinData["ETHERWARP_CONDUIT"]))}`)
	}

	for (let enchant of extraAttributes.getCompoundTag("enchantments").getKeySet()) {
		if (enchant in enchantsData['NORMAL']) {
			if (enchantsData['NORMAL'][enchant]['calculate'] === "true") {
				itemValue += Number(Number(lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
				enchantsValue = enchantsValue + Number(Number(lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
			}
			else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant]['goodLevel'])) {
				itemValue += Number(lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};${enchantsData['NORMAL'][enchant]['goodLevel']}`])
				enchantsValue = enchantsValue + Number(lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};${enchantsData['NORMAL'][enchant]['goodLevel']}`])
			}
			else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant]['maxLevel'])) {
				itemValue += Number(lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};${enchantsData['NORMAL'][enchant]['maxLevel']}`])
				enchantsValue = enchantsValue + Number(lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};${enchantsData['NORMAL'][enchant]['maxLevel']}`])
			}
		} else if (enchant in enchantsData['ULTIMATE']) {
			itemValue += Number(Number(lowestBinData[`${enchantsData['ULTIMATE'][enchant]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
			enchantsValue = enchantsValue + Number(Number(lowestBinData[`${enchantsData['ULTIMATE'][enchant]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
		}
	}
	if (enchantsValue > 0) {c(`&eEnchants: ${numberWithCommas(Math.round(enchantsValue))}`)}

	if (Number(extraAttributes.getInteger('dungeon_item_level')) > 5) {
		let masterStarCount = Number(extraAttributes.getInteger('dungeon_item_level')) - 5
		let masterStarValue = 0
		for (let star of Array.from(Array(masterStarCount).keys())) {
			star = Number(star) + 1
			itemValue += Number(lowestBinData[masterStarData[String(star)]])
			masterStarValue = masterStarValue + Number(lowestBinData[masterStarData[String(star)]])
		}
		c(`&eMaster Stars x ${masterStarCount}: ${numberWithCommas(Math.round(masterStarValue))}`)
	}

	if (extraAttributes.getString("power_ability_scroll")) {
		let powerScrollValue = Number(lowestBinData[extraAttributes.getString("power_ability_scroll")])
		itemvalue += powerScrollValue
		c(`&ePower Scroll Value: ${numberWithCommas(Math.round(powerScrollValue))}`)
	}

	if (item.getName().includes("Drill")) {
		let drillPartsValue = 0
		if (extraAttributes.getString("drill_part_upgrade_module")) {
			drillPartsValue = drillPartsValue + Number(lowestBinData[extraAttributes.getString("drill_part_upgrade_module").toUpperCase()])
		}
		if (extraAttributes.getString("drill_part_engine")) {
			drillPartsValue = drillPartsValue + Number(lowestBinData[extraAttributes.getString("drill_part_engine").toUpperCase()])
		}
		if (extraAttributes.getString("drill_part_fuel_tank")) {
			drillPartsValue = drillPartsValue + Number(lowestBinData[extraAttributes.getString("drill_part_fuel_tank").toUpperCase()])
		}
		itemValue += drillPartsValue
		c(`&eDrill Parts Value: ${numberWithCommas(Math.round(drillPartsValue))}`)
	}

	if (extraAttributes.getString("skin")) {
		let itemSkinValue = Number(lowestBinData[extraAttributes.getString("skin")])
		itemValue += itemSkinValue
		c(`&eSkin Value: ${numberWithCommas(Math.round(itemSkinValue))}`)
	}

	if (extraAttributes.getString("talisman_enrichment")) {
		let talismanEnrichmentValue = Number(lowestBinData[`TALISMAN_ENRICHMENT_${extraAttributes.getString("talisman_enrichment")}`])
		itemValue += talismanEnrichmentValue
		c(`&eEnrichment Value: ${numberWithCommas(Math.round(talismanEnrichmentValue))}`)
	}

	c(`Final Item Value: ${numberWithCommas(Math.round(itemValue))}`)
	c(` `)
}

register("command", (...args) => {
    if (!args) {
        c(`&eItem Value Checker v1.0.0 by ENORMOUZ. Check the value of an item by opening a chest GUI (e.g Auction House or your inventory), and tapping the key for the item value checker in Controls. You can also hold the item and type: "/iv", "/itemvalue", "/iw" or "/itemworth". Thanks for downloading my module!`)
    }
    // Refresh Data
    else if (args[0] === "request") {
        request(`https://moulberry.codes/lowestbin.json`).then((data1) => {
          lowestBinData = JSON.parse(data1)
      })
  }
}).setname("itemvaluechecker")

register("command", (...args) => {
	let item = Player.getHeldItem()
	itemValueChecker(item)
}).setName("iv")

register("command", (...args) => {
	let item = Player.getHeldItem()
	itemValueChecker(item)
}).setName("itemvalue")

register("command", (...args) => {
	let item = Player.getHeldItem()
	itemValueChecker(item)
}).setName("iw")

register("command", (...args) => {
	let item = Player.getHeldItem()
	itemValueChecker(item)
}).setName("itemworth")
