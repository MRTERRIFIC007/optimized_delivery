import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useStore } from "../../store/useStore";
import { customerAddresses, customerAreas } from "../../utils/customerData";
import { Box, CircularProgress, Typography } from "@mui/material";

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

// Map of known areas in Ahmedabad to their approximate coordinates
const areaCoordinates: Record<string, [number, number]> = {
  Satellite: [23.0225, 72.5714],
  Bopal: [23.0343, 72.4721],
  Vastrapur: [23.046, 72.5292],
  Paldi: [23.0117, 72.5625],
  Thaltej: [23.0545, 72.5029],
  Navrangpura: [23.0365, 72.5611],
  Bodakdev: [23.0465, 72.5095],
  Gota: [23.0995, 72.5286],
  Maninagar: [22.9987, 72.6154],
  Chandkheda: [23.1209, 72.5769],
};

const MapComponent: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { optimizedRoute, pendingOrders } = useStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Extract area name from full address
  const extractAreaFromAddress = (address: string): string | null => {
    for (const area of Object.keys(areaCoordinates)) {
      if (address.includes(area)) {
        return area;
      }
    }
    return null;
  };

  // Geocode an address to get coordinates
  const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
    try {
      // Check if this is a known location first
      const extractedArea = extractAreaFromAddress(address);
      if (extractedArea && areaCoordinates[extractedArea]) {
        const [lat, lon] = areaCoordinates[extractedArea];
        // Add a small random offset to avoid all points in same place
        const randomLat = lat + (Math.random() * 0.005 - 0.0025);
        const randomLon = lon + (Math.random() * 0.005 - 0.0025);
        return {
          lat: randomLat,
          lon: randomLon,
          display_name: `${extractedArea}, Ahmedabad, Gujarat, India`,
        };
      }

      // If not a known area, try geocoding with the area name
      const searchArea = extractedArea || "Ahmedabad";
      const searchQuery = `${searchArea}, Ahmedabad, Gujarat, India`;

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "DeliveryPredictionSystem/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name,
        };
      } else {
        // Fallback to Ahmedabad city center coordinates with offset
        console.warn("No geocoding results, using fallback coordinates");
        return {
          lat: 23.0225 + (Math.random() * 0.05 - 0.025),
          lon: 72.5714 + (Math.random() * 0.05 - 0.025),
          display_name: "Ahmedabad, Gujarat, India",
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      // Always provide fallback coordinates instead of throwing
      return {
        lat: 23.0225 + (Math.random() * 0.05 - 0.025),
        lon: 72.5714 + (Math.random() * 0.05 - 0.025),
        display_name: "Ahmedabad, Gujarat, India (Fallback)",
      };
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map with a default center (Ahmedabad)
    mapRef.current = L.map(mapContainerRef.current, {
      center: [23.0225, 72.5714],
      zoom: 12,
      zoomControl: false,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);

    // Add zoom control to top right
    L.control.zoom({ position: "topright" }).addTo(mapRef.current);

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    const renderRoute = async () => {
      if (
        !mapRef.current ||
        !optimizedRoute ||
        !optimizedRoute.details ||
        optimizedRoute.details.length === 0
      )
        return;

      try {
        setLoading(true);
        setError(null);

        // Clear existing routes and markers
        mapRef.current.eachLayer((layer: L.Layer) => {
          if (layer instanceof L.Routing.Control || layer instanceof L.Marker) {
            mapRef.current?.removeLayer(layer);
          }
        });

        // Keep the base tile layer
        const baseTileLayer = mapRef.current.eachLayer((layer: L.Layer) => {
          if (layer instanceof L.TileLayer) {
            return layer;
          }
        });

        // Get coordinates for all addresses
        const addressCoords = new Map<string, L.LatLng>();

        // Start location
        const startLocation = await geocodeAddress(
          "Satellite, Ahmedabad, India"
        );
        addressCoords.set(
          "Start Location",
          L.latLng(startLocation.lat, startLocation.lon)
        );

        // Get coordinates for all destinations in the route
        for (const leg of optimizedRoute.details) {
          const fromAddress = leg.from_address;
          const toAddress = leg.to_address;

          if (!addressCoords.has(fromAddress)) {
            const fromCoords = await geocodeAddress(fromAddress);
            addressCoords.set(
              fromAddress,
              L.latLng(fromCoords.lat, fromCoords.lon)
            );
          }

          if (!addressCoords.has(toAddress)) {
            const toCoords = await geocodeAddress(toAddress);
            addressCoords.set(toAddress, L.latLng(toCoords.lat, toCoords.lon));
          }
        }

        // Create waypoints for the route
        const waypoints = optimizedRoute.details.map((leg) => {
          return (
            addressCoords.get(leg.from_address) || L.latLng(23.0225, 72.5714)
          );
        });

        // Add the final destination waypoint
        const lastLeg =
          optimizedRoute.details[optimizedRoute.details.length - 1];
        waypoints.push(
          addressCoords.get(lastLeg.to_address) || L.latLng(23.0225, 72.5714)
        );

        // Create routing control with real coordinates
        const routingControl = L.Routing.control({
          waypoints,
          routeWhileDragging: false,
          showAlternatives: false,
          fitSelectedRoutes: true,
          lineOptions: {
            styles: [{ color: "#0075ff", weight: 4 }],
          },
          createMarker: () => null, // Disable default markers
        }).addTo(mapRef.current);

        // Add custom markers for each stop with popups
        optimizedRoute.details.forEach((leg, index) => {
          const position =
            addressCoords.get(leg.from_address) || L.latLng(23.0225, 72.5714);

          const marker = L.marker(position, {
            icon: L.divIcon({
              className: "custom-marker",
              html: `<div style="background-color: #1976d2; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold;">${
                index + 1
              }</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
          }).addTo(mapRef.current!);

          // Add popup with delivery information
          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px;">${leg.from}</h3>
              <p style="margin: 0 0 5px 0; font-size: 12px;">${
                leg.from_address
              }</p>
              <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span>Distance: ${leg.distance}</span>
                <span>Time: ${leg.duration}</span>
              </div>
              <div style="margin-top: 4px; font-size: 12px; color: ${
                leg.traffic_conditions === "Heavy"
                  ? "red"
                  : leg.traffic_conditions === "Moderate"
                  ? "orange"
                  : "green"
              }">
                Traffic: ${leg.traffic_conditions}
              </div>
            </div>
          `;
          marker.bindPopup(popupContent);
        });

        // Add a marker for the final destination
        const lastPosition =
          addressCoords.get(lastLeg.to_address) || L.latLng(23.0225, 72.5714);
        const finalMarker = L.marker(lastPosition, {
          icon: L.divIcon({
            className: "custom-marker final",
            html: `<div style="background-color: #dc004e; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold;">${
              optimizedRoute.details.length + 1
            }</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(mapRef.current!);

        const finalPopupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${lastLeg.to}</h3>
            <p style="margin: 0 0 5px 0; font-size: 12px;">${lastLeg.to_address}</p>
            <div style="margin-top: 8px;">
              <div>Total Distance: ${optimizedRoute.total_distance}</div>
              <div>Total Duration: ${optimizedRoute.total_duration}</div>
            </div>
          </div>
        `;
        finalMarker.bindPopup(finalPopupContent);

        // Fit map to show all markers and route
        if (waypoints.length > 0) {
          const bounds = L.latLngBounds(waypoints);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error rendering route:", error);
        setError("Failed to render the route map. Please try again.");
        setLoading(false);
      }
    };

    renderRoute();
  }, [optimizedRoute]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Loading map and route...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
          minHeight: "400px",
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    />
  );
};

export default MapComponent;
