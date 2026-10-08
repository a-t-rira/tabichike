if (!location.hash.startsWith("#/s/")) {
  const beacon = document.createElement("script");
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.defer = true;
  beacon.setAttribute("data-cf-beacon", JSON.stringify({ token: "365c5ca348c340818b755e40a71db3fb", spa: false }));
  document.head.append(beacon);
}
