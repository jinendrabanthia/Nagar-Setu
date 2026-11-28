"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useTheme } from "@/lib/theme";

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  detail?: string;
  layer: string;
  href?: string;
  timestamp?: string | null;
  severity?: string | null;
  status?: string | null;
  cameraCode?: string | null;
  confidence?: number | null;
}

export type TileProviderChoice = "auto" | "carto" | "osm";

export const LAYER_COLOURS: Record<string, string> = {
  historical_accident: "#A12936",
  confirmed_observation: "#246A49",
  pending_candidate: "#B46E18",
  camera: "#2E676A",
  asset: "#6D3C67",
  hotspot: "#6D3C67",
  event: "#8F2637",
};

interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string;
  providerLabel: string;
}

function resolveTileConfig(theme: "light" | "dark", choice: TileProviderChoice): TileConfig {
  const envUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL;
  const envAttr = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION;

  // Use custom licensed URL if explicitly overridden away from raw OSM default
  if (
    choice === "auto" &&
    envUrl &&
    !envUrl.includes("tile.openstreetmap.org")
  ) {
    return {
      url: envUrl,
      attribution: envAttr ?? "&copy; OpenStreetMap contributors",
      providerLabel: "Custom Tile Provider",
    };
  }

  if (choice === "osm") {
    return {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      providerLabel: "OpenStreetMap Standard",
    };
  }

  // Default & CARTO: Porcelain light_all & Graphite dark_all (no 403 block, matches themes)
  if (theme === "dark") {
    return {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      providerLabel: "CARTO Graphite",
    };
  }

  return {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    subdomains: "abcd",
    providerLabel: "CARTO Porcelain",
  };
}

function MapViewportController({
  points,
  zoomCommand,
  resetTick,
}: {
  points: MapPoint[];
  zoomCommand: { seq: number; delta: number };
  resetTick: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (zoomCommand.seq === 0) return;
    if (zoomCommand.delta > 0) map.zoomIn();
    else map.zoomOut();
  }, [map, zoomCommand]);

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 14, { animate: true });
      return;
    }
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [38, 38], maxZoom: 15 });
  }, [map, points, resetTick]);

  return null;
}

interface ClusteredItem {
  key: string;
  latitude: number;
  longitude: number;
  points: MapPoint[];
}

function clusterPoints(points: MapPoint[], enabled: boolean): ClusteredItem[] {
  if (!enabled || points.length <= 1) {
    return points.map((p) => ({
      key: `${p.layer}-${p.id}`,
      latitude: p.latitude,
      longitude: p.longitude,
      points: [p],
    }));
  }
  const buckets = new Map<string, MapPoint[]>();
  const precision = 0.0045; // ~450m grid bucket
  for (const point of points) {
    const latKey = Math.round(point.latitude / precision);
    const lngKey = Math.round(point.longitude / precision);
    const key = `${latKey}:${lngKey}`;
    const existing = buckets.get(key);
    if (existing) existing.push(point);
    else buckets.set(key, [point]);
  }
  return Array.from(buckets.entries()).map(([key, items]) => {
    const avgLat = items.reduce((s, p) => s + p.latitude, 0) / items.length;
    const avgLng = items.reduce((s, p) => s + p.longitude, 0) / items.length;
    return {
      key: `cluster-${key}`,
      latitude: avgLat,
      longitude: avgLng,
      points: items,
    };
  });
}

export default function MapInner({
  points,
  selectedPointId,
  onSelectPoint,
  clustering = false,
  providerChoice = "auto",
  zoomCommand = { seq: 0, delta: 0 },
  resetTick = 0,
  reloadNonce = 0,
  onTileStatusChange,
}: {
  points: MapPoint[];
  selectedPointId?: string | null;
  onSelectPoint?: (point: MapPoint | null) => void;
  clustering?: boolean;
  providerChoice?: TileProviderChoice;
  zoomCommand?: { seq: number; delta: number };
  resetTick?: number;
  reloadNonce?: number;
  onTileStatusChange?: (status: { loading: boolean; errorCount: number; provider: string }) => void;
}) {
  const { theme } = useTheme();
  const [tileErrors, setTileErrors] = useState(0);
  const [tilesLoading, setTilesLoading] = useState(true);

  const tileConfig = useMemo(
    () => resolveTileConfig(theme, providerChoice),
    [theme, providerChoice],
  );

  useEffect(() => {
    setTileErrors(0);
    setTilesLoading(true);
    onTileStatusChange?.({ loading: true, errorCount: 0, provider: tileConfig.providerLabel });
  }, [tileConfig, reloadNonce, onTileStatusChange]);

  const clusters = useMemo(() => clusterPoints(points, clustering), [points, clustering]);

  const center: [number, number] = points.length
    ? [points[0].latitude, points[0].longitude]
    : [28.6289, 77.2245];

  return (
    <MapContainer
      center={center}
      zoom={13}
      zoomControl={false}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        key={`${tileConfig.url}-${reloadNonce}`}
        url={tileConfig.url}
        attribution={tileConfig.attribution}
        subdomains={tileConfig.subdomains ?? "abc"}
        eventHandlers={{
          loading: () => {
            setTilesLoading(true);
            onTileStatusChange?.({
              loading: true,
              errorCount: tileErrors,
              provider: tileConfig.providerLabel,
            });
          },
          load: () => {
            setTilesLoading(false);
            onTileStatusChange?.({
              loading: false,
              errorCount: tileErrors,
              provider: tileConfig.providerLabel,
            });
          },
          tileerror: () => {
            setTileErrors((prev) => {
              const next = prev + 1;
              onTileStatusChange?.({
                loading: tilesLoading,
                errorCount: next,
                provider: tileConfig.providerLabel,
              });
              return next;
            });
          },
        }}
      />
      <MapViewportController points={points} zoomCommand={zoomCommand} resetTick={resetTick} />

      {clusters.map((item) => {
        if (item.points.length > 1) {
          return (
            <CircleMarker
              key={item.key}
              center={[item.latitude, item.longitude]}
              radius={15}
              pathOptions={{
                color: "var(--accent-primary)",
                fillColor: "var(--accent-primary)",
                fillOpacity: 0.78,
                weight: 2.5,
              }}
              eventHandlers={{
                click: () => onSelectPoint?.(item.points[0]),
              }}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">{item.points.length} clustered records</p>
                  <ul className="max-h-32 space-y-1 overflow-y-auto">
                    {item.points.map((pt) => (
                      <li key={`${pt.layer}-${pt.id}`}>
                        <button
                          type="button"
                          onClick={() => onSelectPoint?.(pt)}
                          className="text-left underline hover:opacity-80"
                        >
                          {pt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </Popup>
            </CircleMarker>
          );
        }

        const point = item.points[0];
        const isSelected = selectedPointId === point.id;
        const color = LAYER_COLOURS[point.layer] ?? "#8F2637";

        return (
          <CircleMarker
            key={`${point.layer}-${point.id}`}
            center={[point.latitude, point.longitude]}
            radius={isSelected ? 11 : 8}
            pathOptions={{
              color: isSelected ? "#FFFFFF" : color,
              fillColor: color,
              fillOpacity: isSelected ? 0.95 : 0.75,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelectPoint?.(point),
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong className="block font-semibold">{point.label}</strong>
                {point.detail ? (
                  <span className="mt-1 block opacity-80">{point.detail}</span>
                ) : null}
                <span className="mt-1 block text-[11px] opacity-65">
                  {point.layer.replace(/_/g, " ")} · {point.latitude.toFixed(4)},{" "}
                  {point.longitude.toFixed(4)}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
