import { useMemo, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import points from './data/points.json';
import VideoModal from './VideoModal.jsx';
import './App.css';

const INITIAL_VIEW_STATE = {
  longitude: 30.65,
  latitude: 46.30,
  zoom: 9,
  pitch: 0,
  bearing: 0,
};

const TARGET_COLORS = {
  'Гербера': [255, 140, 0],
  'Шахед': [220, 20, 60],
  'Орлан': [60, 130, 255],
};
const DEFAULT_COLOR = [150, 150, 150];

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function App() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  const layer = useMemo(() => new ScatterplotLayer({
    id: 'shootdowns',
    data: points,
    pickable: true,
    stroked: true,
    filled: true,
    radiusUnits: 'pixels',
    getPosition: d => [d.lon, d.lat],
    getRadius: 10,
    getFillColor: d => TARGET_COLORS[d.targetType] ?? DEFAULT_COLOR,
    getLineColor: d => d.hasCoords ? [255, 255, 255] : [255, 255, 255, 140],
    getLineWidth: 2,
    lineWidthUnits: 'pixels',
    onClick: info => setSelected(info.object ?? null),
    onHover: info => setHovered(info.object ?? null),
    updateTriggers: {},
  }), []);

  return (
    <div className="app">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[layer]}
        getCursor={({ isHovering }) => isHovering ? 'pointer' : 'grab'}
      >
        <Map mapStyle={MAP_STYLE} reuseMaps attributionControl={false} />
      </DeckGL>

      <div className="header">
        <div className="title">Карта збиттів літаками-перехоплювачами Технотарас</div>
        <div className="subtitle">Чорноморськ та околиці · {points.length} подій</div>
      </div>

      <div className="legend">
        <div className="legend-title">Тип цілі</div>
        <Swatch color="255,140,0" label="Гербера" />
        <Swatch color="220,20,60" label="Шахед" />
        <Swatch color="60,130,255" label="Орлан" />
      </div>

      {hovered && !selected && (
        <div className="hover-hint">
          #{hovered.id}{hovered.targetType ? ` · ${hovered.targetType}` : ''}{!hovered.hasCoords ? ' · ~приблизно' : ''}
        </div>
      )}

      {selected && <VideoModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Swatch({ color, label }) {
  return (
    <div className="swatch-row">
      <span className="swatch" style={{ background: `rgb(${color})` }} />
      {label}
    </div>
  );
}
