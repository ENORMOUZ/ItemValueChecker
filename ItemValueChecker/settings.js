import {
    @ButtonProperty,
    Color,
    @ColorProperty,
    @PercentSliderProperty,
    @SelectorProperty,
    @TextProperty,
    @SwitchProperty,
    @SliderProperty,
    @Vigilant,
} from '../Vigilance/index';

@Vigilant("ItemValueChecker", "ItemValueChecker", {
    getCategoryComparator: () => (a, b) => {
        const categories = ["General", "Calculation", "Colours"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})
class Settings {
    constructor() {
        this.initialize(this)
        this.setCategoryDescription("General", 
            `
            &b&l&nItemValueChecker ${JSON.parse(FileLib.read("ItemValueChecker", "metadata.json")).version}

            &7Made By ENORMOUZ
            `
        )
    }

    @ButtonProperty({
        name: "&3&lDiscord Server",
        description: "Official Discord server for my mods and modules, make suggestions and report bugs here.",
        category: "General",
        placeholder: "Join"
    })
    MyDiscord() {
        java.awt.Desktop.getDesktop().browse(new java.net.URI("https://discord.gg/wjChDvs9DT"))
    }

    @TextProperty({
        name: "Item Name + ID Colour",
        description: "Minecraft colour code for item name + ID, example '& e' but without the space",
        category: "Colours",
        subcategory: "Text"
    })
    itemNameIDColour = ""

    @TextProperty({
        name: "Item Base Value Colour",
        description: "Minecraft colour code for item's base value (lowest bin), example '& e' but without the space",
        category: "Colours",
        subcategory: "Text"
    })
    itemBaseValueColour = ""

    @TextProperty({
        name: "Item Upgrades Colour",
        description: "Minecraft colour code for the item's upgrades (enchantments, recombs etc), example '& e' but without the space",
        category: "Colours",
        subcategory: "Text"
    })
    itemUpgradesColour = "&e"

    @TextProperty({
        name: "Item Final Value Colour",
        description: "Minecraft colour code for item's final value, example '& e' but without the space",
        category: "Colours",
        subcategory: "Text"
    })
    itemFinalValueColour = ""

    @SwitchProperty({
        name: "&6Update Messages (IN PROGRESS)",
        description: "Notify you when there is a new ItemValueChecker version available. (IN PROGRESS)",
        category: "General",
        subcategory: "Updates"
    })
    notifyUpdates = true;

    @SwitchProperty({
        name: "Calculate Enchants",
        description: "Include enchants in item value calculation.",
        category: "Calculation",
        subcategory: "Item"
    })
    calculateEnchants = true;

    @SwitchProperty({
        name: "Calculate Skins",
        description: "Include skins in item value calculation.",
        category: "Calculation",
        subcategory: "Item"
    })
    calculateSkins = true;

    @SwitchProperty({
        name: "Calculate Master Stars",
        description: "Include master stars in item value calculation.",
        category: "Calculation",
        subcategory: "Item"
    })
    calculateMasterStars = true;

    @SwitchProperty({
        name: "Calculate Dyes",
        description: "Include dyes in item value calculation.",
        category: "Calculation",
        subcategory: "Item"
    })
    calculateDyes = true;

    /*
    @SwitchProperty({
        name: "Add Item Value to Tooltip (WIP)",
        description: "Add Item Value to Tooltip (WIP)",
        category: "ToolTip",
        subcategory: "General"
    })
    itemValueTooltip = false;
    */

}

export default new Settings    