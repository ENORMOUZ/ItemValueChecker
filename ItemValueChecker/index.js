/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import settings from "./settings"
import request from "../requestV2"
import Lore from "../Lore"

import "./FirstInstall"
import { itemValueCheckerData } from "./utils"

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

function titleCase(str) {
	var splitStr = str.toLowerCase().split(' ');
	for (var i = 0; i < splitStr.length; i++) {
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
	}
	return splitStr.join(' '); 
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
	request('https://raw.githubusercontent.com/ENORMOUZ/ItemValueChecker/main/ItemValueChecker/constants/maxenchants.json').then((data1) => {
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
	try {
		const extraAttributes = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes")

		let itemId = extraAttributes.getString("id")
		c(`${settings.itemNameIDColour}Name: ${ChatLib.removeFormatting(item.getName())}, Id: ${itemId}`)
		let itemValue = lowestBinData[`${itemId}`]
		let gemsValue = 0

		if (itemId.equals("PET")) {
			let petInfo = extraAttributes.getString(["petInfo"])
			petInfo = JSON.parse(petInfo)
			itemId = `${petInfo["type"]};${petItemId(petInfo["tier"])}`
			itemValue = lowestBinData[itemId]
			c(`${settings.itemBaseValueColour}Item Value: ${numberWithCommas(Math.round(itemValue))}`)
			if (petInfo["heldItem"]) {
				let petItemValue = 0
				if (petInfo["heldItem"] in lowestBinData) {
					petItemValue = lowestBinData[petInfo["heldItem"]]
				}
				itemValue = itemValue + petItemValue
				c(`${settings.itemUpgradesColour}Pet Item Value: ${numberWithCommas(Math.round(petItemValue))}`)
			}
			if (settings.calculateSkins) {
				if (petInfo["skin"]) {
					let petSkinValue = 0
					if (`PET_SKIN_${petInfo["skin"]}` in lowestBinData) {
						petSkinValue = lowestBinData[`PET_SKIN_${petInfo["skin"]}`]
					}
					itemValue = itemValue + petSkinValue
					c(`${settings.itemUpgradesColour}Pet Skin Value: ${numberWithCommas(Math.round(petSkinValue))}`)
				}
			}	
		}
		else if (itemId.equals("ENCHANTED_BOOK")) {
			itemValue = 0
			c(`${settings.itemBaseValueColour}Item Value: 0`)
		}
		else {
			c(`${settings.itemBaseValueColour}Item Value: ${numberWithCommas(Math.round(itemValue))}`)
		}
		for (i = 0; i < extraAttributes.getInteger("rarity_upgrades"); i++) {
			itemValue += Number(bazaarData["products"]["RECOMBOBULATOR_3000"]["buy_summary"][0]["pricePerUnit"])
			c(`${settings.itemUpgradesColour}Recombed: ${numberWithCommas(Math.round(bazaarData["products"]["RECOMBOBULATOR_3000"]["buy_summary"][0]["pricePerUnit"]))}`)
		}
		for (i = 0; i < extraAttributes.getInteger("art_of_war_count"); i++) {
			itemValue += Number(bazaarData["products"]["THE_ART_OF_WAR"]["buy_summary"][0]["pricePerUnit"])
			c(`${settings.itemUpgradesColour}Art of war'ed: ${numberWithCommas(Math.round(Number(bazaarData["products"]["THE_ART_OF_WAR"]["buy_summary"][0]["pricePerUnit"])))}`)
		}
		if (extraAttributes.getInteger("hot_potato_count") > 0 && extraAttributes.getInteger("hot_potato_count") <= 10) {
			for (i = 0; i < extraAttributes.getInteger("hot_potato_count"); i++) {
				itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
			}
			c(`${settings.itemUpgradesColour}Hpb'ed x ${extraAttributes.getInteger("hot_potato_count")}: ${numberWithCommas(Math.round((bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * extraAttributes.getInteger("hot_potato_count")))}`)
		}
		else if (extraAttributes.getInteger("hot_potato_count") > 10) {
			for (i = 0; i < 10; i++) {
				itemValue += Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
			}
			for (i = 0; i < (extraAttributes.getInteger("hot_potato_count") - 10); i++) {
				itemValue += Number(bazaarData["products"]["FUMING_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"])
			}
			c(`${settings.itemUpgradesColour}Hpb'ed and Fuming'ed x ${extraAttributes.getInteger("hot_potato_count")}: ${numberWithCommas(Math.round((Number(bazaarData["products"]["HOT_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * 10) + (Number(bazaarData["products"]["FUMING_POTATO_BOOK"]["buy_summary"][0]["pricePerUnit"]) * (extraAttributes.getInteger("hot_potato_count") - 10))))}`)
		}
		for (i = 0; i < extraAttributes.getInteger("ethermerge"); i++) {
			itemValue += Number(lowestBinData["ETHERWARP_CONDUIT"])
			c(`${settings.itemUpgradesColour}Etherwarp'ed: ${numberWithCommas(Math.round(lowestBinData["ETHERWARP_CONDUIT"]))}`)
		}
		if (settings.calculateEnchants) {
			let enchantsValue = 0
			let enchantsText = ""
			for (let enchant of extraAttributes.getCompoundTag("enchantments").getKeySet()) {
				if (enchant.toLowerCase() in enchantsData['NORMAL']) {
					if (enchantsData['NORMAL'][enchant.toLowerCase()]['calculate'] === "true") {
						let numberToAdd = Number(Number(bazaarData["products"][`ENCHANTMENT_${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']}_1`]["buy_summary"][0]["pricePerUnit"]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
						/*
						if (!numberToAdd) {
							numberToAdd = Number(Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
							if (!numberToAdd) continue
						}
						*/
						enchantsValue += numberToAdd
						let enchantFormatted = enchant.replace("_", " ")
						enchantFormatted = titleCase(enchantFormatted)
						enchantsText = enchantsText.concat(`${enchantFormatted} ${String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))}: ${numberWithCommas(Math.round(numberToAdd))}\n`)
					}
					else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel'])) {
						let numberToAdd = Number(bazaarData["products"][`ENCHANTMENT_${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']}_${enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel']}`]["buy_summary"][0]["pricePerUnit"])
						/*
						if (!numberToAdd) {
							Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['goodLevel']}`])
							if (!numberToAdd) continue
						}
						*/
						enchantsValue += numberToAdd
						let enchantFormatted = enchant.replace("_", " ")
						enchantFormatted = titleCase(enchantFormatted)
						enchantsText = enchantsText.concat(`${enchantFormatted} ${String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))}: ${numberWithCommas(Math.round(numberToAdd))}\n`)
					}
					else if (Number(extraAttributes.getCompoundTag("enchantments").getInteger(enchant)) === Number(enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel'])) {
						let numberToAdd = Number(bazaarData["products"][`ENCHANTMENT_${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']}_${enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel']}`]["buy_summary"][0]["pricePerUnit"])
						/*
						if (!numberToAdd) {
							numberToAdd = Number(averageLowestBinData[`${enchantsData['NORMAL'][enchant.toLowerCase()]['neuName']};${enchantsData['NORMAL'][enchant.toLowerCase()]['maxLevel']}`])
							if (!numberToAdd) continue
						}
						*/
						enchantsValue += numberToAdd
						let enchantFormatted = enchant.replace("_", " ")
						enchantFormatted = titleCase(enchantFormatted)
						enchantsText = enchantsText.concat(`${enchantFormatted} ${String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))}: ${numberWithCommas(Math.round(numberToAdd))}\n`)
					}
				} else if (enchant.toLowerCase() in enchantsData['ULTIMATE']) {
					let numberToAdd = Number(Number(bazaarData["products"][`ENCHANTMENT_${enchantsData['ULTIMATE'][enchant.toLowerCase()]['neuName']}_1`]["buy_summary"][0]["pricePerUnit"]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
					/*
					if (!numberToAdd) {
						numberToAdd = Number(Number(averageLowestBinData[`${enchantsData['ULTIMATE'][enchant.toLowerCase()]['neuName']};1`]) * Number(enchantsData['COSTS'][String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))]))
						if (!numberToAdd) continue
					}
					*/
					enchantsValue += numberToAdd
					let enchantFormatted = enchant.replace("_", " ")
					enchantFormatted = titleCase(enchantFormatted)
					enchantsText = enchantsText.concat(`&d${enchantFormatted} ${String(extraAttributes.getCompoundTag("enchantments").getInteger(enchant))}&r: ${numberWithCommas(Math.round(numberToAdd))}\n`)
				}
			}
			if (enchantsValue > 0) {
				itemValue += enchantsValue
				//c(`${settings.itemUpgradesColour}Enchants: ${numberWithCommas(Math.round(enchantsValue))}`)
				enchantsText = enchantsText.slice(0, -1)
				new TextComponent(`${settings.itemUpgradesColour}Enchants: ${numberWithCommas(Math.round(enchantsValue))}`).setHover("show_text", enchantsText).chat()
			}
		}
		if (settings.calculateMasterStars) {w
			if (Number(extraAttributes.getInteger('dungeon_item_level')) > 5) {
				let masterStarCount = Number(extraAttributes.getInteger('dungeon_item_level')) - 5
				let masterStarValue = 0
				let masterStarText = ""
				for (let star of Array.from(Array(masterStarCount).keys())) {
					star = Number(star) + 1
					itemValue += Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])
					masterStarValue = masterStarValue + Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])
					let masterStarFormatted = masterStarData[String(star)].replace("_", " ")
					masterStarFormatted = titleCase(masterStarFormatted)
					masterStarText = masterStarText.concat(`${masterStarFormatted}: ${numberWithCommas(Math.round(Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])))}\n`)
				}
				masterStarText = masterStarText.slice(0, -1)
				new TextComponent(`${settings.itemUpgradesColour}Master Stars x ${masterStarCount}: ${numberWithCommas(Math.round(masterStarValue))}`).setHover("show_text", masterStarText).chat()
			}
			else if (Number(extraAttributes.getInteger('dungeon_item_level')) == 5 && Number(extraAttributes.getInteger('upgrade_level') > 5)) {
				let masterStarCount = Number(extraAttributes.getInteger('upgrade_level')) - 5
				let masterStarValue = 0
				let masterStarText = ""
				for (let star of Array.from(Array(masterStarCount).keys())) {
					star = Number(star) + 1
					itemValue += Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])
					masterStarValue = masterStarValue + Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])
					let masterStarFormatted = masterStarData[String(star)].replace("_", " ")
					masterStarFormatted = titleCase(masterStarFormatted)
					masterStarText = masterStarText.concat(`${masterStarFormatted}: ${numberWithCommas(Math.round(Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])))}\n`)
				}
				masterStarText = masterStarText.slice(0, -1)
				new TextComponent(`${settings.itemUpgradesColour}Master Stars x ${masterStarCount}: ${numberWithCommas(Math.round(masterStarValue))}`).setHover("show_text", masterStarText).chat()
			}
			else if (Number(extraAttributes.getInteger('dungeon_item')) == 1 && Number(extraAttributes.getInteger('upgrade_level') > 5)) {
				let masterStarCount = Number(extraAttributes.getInteger('upgrade_level')) - 5
				let masterStarValue = 0
				let masterStarText = ""
				for (let star of Array.from(Array(masterStarCount).keys())) {
					star = Number(star) + 1
					itemValue += Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])
					masterStarValue = masterStarValue + Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])
					let masterStarFormatted = masterStarData[String(star)].replace("_", " ")
					masterStarFormatted = titleCase(masterStarFormatted)
					masterStarText = masterStarText.concat(`${masterStarFormatted}: ${numberWithCommas(Math.round(Number(bazaarData["products"][masterStarData[String(star)]]["buy_summary"][0]["pricePerUnit"])))}\n`)
				}
				masterStarText = masterStarText.slice(0, -1)
				new TextComponent(`${settings.itemUpgradesColour}Master Stars x ${masterStarCount}: ${numberWithCommas(Math.round(masterStarValue))}`).setHover("show_text", masterStarText).chat()
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
			c(`${settings.itemUpgradesColour}Gemstones: ${numberWithCommas(Math.round(gemsValue))}`)
		}

		if (extraAttributes.getString("power_ability_scroll")) {
			let powerScrollValue = Number(lowestBinData[extraAttributes.getString("power_ability_scroll")])
			itemValue += powerScrollValue
			c(`${settings.itemUpgradesColour}Power Scroll Value: ${numberWithCommas(Math.round(powerScrollValue))}`)
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
			c(`${settings.itemUpgradesColour}Drill Parts Value: ${numberWithCommas(Math.round(drillPartsValue))}`)
		}
		
		if (settings.calculateSkins) {
			if (extraAttributes.getString("skin")) {
				let itemSkinValue = Number(lowestBinData[extraAttributes.getString("skin")])
				itemValue += itemSkinValue
				c(`${settings.itemUpgradesColour}Skin Value: ${numberWithCommas(Math.round(itemSkinValue))}`)
			}
		}

		if (settings.calculateDyes) {
			if (extraAttributes.getString("dye_item")) {
				let itemDyeValue = Number(lowestBinData[extraAttributes.getString("dye_item")])
				itemValue += itemDyeValue
				c(`${settings.itemUpgradesColour}Dye Value: ${numberWithCommas(Math.round(itemDyeValue))}`)
			}
		}

		if (extraAttributes.getString("talisman_enrichment")) {
			let talismanEnrichmentValue = Number(lowestBinData[`TALISMAN_ENRICHMENT_${extraAttributes.getString("talisman_enrichment")}`])
			itemValue += talismanEnrichmentValue
			c(`${settings.itemUpgradesColour}Enrichment Value: ${numberWithCommas(Math.round(talismanEnrichmentValue))}`)
		}

		if (item.getName().includes("Of Divan")) {
			let gemstoneChambersValue = 0
			if (extraAttributes.getInteger("gemstone_slots")) {
				for (i = 0; i < extraAttributes.getInteger("gemstone_slots"); i++) {
					gemstoneChambersValue += Number(lowestBinData["GEMSTONE_CHAMBER"])
				}
				itemValue += gemstoneChambersValue
				c(`${settings.itemUpgradesColour}Gemstone Chambers Value: ${numberWithCommas(Math.round(gemstoneChambersValue))}`)
			}
			else {
				for (let gem of extraAttributes.getCompoundTag("gems").getKeySet()) {
					if (gem == "unlocked_slots") {
						for (i = 0; i < new NBTTagList(extraAttributes.getCompoundTag("gems").getTagList("unlocked_slots", 8)).tagCount; i++) {
							gemstoneChambersValue += Number(lowestBinData["GEMSTONE_CHAMBER"])
						}
						itemValue += gemstoneChambersValue
						c(`${settings.itemUpgradesColour}Gemstone Chambers Value: ${numberWithCommas(Math.round(gemstoneChambersValue))}`)
					}
				}
			}
		}

		c(`${settings.itemFinalValueColour}Final Item Value: ${numberWithCommas(Math.round(itemValue))}`)
		c(` `)
	}
	catch (e) {
		c(`&cSomething went wrong while trying to calculate item value! ${e}`)
	}		
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

register("command", (...args) => {
    if (!args[0]) {
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
