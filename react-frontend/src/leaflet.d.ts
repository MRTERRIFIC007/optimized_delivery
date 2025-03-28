declare module "leaflet" {
  import * as L from "leaflet";
  export = L;
}

// Also include declaration for leaflet-routing-machine
declare module "leaflet-routing-machine" {
  import * as L from "leaflet";

  namespace Routing {
    function control(options?: any): Control;

    interface Control extends L.Control {
      addTo(map: L.Map): this;
      getPlan(): any;
      getRouter(): any;
      getWaypoints(): L.LatLng[];
      setWaypoints(waypoints: L.LatLng[]): this;
      spliceWaypoints(
        index: number,
        waypointsToRemove: number,
        ...waypoints: L.LatLng[]
      ): L.LatLng[];
    }

    interface Options {
      waypoints?: L.LatLng[];
      router?: any;
      plan?: any;
      lineOptions?: L.PolylineOptions;
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      altLineOptions?: L.PolylineOptions;
      fitSelectedRoutes?: boolean | string;
      createMarker?(i: number, waypoint: any, n: number): L.Marker;
    }
  }

  export = Routing;
}
