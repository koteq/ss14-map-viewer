import { Map, View } from "ol";
import { getCenter } from "ol/extent";
import Projection from "ol/proj/Projection";
import ImageStatic from "ol/source/ImageStatic";
import Parallax from "./ParallaxLayer";
import Config from "./Config.js";
import TileLayer from "ol/layer/Tile";
import { XYZ } from "ol/source";
import TileGrid from "ol/tilegrid/TileGrid";

class MapLoader {
	static async loadMap(mapName) {
		return this.loadMapJson(mapName)
			.then((data) => this.createMap(data));
	}

	static async loadMapJson(name) {
		//maps/{1}/map.json
		const request = new Request(Config.format(window.config.mapDataUrl, name));
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error(`Failed to retrive map data! Status: ${response.status}`);
		}
		const data = await response.json();
		data.grids = data.grids.sort((a, b) => a.gridId > b.gridId );
		return data;
	}

	static async loadLayers(map, name) {
		return this.loadMapJson(name)
			.then(data => {
				const map0Extent = data.grids[0].extent;

				const projection = new Projection({
					code: 'map-image',
					units: 'pixels',
					extent: [map0Extent.x1, map0Extent.y1, map0Extent.x2, map0Extent.y2],
				});

				const view = new View({
					projection: projection,
					center: getCenter([map0Extent.x1, map0Extent.y1, map0Extent.x2, map0Extent.y2]),
					zoom: 1,
					resolutions: [4, 2, 1, 1 / 2, 1 / 4],
					constrainResolution: true,
				});

				map.setView(view);

				map.setLayers(this.createLayers(data, projection));
			});
	}

	static createMap(data) {
		const map0Extent = data.grids[0].extent;

		const projection = new Projection({
			code: 'map-image',
			units: 'pixels',
			extent: [map0Extent.x1, map0Extent.y1, map0Extent.x2, map0Extent.y2],
		});

		const layers = this.createLayers(data, projection);

		const map = new Map({
			layers: layers,
			target: 'map',
			maxTilesLoading: 20,
			view: new View({
				projection: projection,
				center: getCenter([map0Extent.x1, map0Extent.y1, map0Extent.x2, map0Extent.y2]),
				zoom: 1,
				resolutions: [4, 2, 1, 1 / 2, 1 / 4],
				constrainResolution: true,
			}),
		});

		map.on('singleclick', function (evt) {
			console.log(evt.coordinate);
		});

		map.set('map-name', data.name);

		return map;
	}

	/**
	 *
	 * @param {*} data
	 * @param {Projection} projection
	 * @returns
	 */
	static createLayers(data, projection) {

		const parallaxLayers = new Array();

		if (data.parallaxLayers != undefined) {
			for (const parallaxData of data.parallaxLayers) {

				let extent = parallaxData.source.extent;

				const source = new ImageStatic({
					url: parallaxData.source.url,
					imageExtent: [extent.x1, extent.y1, extent.x2, extent.y2],
					interpolate: false,
					projection: projection
				});

				const parallax = new Parallax([parallaxData.scale.x, parallaxData.scale.y], [parallaxData.offset.x, parallaxData.offset.y], {
					simple: parallaxData.static,
					//extent: data.extent,
					minScale: 1,
					layers: parallaxData.layers,
					source: source
				});

				parallax.on('prerender', function (evt) {
					if (evt.frameState.viewState.zoom < 2) {
						evt.context.imageSmoothingEnabled = true;
						evt.context.webkitImageSmoothingEnabled = true;
						evt.context.mozImageSmoothingEnabled = true;
						evt.context.msImageSmoothingEnabled = true;
						evt.context.imageSmoothingQuality = "high";
					} else {
						evt.context.imageSmoothingEnabled = false;
						evt.context.webkitImageSmoothingEnabled = false;
						evt.context.mozImageSmoothingEnabled = false;
						evt.context.msImageSmoothingEnabled = false;
					}
				});

				parallaxLayers.push(parallax);
			}
		}


		const baseGridOffset = data.grids[0].offset;
		const baseGridExtent = data.grids[0].extent;

		const gridLayers = new Array();

		let i = 0;
		for(const gridLayer of data.grids)
		{
			let mapLayer;
			var extent = gridLayer.extent;

			if (i > 0)
			{
				extent.x1 -= /*4.12 **/ gridLayer.offset.x - extent.x2;
				extent.y1 += baseGridExtent.y2 - baseGridOffset.y - 4.5 * gridLayer.offset.y;
				extent.x2 -= /*4.12 **/ gridLayer.offset.x - extent.x2;
				extent.y2 += baseGridExtent.y2 - baseGridOffset.y - 4.5 * gridLayer.offset.y;
				//console.log(extent);
			}

			/*const projection = new Projection({
				code: 'grid-image-' + i,
				units: 'pixels',
				extent: [extent.X1, extent.Y1, extent.X2, extent.Y2],
			});*/

			//console.log(gridLayer.url);

			mapLayer = new TileLayer({
				extent: [extent.x1, extent.y1, extent.x2, extent.y2],
				updateWhileInteracting: true,
				updateWhileAnimating: true,
				source: new XYZ({
					attributions: data.attributions,
					url: `maps/${gridLayer.url.replace(".png", "")}-tiles/{z}/{y}/{x}.png`,
					size: [extent.x2, extent.y2],
					tileGrid: new TileGrid({
					extent: [extent.x1, extent.y1, extent.x2, extent.y2],
						maxZoom: 0,
						resolutions: [1],
						tileSize: [256, 256],
					}),
					interpolate: false,
					projection: projection,
					wrapX: false
				})
			});

			// Add the subfloor layer
			const subfloorLayer =  new TileLayer({
				name: 'subfloor',
				visible: false,
				extent: [extent.x1, extent.y1, extent.x2, extent.y2],
				updateWhileInteracting: true,
				updateWhileAnimating: true,
				source: new XYZ({
					attributions: data.attributions,
					url: `maps/${gridLayer.subfloorUrl.replace(".png", "")}-tiles/{z}/{y}/{x}.png`,
					size: [extent.x2, extent.y2],
					tileGrid: new TileGrid({
						extent: [extent.x1, extent.y1, extent.x2, extent.y2],
						maxZoom: 0,
						resolutions: [1],
						tileSize: [256, 256],
					}),
					interpolate: false,
					projection: projection,
					wrapX: false
				})
			});

			function updateSmoothing(evt) {
				if (evt.frameState.viewState.zoom < 2) {
					evt.context.imageSmoothingEnabled = true;
					evt.context.webkitImageSmoothingEnabled = true;
					evt.context.mozImageSmoothingEnabled = true;
					evt.context.msImageSmoothingEnabled = true;
					evt.context.imageSmoothingQuality = "high";
				} else {
					evt.context.imageSmoothingEnabled = false;
					evt.context.webkitImageSmoothingEnabled = false;
					evt.context.mozImageSmoothingEnabled = false;
					evt.context.msImageSmoothingEnabled = false;
				}
			};
			mapLayer.on('prerender', updateSmoothing);
			subfloorLayer.on('prerender', updateSmoothing);

			gridLayers.push(mapLayer);
			gridLayers.push(subfloorLayer);
			i++;
		}
		return [...parallaxLayers, ...gridLayers];
	}
}

export default MapLoader;
