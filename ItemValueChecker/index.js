/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import settings from "./settings"
import request from "../requestV2"
import Lore from "../Lore";

const mc = Client.getMinecraft()
const fontRenderer = Renderer.getFontRenderer()
const GuiButton = Java.type("net.minecraft.client.gui.GuiButton")
const GuiTextField = Java.type("net.minecraft.client.gui.GuiTextField")
const GuiContainer = Java.type('net.minecraft.client.gui.inventory.GuiContainer')
const tileSign = Java.type("net.minecraft.client.gui.inventory.GuiEditSign").class.getDeclaredField("field_146848_f")
const doneBtn = Java.type("net.minecraft.client.gui.inventory.GuiEditSign").class.getDeclaredField("field_146852_i")
const ChatComponentText = Java.type("net.minecraft.util.ChatComponentText")

tileSign.setAccessible(true)
doneBtn.setAccessible(true)

const itemValueBind = new KeyBind("Item Value Checker", Keyboard.KEY_I, "ItemValueChecker")

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function c(message) { ChatLib.chat(message) }

function s(message) { ChatLib.say(message) }

let lowestBinData = {}
let averageLowestBinData = {}
let bazaarData = {}
let enchantsData = {}
let masterStarData = {"1": "FIRST_MASTER_STAR", "2": "SECOND_MASTER_STAR", "3": "THIRD_MASTER_STAR", "4": "FOURTH_MASTER_STAR", "5": "FIFTH_MASTER_STAR"}

function fetchLowestBin() {
	request(`https://moulberry.codes/lowestbin.json`).then((data1) => {
		lowestBinData = JSON.parse(data1)
	})
}

function fetchAverageLowestBin() {
	request(`https://moulberry.codes/auction_averages_lbin/1day.json`).then((data1) => {
		averageLowestBinData = JSON.parse(data1)
	})
}

function fetchBazaar() {
	request(`https://api.hypixel.net/skyblock/bazaar`).then((data1) => {
		bazaarData = JSON.parse(data1)
	})
}

function fetchEnchants() {
	request('https://raw.githubusercontent.com/ENORMOUZ/ENORMOUZ-Utils/main/constants/maxenchants.json').then((data1) => {
		enchantsData = JSON.parse(data1)
	})
}

fetchLowestBin()
fetchAverageLowestBin()
fetchBazaar()
fetchEnchants()

register('step', () => {
	fetchLowestBin()
	fetchAverageLowestBin()
	fetchBazaar()
	fetchEnchants()
}).setDelay(60)

register("guiKey", (key, gui, event) => {
  	if (String(event).includes('net.minecraft.client.gui.inventory.GuiEditSign') || !Keyboard.isKeyDown(itemValueBind.getKeyCode()) === true) return
	if (String(event).includes('net.minecraft.client.gui.inventory.Gui')) {
		if (Client.currentGui.get().getSlotUnderMouse()) {
			let item = Player.getOpenedInventory().getStackInSlot(Client.currentGui.get().getSlotUnderMouse().field_75222_d)
			if (!item) return
			if (!item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getString("id")) return
			itemValueChecker(item)
		}
	}
})

register("itemTooltip", (lore, item) => {
	if (settings.itemValueTooltip) {
		if (!item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getString("id")) return
		for (i = 0; i < lore.length; i++) {
			if (lore[i].includes("Item Value:")) {
				itemValue = itemValueChecker1(item)
				Lore.replace(item, i, `§r§cItem Value: ${numberWithCommas(Math.round(itemValue))}§r`)
				return
			}
		}
		itemValue = itemValueChecker1(item)
		Lore.append(item, `§r§cItem Value: ${numberWithCommas(Math.round(itemValue))}§r`, true)
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
	let gemsValue = 0

	if (itemId.equals("PET")) {
		let petInfo = extraAttributes.getString(["petInfo"])
		petInfo = JSON.parse(petInfo)
		itemId = `${petInfo["type"]};${petItemId(petInfo["tier"])}`
		itemValue = lowestBinData[itemId]
		c(`Item Value: ${numberWithCommas(Math.round(itemValue))}`)
		if (petInfo["heldItem"]) {
			let petItemValue = 0
			if (petInfo["heldItem"] in lowestBinData) {
				petItemValue = lowestBinData[petInfo["heldItem"]]
			}
			itemValue = itemValue + petItemValue
			c(`&ePet Item Value: ${numberWithCommas(Math.round(petItemValue))}`)
		}
		if (petInfo["skin"]) {
			let petSkinValue = 0
			if (`PET_SKIN_${petInfo["skin"]}` in lowestBinData) {
				petSkinValue = lowestBinData[`PET_SKIN_${petInfo["skin"]}`]
			}
			itemValue = itemValue + petSkinValue
			c(`&ePet Skin Value: ${numberWithCommas(Math.round(petSkinValue))}`)
		}
	}
	else {
		c(`Item Value: ${numberWithCommas(Math.round(itemValue))}`)
	}
	for (i = 0; i < extraAttributes.getInteger("rarity_upgrades"); i++) {
		itemValue += Number(bazaarData["products"]["RECOMBOBULATOR_3000"]["buy_summary"][0]["pricePerUnit"])
		c(`&eRecombed: ${numberWithCommas(Math.round(bazaarData["products"]["RECOMBOBULATOR_3000"]["buy_summary"][0]["pricePerUnit"]))}`)
	}
	for (i = 0; i < extraAttributes.getInteger("art_of_war_count"); i++) {
		itemValue += Number(lowestBinData['THE_ART_OF_WAR'])
		c(`&eArt of war'ed: ${numberWithCommas(Math.round(lowestBinData['THE_ART_OF_WAR']))}`)
	}
	if (extraAttributes.getInteger("hot_potato_count") > 0 && extraAttributes.getInteger("hot_potato_count") <= 10) {
		for (i = 0; i < extraAttributes.getInteger("hot_potato_count"); i++) {
			itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
		c(`&eHpb'ed x ${extraAttributes.getInteger("hot_potato_count")}: ${numberWithCommas(Math.round((bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * extraAttributes.getInteger("hot_potato_count")))}`)
	}
	else if (extraAttributes.getInteger("hot_potato_count") > 10) {
		for (i = 0; i < 10; i++) {
			itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
		for (i = 0; i < (extraAttributes.getInteger("hot_potato_count") - 10); i++) {
			itemValue += Number(bazaarData["products"]["FUMING_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
		c(`&eHpb'ed and Fuming'ed x ${extraAttributes.getInteger("hot_potato_count")}: ${numberWithCommas(Math.round((Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * 10) + (Number(bazaarData["products"]["FUMING_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * (extraAttributes.getInteger("hot_potato_count") - 10))))}`)
	}
	for (i = 0; i < extraAttributes.getInteger("ethermerge"); i++) {
		itemValue += Number(lowestBinData["ETHERWARP_CONDUIT"])
		c(`&eEtherwarp'ed: ${numberWithCommas(Math.round(lowestBinData["ETHERWARP_CONDUIT"]))}`)
	}

	for (let enchant of extraAttributes.getCompoundTag("enchantments").getKeySet()) {
		if (enchant.toLowerCase() in enchantsData['NORMAL']) {
			if (enchantsData['NORMAL'][enchant.toLowerCase()]['calculate'] === "true") {
				let numberToAdd = Number(Number(lowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
				if (!numberToAdd) {
					numberToAdd = Number(Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
					if (!numberToAdd) continue
				}
				enchantsValue += numberToAdd
			}
			else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel'])) {
				let numberToAdd = Number(lowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel']}`])
				if (!numberToAdd) {
					Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel']}`])
					if (!numberToAdd) continue
				}
				enchantsValue += numberToAdd
			}
			else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel'])) {
				let numberToAdd = Number(lowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel']}`])
				if (!numberToAdd) {
					numberToAdd = Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel']}`])
					if (!numberToAdd) continue
				}
				enchantsValue += numberToAdd
			}
		} else if (enchant.toLowerCase() in enchantsData['ULTIMATE']) {
			let numberToAdd = Number(Number(lowestBinData[`${enchantsData['ULTIMATE'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
			if (!numberToAdd) {
				numberToAdd = Number(Number(averageLowestBinData[`${enchantsData['ULTIMATE'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
				if (!numberToAdd) continue
			}
			enchantsValue += numberToAdd
		}
	}
	if (enchantsValue > 0) {
		itemValue += enchantsValue
		c(`&eEnchants: ${numberWithCommas(Math.round(enchantsValue))}`)
	}

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
	else if (Number(extraAttributes.getInteger('dungeon_item_level')) == 5 && Number(extraAttributes.getInteger('upgrade_level') > 5)) {
		let masterStarCount = Number(extraAttributes.getInteger('upgrade_level')) - 5
		let masterStarValue = 0
		for (let star of Array.from(Array(masterStarCount).keys())) {
			star = Number(star) + 1
			itemValue += Number(lowestBinData[masterStarData[String(star)]])
			masterStarValue = masterStarValue + Number(lowestBinData[masterStarData[String(star)]])
		}
		c(`&eMaster Stars x ${masterStarCount}: ${numberWithCommas(Math.round(masterStarValue))}`)
	}
	else if (Number(extraAttributes.getInteger('dungeon_item')) == 1 && Number(extraAttributes.getInteger('upgrade_level') > 5)) {
		let masterStarCount = Number(extraAttributes.getInteger('upgrade_level')) - 5
		let masterStarValue = 0
		for (let star of Array.from(Array(masterStarCount).keys())) {
			star = Number(star) + 1
			itemValue += Number(lowestBinData[masterStarData[String(star)]])
			masterStarValue = masterStarValue + Number(lowestBinData[masterStarData[String(star)]])
		}
		c(`&eMaster Stars x ${masterStarCount}: ${numberWithCommas(Math.round(masterStarValue))}`)
	}

	for (let gem of extraAttributes.getCompoundTag("gems").getKeySet()) {
		if (!gem.endsWith("_gem") && gem != "unlocked_slots") {
			if (!extraAttributes.getCompoundTag("gems").getString(`${gem}_gem`)) {
				part_2 = gem.substring(0, gem.lastIndexOf("_"))
			}
			else {
				part_2 = extraAttributes.getCompoundTag("gems").getString(`${gem}_gem`)
			}
			gemsValue += Number(bazaarData["products"][`${extraAttributes.getCompoundTag("gems").getString(gem).toUpperCase()}_${part_2.toUpperCase()}_GEM`]["buy_summary"][0]["pricePerUnit"])
		}
	}

	if (gemsValue > 0) {
		itemValue += gemsValue
		c(`&eGemstones: ${numberWithCommas(Math.round(gemsValue))}`)
	}

	if (extraAttributes.getString("power_ability_scroll")) {
		let powerScrollValue = Number(lowestBinData[extraAttributes.getString("power_ability_scroll")])
		itemValue += powerScrollValue
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

	if (item.getName().includes("Of Divan")) {
		let gemstoneChambersValue = 0
		if (extraAttributes.getInteger("gemstone_slots")) {
			for (i = 0; i < extraAttributes.getInteger("gemstone_slots"); i++) {
				gemstoneChambersValue += Number(lowestBinData["GEMSTONE_CHAMBER"])
			}
			itemValue += gemstoneChambersValue
			c(`&eGemstone Chambers Value: ${numberWithCommas(Math.round(gemstoneChambersValue))}`)
		}
		else {
			for (let gem of extraAttributes.getCompoundTag("gems").getKeySet()) {
				if (gem == "unlocked_slots") {
					for (i = 0; i < new NBTTagList(extraAttributes.getCompoundTag("gems").getTagList("unlocked_slots", 8)).tagCount; i++) {
						gemstoneChambersValue += Number(lowestBinData["GEMSTONE_CHAMBER"])
					}
					itemValue += gemstoneChambersValue
					c(`&eGemstone Chambers Value: ${numberWithCommas(Math.round(gemstoneChambersValue))}`)
				}
			}
		}
	}

	c(`Final Item Value: ${numberWithCommas(Math.round(itemValue))}`)
	c(` `)
}

function itemValueChecker1(item) {
	const extraAttributes = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes")

	let itemId = extraAttributes.getString("id")
	let itemValue = lowestBinData[`${itemId}`]
	let enchantsValue = 0
	let gemsValue = 0

	if (itemId.equals("PET")) {
		let petInfo = extraAttributes.getString(["petInfo"])
		petInfo = JSON.parse(petInfo)
		itemId = `${petInfo["type"]};${petItemId(petInfo["tier"])}`
		itemValue = lowestBinData[itemId]
		if (petInfo["heldItem"]) {
			let petItemValue = 0
			if (petInfo["heldItem"] in lowestBinData) {
				petItemValue = lowestBinData[petInfo["heldItem"]]
			}
			itemValue = itemValue + petItemValue
		}
		if (petInfo["skin"]) {
			let petSkinValue = 0
			if (`PET_SKIN_${petInfo["skin"]}` in lowestBinData) {
				petSkinValue = lowestBinData[`PET_SKIN_${petInfo["skin"]}`]
			}
			itemValue = itemValue + petSkinValue
		}
	}
	for (i = 0; i < extraAttributes.getInteger("rarity_upgrades"); i++) {
		itemValue += Number(bazaarData["products"]["RECOMBOBULATOR_3000"]["buy_summary"][0]["pricePerUnit"])
	}
	for (i = 0; i < extraAttributes.getInteger("art_of_war_count"); i++) {
		itemValue += Number(lowestBinData['THE_ART_OF_WAR'])
	}
	if (extraAttributes.getInteger("hot_potato_count") > 0 && extraAttributes.getInteger("hot_potato_count") <= 10) {
		for (i = 0; i < extraAttributes.getInteger("hot_potato_count"); i++) {
			itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
	}
	else if (extraAttributes.getInteger("hot_potato_count") > 10) {
		for (i = 0; i < 10; i++) {
			itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
		for (i = 0; i < (extraAttributes.getInteger("hot_potato_count") - 10); i++) {
			itemValue += Number(bazaarData["products"]["FUMING_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
		}
	}
	for (i = 0; i < extraAttributes.getInteger("ethermerge"); i++) {
		itemValue += Number(lowestBinData["ETHERWARP_CONDUIT"])
	}

	for (let enchant of extraAttributes.getCompoundTag("enchantments").getKeySet()) {
		if (enchant.toLowerCase() in enchantsData['NORMAL']) {
			if (enchantsData['NORMAL'][enchant.toLowerCase()]['calculate'] === "true") {
				let numberToAdd = Number(Number(lowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
				if (!numberToAdd) {
					numberToAdd = Number(Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
					if (!numberToAdd) continue
				}
				enchantsValue += numberToAdd
			}
			else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel'])) {
				let numberToAdd = Number(lowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel']}`])
				if (!numberToAdd) {
					Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel']}`])
					if (!numberToAdd) continue
				}
				enchantsValue += numberToAdd
			}
			else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel'])) {
				let numberToAdd = Number(lowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel']}`])
				if (!numberToAdd) {
					numberToAdd = Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel']}`])
					if (!numberToAdd) continue
				}
				enchantsValue += numberToAdd
			}
		} else if (enchant.toLowerCase() in enchantsData['ULTIMATE']) {
			let numberToAdd = Number(Number(lowestBinData[`${enchantsData['ULTIMATE'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
			if (!numberToAdd) {
				numberToAdd = Number(Number(averageLowestBinData[`${enchantsData['ULTIMATE'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
				if (!numberToAdd) continue
			}
			enchantsValue += numberToAdd
		}
	}
	if (enchantsValue > 0) {
		itemValue += enchantsValue
	}

	if (Number(extraAttributes.getInteger('dungeon_item_level')) > 5) {
		let masterStarCount = Number(extraAttributes.getInteger('dungeon_item_level')) - 5
		let masterStarValue = 0
		for (let star of Array.from(Array(masterStarCount).keys())) {
			star = Number(star) + 1
			itemValue += Number(lowestBinData[masterStarData[String(star)]])
			masterStarValue = masterStarValue + Number(lowestBinData[masterStarData[String(star)]])
		}
	}
	else if (Number(extraAttributes.getInteger('dungeon_item_level')) == 5 && Number(extraAttributes.getInteger('upgrade_level') > 5)) {
		let masterStarCount = Number(extraAttributes.getInteger('upgrade_level')) - 5
		let masterStarValue = 0
		for (let star of Array.from(Array(masterStarCount).keys())) {
			star = Number(star) + 1
			itemValue += Number(lowestBinData[masterStarData[String(star)]])
			masterStarValue = masterStarValue + Number(lowestBinData[masterStarData[String(star)]])
		}
	}
	else if (Number(extraAttributes.getInteger('dungeon_item')) == 1 && Number(extraAttributes.getInteger('upgrade_level') > 5)) {
		let masterStarCount = Number(extraAttributes.getInteger('upgrade_level')) - 5
		let masterStarValue = 0
		for (let star of Array.from(Array(masterStarCount).keys())) {
			star = Number(star) + 1
			itemValue += Number(lowestBinData[masterStarData[String(star)]])
			masterStarValue = masterStarValue + Number(lowestBinData[masterStarData[String(star)]])
		}
	}

	for (let gem of extraAttributes.getCompoundTag("gems").getKeySet()) {
		if (!gem.endsWith("_gem") && gem != "unlocked_slots") {
			if (!extraAttributes.getCompoundTag("gems").getString(`${gem}_gem`)) {
				part_2 = gem.substring(0, gem.lastIndexOf("_"))
			}
			else {
				part_2 = extraAttributes.getCompoundTag("gems").getString(`${gem}_gem`)
			}
			gemsValue += Number(bazaarData["products"][`${extraAttributes.getCompoundTag("gems").getString(gem).toUpperCase()}_${part_2.toUpperCase()}_GEM`]["buy_summary"][0]["pricePerUnit"])
		}
	}

	if (gemsValue > 0) {
		itemValue += gemsValue
	}

	if (extraAttributes.getString("power_ability_scroll")) {
		let powerScrollValue = Number(lowestBinData[extraAttributes.getString("power_ability_scroll")])
		itemValue += powerScrollValue
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
	}

	if (extraAttributes.getString("skin")) {
		let itemSkinValue = Number(lowestBinData[extraAttributes.getString("skin")])
		itemValue += itemSkinValue
	}

	if (extraAttributes.getString("talisman_enrichment")) {
		let talismanEnrichmentValue = Number(lowestBinData[`TALISMAN_ENRICHMENT_${extraAttributes.getString("talisman_enrichment")}`])
		itemValue += talismanEnrichmentValue
	}

	if (item.getName().includes("Of Divan")) {
		let gemstoneChambersValue = 0
		if (extraAttributes.getInteger("gemstone_slots")) {
			for (i = 0; i < extraAttributes.getInteger("gemstone_slots"); i++) {
				gemstoneChambersValue += Number(lowestBinData["GEMSTONE_CHAMBER"])
			}
			itemValue += gemstoneChambersValue
		}
		else {
			for (let gem of extraAttributes.getCompoundTag("gems").getKeySet()) {
				if (gem == "unlocked_slots") {
					for (i = 0; i < new NBTTagList(extraAttributes.getCompoundTag("gems").getTagList("unlocked_slots", 8)).tagCount; i++) {
						gemstoneChambersValue += Number(lowestBinData["GEMSTONE_CHAMBER"])
					}
					itemValue += gemstoneChambersValue
				}
			}
		}
	}
	
	return itemValue
}

class priceInput {
	static priceInputClicked = false
	static priceInputListPrice = 0
	static inventoryButtons = [
		{
			id: "priceInputMacro",
			btn: new GuiButton(501, 410, 140, 100, 20, "BIN Price -1"),
			guiclass: GuiContainer,
			title: "Create BIN Auction",
			mouse: [0],
			result: priceInputMacro
		},
		{
			id: "priceInputManual",
			btn: new GuiButton(501, 410, 180, 100, 20, "Custom Price"),
			guiclass: GuiContainer,
			title: "Create BIN Auction",
			mouse: [0],
			result: priceInputManual
		},
		{
			id: "priceInputMacro",
			btn: new GuiButton(501, 410, 200, 100, 20, "BIN Price -1 6H"),
			guiclass: GuiContainer,
			title: "Create BIN Auction",
			mouse: [0],
			result: priceInputMacro1
		}
	]
	static priceInputManualTextField = new GuiTextField(0, Client.getMinecraft().field_71466_p,  410, 162, 100, 15)
	static priceInputManualPrice = 0
}

function priceInputMacro1() {
	let inventory = Player.getOpenedInventory()
	inventory.click(31, false, "MIDDLE")
	priceInput.priceInputClicked = "true2"
}


function priceInputMacro() {
	let inventory = Player.getOpenedInventory()
	inventory.click(31, false, "MIDDLE")
	priceInput.priceInputClicked = true
}

function priceInputManual() {
	let inventory = Player.getOpenedInventory()
	inventory.click(31, false, "MIDDLE")
	priceInput.priceInputClicked = "true1"
}

register("tick", () => {
	if (!Client.isInGui()) {
	  	priceInput.priceInputManualTextField.func_146195_b(false) // setfocused
	}
	else {
		priceInput.priceInputManualPrice = priceInput.priceInputManualTextField.func_146179_b()
	}
})

register("guiRender", (x, y) => {
	if (Client.currentGui.getClassName() === "GuiChest" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("Create BIN Auction")) {
		// insert settings "display lowest bin price when creating bin auction?"
		try {
			let inventory = Player.getOpenedInventory()
			let item = inventory.getStackInSlot(13)
			const extraAttributes = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes")
			let itemId = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getString("id")
			if (itemId === "") {return}
			let lowestBinPrice = lowestBinData[`${itemId}`]
			let itemValue = 0
			if (itemId.includes("ENCHANTED_BOOK")) {
				for (let enchant of extraAttributes.getCompoundTag("enchantments").getKeySet()) {
					if (enchant in enchantsData['NORMAL']) {
						itemValue = itemValue + lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};${Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))}`]
						console.log(lowestBinData[`${enchantsData['NORMAL'][enchant]['neuName']};${Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))}`])
					}
					else if (enchant in enchantsData['ULTIMATE']) {
						itemValue = itemValue + Number(Number(lowestBinData[`${enchantsData['ULTIMATE'][enchant]['neuName']};${Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))}`]))
					}
				}
			}
			else {
				itemValue = lowestBinPrice
			}
			if (itemId.equals("PET")) {
				let petInfo = extraAttributes.getString(["petInfo"])
				petInfo = JSON.parse(petInfo)
				itemId = `${petInfo["type"]};${petItemId(petInfo["tier"])}`
				itemValue = lowestBinData[itemId]
			}
			priceInput.priceInputListPrice = Math.round(itemValue - 1)
			let text = priceInput.priceInputListPrice;
			let xPos = Renderer.screen.getWidth() / 1.56 + Renderer.getStringWidth(text) / 1.45;
			let yPos = 125
			fontRenderer.func_78276_b(text, xPos, yPos, Renderer.RED)
		}
		catch (e) {
			return
		}	
	}
	if (Client.currentGui.getClassName() === "GuiEditSign" && priceInput.priceInputClicked === true) {
		let currentTileSign = tileSign.get(Client.currentGui.get())
		currentTileSign.field_145915_a[0] = new ChatComponentText(`${priceInput.priceInputListPrice}`)
		currentTileSign.func_70296_d()
		mc.func_147108_a(null)
		priceInput.priceInputClicked = "done"
	}
	if (Client.currentGui.getClassName() === "GuiEditSign" && priceInput.priceInputClicked === "true1") {
		let currentTileSign = tileSign.get(Client.currentGui.get())
		currentTileSign.field_145915_a[0] = new ChatComponentText(`${priceInput.priceInputManualPrice}`)
		currentTileSign.func_70296_d()
		mc.func_147108_a(null)
		priceInput.priceInputClicked = "done"
	}
	if (Client.currentGui.getClassName() === "GuiEditSign" && priceInput.priceInputClicked === "true2") {
		let currentTileSign = tileSign.get(Client.currentGui.get())
		currentTileSign.field_145915_a[0] = new ChatComponentText(`${priceInput.priceInputListPrice}`)
		currentTileSign.func_70296_d()
		mc.func_147108_a(null)
		priceInput.priceInputClicked = "done1"
	}
	if (Client.currentGui.getClassName() === "GuiChest" && priceInput.priceInputClicked === "done" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("Create BIN Auction")) {
		let inventory = Player.getOpenedInventory()
		inventory.click(33, false, "MIDDLE")
		priceInput.priceInputClicked = "done 1"
	}
	if (Client.currentGui.getClassName() === "GuiChest" && priceInput.priceInputClicked === "done1" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("Create BIN Auction")) {
		priceInput.priceInputClicked = "done 3"
	}
	if (Client.currentGui.getClassName() === "GuiChest" && priceInput.priceInputClicked === "done 1" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("Auction Duration")) {
		let inventory = Player.getOpenedInventory()
		inventory.click(16, false, "MIDDLE")
		priceInput.priceInputClicked = "done 2"
	}
	if (Client.currentGui.getClassName() === "GuiEditSign" && priceInput.priceInputClicked === "done 2") {
		let currentTileSign = tileSign.get(Client.currentGui.get())
		currentTileSign.field_145915_a[0] = new ChatComponentText("336")
		currentTileSign.func_70296_d()
		mc.func_147108_a(null)
		priceInput.priceInputClicked = "done 3"
	}
	if (Client.currentGui.getClassName() === "GuiChest" && priceInput.priceInputClicked === "done 3" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("Create BIN Auction")) {
		let inventory = Player.getOpenedInventory()
		inventory.click(29, false, "MIDDLE")
		priceInput.priceInputClicked = "done 4"
	}
	if (Client.currentGui.getClassName() === "GuiChest" && priceInput.priceInputClicked === "done 4" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("Confirm BIN Auction")) {
		let inventory = Player.getOpenedInventory()
		inventory.click(11, false, "MIDDLE")
		priceInput.priceInputClicked = "done 5"
	}
	if (Client.currentGui.getClassName() === "GuiChest" && priceInput.priceInputClicked === "done 5" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("Confirm BIN Auction")) {
		let inventory = Player.getOpenedInventory()
		inventory.click(11, false, "MIDDLE")
		priceInput.priceInputClicked = "done 6"
	}
	if (Client.currentGui.getClassName() === "GuiChest" && priceInput.priceInputClicked === "done 6" && ChatLib.removeFormatting(Player.getOpenedInventory().getName()).includes("BIN Auction View")) {
		let inventory = Player.getOpenedInventory()
		inventory.click(49, false, "MIDDLE")
		priceInput.priceInputClicked = false
	}
})

register("guiRender", (x, y) => {
	priceInput.inventoryButtons.forEach(button => {
		try {
			if (
				(
					button.guiclass === GuiContainer &&
					Player !== null &&
					Player.getOpenedInventory() !== null &&
					Player.getOpenedInventory().getName().match(button.title)
				) ||
				button.guiclass !== GuiContainer
			) button.btn.func_146112_a(mc, x, y)
		}
		catch (e) {
			return
		}
    })
	try {
		if (Player !== null && Player.getOpenedInventory() !== null && Player.getOpenedInventory().getName().match("Create BIN Auction")) {
			priceInput.priceInputManualTextField.func_146194_f() // draw text box
		}
	} catch (e) {}
})

register("guiKey", (char, keyCode, gui, event) => {
	if (priceInput.priceInputManualTextField.func_146206_l()) { // if text box is focused
	  	priceInput.priceInputManualTextField.func_146201_a(char, keyCode) // add character to text box
	  	if (keyCode != 1) { // keycode for escape key
			cancel(event)
	  	}
	}
})

register("guiMouseClick", (x, y, mbtn) => {
    priceInput.inventoryButtons.forEach(button => {
        if (button.btn.func_146115_a()) {
            if (button.mouse.includes(mbtn)) {
                if (Client.currentGui.get() instanceof button.guiclass) {
					if (button.id.match("priceInputMacro")) {
						if (
							(
								button.guiclass === GuiContainer &&
								Player.getOpenedInventory() !== null &&
								Player.getOpenedInventory().getName().match(button.title)
							) ||
							button.guiclass !== GuiContainer
						) {
							button.btn.func_146113_a(mc.func_147118_V());
							button.result();
						}
					}
					else if (button.id.match("priceInputManual")) {
						if (
							(
								button.guiclass === GuiContainer &&
								Player.getOpenedInventory() !== null &&
								Player.getOpenedInventory().getName().match(button.title)
							) ||
							button.guiclass !== GuiContainer
						) {
							button.btn.func_146113_a(mc.func_147118_V());
							button.result();
						}
					}
                }
            }
        }
    })
	priceInput.priceInputManualTextField.func_146192_a(x, y, mbtn); // detect when click text box
});

register("command", (...args) => {
    if (!args) {
        //c(`&eItem Value Checker v1.0.0 by ENORMOUZ. Check the value of an item by opening a chest GUI (e.g Auction House or your inventory), and tapping the key (Default is "I") for the item value checker in Controls. You can also hold the item and type: "/iv", "/itemvalue", "/iw" or "/itemworth". Thanks for downloading my module!`)
		settings.openGUI()
    }
}).setName("itemvaluechecker")

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
