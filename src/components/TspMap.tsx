import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import { Navigation2, RotateCcw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLng } from 'leaflet';

const blueIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Point {
  lat: number;
  lng: number;
  order: number | null;
  address?: string;
  distanceToNext?: number;
}

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    const street = data.address.road || data.address.pedestrian || data.address.street || 'Rue inconnue';
    const city = data.address.city || data.address.town || data.address.village || data.address.municipality || 'Ville inconnue';
    
    return `${street}, ${city}`;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'adresse:", error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export default function TspMap() {
  const [points, setPoints] = useState<Point[]>([]);
  const [solved, setSolved] = useState(false);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<[number, number][]>([]);

  const handleMapClick = async (latlng: LatLng) => {
    if (solved || loading) return;
    
    setLoading(true);
    const address = await getAddressFromCoordinates(latlng.lat, latlng.lng);
    
    setPoints([...points, { 
      lat: latlng.lat, 
      lng: latlng.lng, 
      order: null,
      address 
    }]);
    setLoading(false);
  };

  const calculateDistance = (point1: Point, point2: Point): number => {
    return Math.sqrt(
      Math.pow(point1.lat - point2.lat, 2) + 
      Math.pow(point1.lng - point2.lng, 2)
    ) * 111.32;
  };

  const solveTSP = () => {
    const solution = [...points];
    let unvisited = [...points];
    let current = unvisited[0];
    let order = 0;
    let totalDist = 0;
    const pathCoordinates: [number, number][] = [[current.lat, current.lng]];
    
    solution[0].order = order++;
    unvisited.shift();

    while (unvisited.length > 0) {
      let minDist = Infinity;
      let nextIndex = -1;
      
      unvisited.forEach((point, index) => {
        const dist = calculateDistance(current, point);
        if (dist < minDist) {
          minDist = dist;
          nextIndex = index;
        }
      });

      current = unvisited[nextIndex];
      const currentIndex = points.indexOf(current);
      solution[currentIndex].order = order++;
      solution[currentIndex].distanceToNext = minDist;
      totalDist += minDist;
      pathCoordinates.push([current.lat, current.lng]);
      unvisited.splice(nextIndex, 1);
    }

    const distanceToStart = calculateDistance(current, solution[0]);
    totalDist += distanceToStart;
    solution[solution.length - 1].distanceToNext = distanceToStart;
    pathCoordinates.push([solution[0].lat, solution[0].lng]);

    setPoints(solution);
    setTotalDistance(totalDist);
    setPath(pathCoordinates);
    setSolved(true);
  };

  const resetPoints = () => {
    setPoints([]);
    setSolved(false);
    setTotalDistance(0);
  };

  return (
    <div className="h-full relative">
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <button
          onClick={solveTSP}
          disabled={points.length < 2 || solved || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 disabled:bg-gray-400 block w-full"
        >
          Résoudre
        </button>
        <button
          onClick={resetPoints}
          className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 flex items-center justify-center gap-2 w-full"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        {solved && (
          <div className="bg-white p-4 rounded shadow max-w-md">
            <h3 className="font-bold mb-2">Résultat :</h3>
            <p>Distance totale : {totalDistance.toFixed(2)} km</p>
            <p className="mt-2">Ordre de visite :</p>
            <ol className="list-decimal list-inside">
              {[...points]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((point, idx) => (
                  <li key={idx} className="truncate">
                    {point.address || 'Adresse inconnue'}
                    {point.distanceToNext && (
                      <span className="text-gray-500 ml-2">
                        → {point.distanceToNext.toFixed(2)} km
                      </span>
                    )}
                  </li>
              ))}
              <li className="truncate">
                {points[0]?.address || 'Adresse inconnue'} (Retour au départ)
              </li>
            </ol>
          </div>
        )}
      </div>
      
      <MapContainer
        center={[48.8566, 2.3522]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {points.map((point, idx) => (
          <Marker 
            key={idx} 
            position={[point.lat, point.lng]}
            icon={point.order === 0 ? redIcon : blueIcon}
          >
            <Popup>
              {point.address || 'Adresse inconnue'}
              <br />
              {point.order !== null ? `Étape ${point.order + 1}` : 'Non visité'}
            </Popup>
          </Marker>
        ))}
        {solved && (
          <Polyline
            positions={path}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}