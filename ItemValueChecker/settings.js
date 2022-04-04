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

@Vigilant("ItemValueChecker")
class Settings {

    constructor() {
        this.initialize(this)
    }

    @SwitchProperty({
        name: "&6Update Messages (IN PROGRESS)",
        description: "Notify you when there is a new ItemValueChecker version available. (IN PROGRESS)",
        category: "General",
        subcategory: "Updates"
    })
    notifyUpdates = true;

    @SwitchProperty({
        name: "Add Item Value to Tooltip (IN PROGRESS)",
        description: "Add Item Value to Tooltip (IN PROGRESS)",
        category: "ToolTip",
        subcategory: "General"
    })
    itemValueTooltip = false;

}

export default new Settings    