export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2VyZ2lva2FtZXRzIiwiYSI6ImNsZDRhOTdueDBxaWkzcW9nNzY3YndtMjQifQ.0rx9A1APna5MBBeCZ6n9Mg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sergiokamets/cld4b2134000d01o53vn6ays2',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 200,
      right: 200,
    },
  });
};
