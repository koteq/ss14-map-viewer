import Control from 'ol/control/Control';

class SubfloorToggle extends Control {
    static template = `
        <div id="subfloor-toggle" class="ol-unselectable ol-control">
            <input type="checkbox" id="subfloor-toggle-checkbox" />
            <label for="subfloor-toggle-checkbox">Show Subfloor</label>
        </div>
    `;

    /**
     * Constructor for the SubfloorToggle control.
     * @param {Object} options Options for the control.
     */
    constructor(options = {}) {
        // Create the control element from the template
        const element = document.createRange().createContextualFragment(SubfloorToggle.template).getElementById('subfloor-toggle');

        // Call the parent constructor
        super({
            element: element,
            target: options.target,
        });

        // Store references to the checkbox
        this.checkbox = element.querySelector('#subfloor-toggle-checkbox');

        // Add event listener for the checkbox
        this.checkbox.addEventListener('change', () => {
            if (options.onToggle) {
                options.onToggle(this.checkbox.checked);
            }
        });
    }

    /**
     * Set the map instance the control is associated with.
     * @param {import("ol/Map").default} map The map instance.
     */
    setMap(map) {
        super.setMap(map);
        // Additional setup when the control is added to the map
    }

    /**
     * Get the current state of the checkbox.
     * @returns {boolean} True if the checkbox is checked, false otherwise.
     */
    getState() {
        return this.checkbox.checked;
    }

    /**
     * Set the state of the checkbox.
     * @param {boolean} state True to check the checkbox, false to uncheck it.
     */
    setState(state) {
        this.checkbox.checked = state;
    }
}

export default SubfloorToggle;