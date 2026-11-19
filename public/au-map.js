
(function () {
  let map = null;
  let markers = [];

  const MAX_ATTEMPTS = 5;

  window.AuAssetExplorer = {
    init: function (options) {
      let initAttempts = 0;

      const { containerId } = options;

      function tryInit() {
        const mapContainer = document.getElementById(containerId);

        if (
          !mapContainer ||
          mapContainer.offsetWidth === 0 ||
          mapContainer.offsetHeight === 0
        ) {
          if (initAttempts < MAX_ATTEMPTS) {
            initAttempts++;
            setTimeout(tryInit, 200);
          }
          return;
        }

        if (typeof L === "undefined") {
          if (initAttempts < MAX_ATTEMPTS) {
            initAttempts++;
            setTimeout(tryInit, 200);
          }
          return;
        }

        initMap(options);
      }

      tryInit();
    }
  };

  async function initMap(options) {
    const {
      containerId,
      apiBaseUrl = "",
      bubbleCallback,
      tabsContainerId
    } = options;

    const mapContainer = document.getElementById(containerId);

    try {
      // Fetch map data from the API
      const apiUrl = `${apiBaseUrl}/api/au-map`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const { regions, properties } = data;

      // Initialize map
      const isMobile = window.innerWidth <= 600;

      map = L.map(containerId, {
        preferCanvas: true,
        renderer: L.canvas()
      }).setView(
        isMobile ? [-37, 133] : [-30, 135],
        isMobile ? 3.2 : 4
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19
      }).addTo(map);

      // Display property markers
      function showProperties(props) {
        markers.forEach((marker) => {
          map.removeLayer(marker);
        });

        markers = [];

        props.forEach((property) => {
          const marker = L.marker(property.coords).addTo(map);

          marker.bindTooltip(
            `<strong>${property.name || ""}</strong><br>${property.address || ""}`
          );

          marker.on("click", function () {
            window.location.href =
              "https://gpt.spotinspect.tech/version-228o4/?v=property&property=" +
              encodeURIComponent(property.id);
          });

          markers.push(marker);
        });
      }

      // Bubble callback and iframe communication
      function sendMessage(state) {
        if (
          bubbleCallback &&
          typeof window[bubbleCallback] === "function"
        ) {
          window[bubbleCallback](state);
        }

        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "mapsClick",
              message: state
            },
            "*"
          );
        }
      }

      // Create state tabs
      const tabsDiv = document.getElementById(tabsContainerId);

      if (tabsDiv) {
        tabsDiv.innerHTML = "";

        // All properties tab
        const allTab = document.createElement("div");
        allTab.className = "state-tab active";
        allTab.textContent = "All";

        allTab.onclick = function () {
          document.querySelectorAll(".state-tab").forEach((tab) => {
            tab.classList.remove("active");
          });

          allTab.classList.add("active");

          map.setView([-30, 135], 4);
          showProperties(properties);
          sendMessage("All");
        };

        tabsDiv.appendChild(allTab);

        // Individual state tabs
        Object.keys(regions).forEach(function (state) {
          const tab = document.createElement("div");
          tab.className = "state-tab";
          tab.textContent = state;

          tab.onclick = function () {
            document.querySelectorAll(".state-tab").forEach((item) => {
              item.classList.remove("active");
            });

            tab.classList.add("active");

            map.setView(regions[state], 7);

            showProperties(
              properties.filter((property) => property.state === state)
            );

            sendMessage(state);
          };

          tabsDiv.appendChild(tab);
        });
      }

      // Show all properties initially
      showProperties(properties);

      // Fix map sizing
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      // Hide loading indicator
      const loading = document.getElementById("map-loading");

      if (loading) {
        loading.style.display = "none";
      }

    } catch (error) {
      console.error("Map initialization failed:", error);

      if (mapContainer) {
        mapContainer.innerHTML =
          "Error loading map data. Please try again later.";
      }
    }
  }
})();
