import MapLoader from "./MapLoader";
import MapSelector from "./MapSelector";
import Markers from "./Markers";
import Config from "./Config.js";
import SubfloorToggle from "./SubfloorToggle";

//Load configuration
Config.loadConfiguration("config.json").then(() => {
	let map = null;
	const query = new URLSearchParams(window.location.search);
	const defaultMap = window.config.defaultMap;

	const mapId = query.has('map') ? query.get('map') : defaultMap;
	const hideSelector = query.has('no-selector');
	let showSubfloor = query.has('subfloor');

	function getMarkers()
	{
		return query.has('markers') ? Markers.parseMarkerList(query.get('markers')) : [];
	}

	function updateSearchParams(args) {
		const url = new URL(window.location);
		for (const [key, value] of Object.entries(args)) {
			if (value) {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		window.history.replaceState({}, '', url);
	}

	function onMapChangedHandler(selectedMap, map) {
		updateSearchParams({ map: selectedMap.id });
		map.addLayer(Markers.drawMarkerLayer(getMarkers()));
		handleSubfloorToggle(showSubfloor);
	}

	function handleSubfloorToggle(state) {
		showSubfloor = state;
		updateSearchParams({ subfloor: state });
		const subfloorLayer = map.getLayers().getArray().find(layer => layer.get('name') === 'subfloor');
		if (subfloorLayer) {
			subfloorLayer.setVisible(state);
		}
	}

	MapLoader.loadMap(mapId).then((loadedMap) => {
		map = loadedMap

		if (!hideSelector) map.addControl(new MapSelector({selected: {name: loadedMap.get('map-name'), id: mapId}, onMapChanged: onMapChangedHandler}));

		map.addControl(new SubfloorToggle({ onToggle: handleSubfloorToggle }));

		map.addLayer(Markers.drawMarkerLayer(getMarkers()));
		window.olmap = map;
	});
});