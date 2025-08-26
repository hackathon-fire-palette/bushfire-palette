// Chart.js loader for bushfire-palette dashboard
// This file loads Chart.js from CDN if not already loaded
(function() {
  if (!window.Chart) {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
      window.ChartLoaded = true;
      document.dispatchEvent(new Event('ChartJSLoaded'));
    };
    document.head.appendChild(script);
  } else {
    window.ChartLoaded = true;
    document.dispatchEvent(new Event('ChartJSLoaded'));
  }
})();
