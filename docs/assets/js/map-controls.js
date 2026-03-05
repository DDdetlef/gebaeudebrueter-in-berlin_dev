(function(){
      try { window.__MS_CONTROLS_READY = true; } catch(e) {}
      var SPECIES_COLORS_JS = {"Mauersegler": "#1f78b4", "Sperling": "#33a02c", "Schwalbe": "#6a3d9a", "Fledermaus": "#000000", "Star": "#b15928", "Andere": "#ff7f00"};
      var STATUS_INFO_JS = {"verloren": {"label": "verlorene Niststätte", "color": "#616161", "short": "×"}, "sanierung": {"label": "Sanierung", "color": "#e31a1c", "short": "S"}, "ersatz": {"label": "Ersatzmaßn.", "color": "#00897b", "short": "E"}, "kontrolle": {"label": "Kontrolle", "color": "#1976d2", "short": "K"}, "none": {"label": "Ohne Status", "color": "#9e9e9e", "short": "—"}};
      var ALL_SPECIES = Object.keys(SPECIES_COLORS_JS);
      var ALL_STATUS = Object.keys(STATUS_INFO_JS);
      var MOBILE_MAX_WIDTH = 768;
      var FEEDBACK_MAILTO = 'mailto:detlefdev@gmail.com?subject=Feedback%20zur%20Karte';
      var CONTACT_MAILTO = 'mailto:detlefdev@gmail.com?subject=Kontakt%20zur%20Karte';
      var CONTACT_UNAVAILABLE_TEXT = 'Kontaktangaben werden in Kürze verfügbar sein.';
      var ABOUT_APP_TEXT = 'Die NABU Gebäudebrüter Berlin – KartenApp (v.2.0) zeigt Nist‑ und Brutstandorte aus der Online‑Datenbank der NABU-Bezirksgruppe Steglitz-Zehlendorf und macht Gebäudebrüter in ganz Berlin sichtbar.\nEntwickelt wurde die App von Andreas Richter für die NABU‑Bezirksgruppe Steglitz‑Zehlendorf, mit Dank an die engagierten Team‑Mitglieder des Projekts Artenschutz am Gebäude.';
      var NABU_LOGO_LINK = 'https://berlin.nabu.de/wir-ueber-uns/bezirksgruppen/steglitz-zehlendorf/index.html';
      var LEGAL_COMBINED_URL = 'https://berlin.nabu.de/impressum/02133.html';
      var SUBMIT_FORM_URL = 'https://berlin.nabu.de/wir-ueber-uns/bezirksgruppen/steglitz-zehlendorf/projekte/gebaeudebrueter/12400.html';
      var BASEMAP_DEFAULT_ID = 'positron';
      var BASEMAP_QUERY_KEY = 'basemap';
      var BASEMAP_STORAGE_KEY = 'ms-basemap';
      var TOPPLUSOPEN_TIMEOUT_MS = 15000;
      var TOPPLUSOPEN_MAX_TILE_ERRORS = 8;
      var TOPPLUSOPEN_MAX_ZOOM = 18;
      var TOPPLUSOPEN_CAPABILITIES_URL = 'https://sgx.geodatenzentrum.de/wmts_topplus_open/1.0.0/WMTSCapabilities.xml';
      var TOPPLUSOPEN_DATA_YEAR_LOCK = '2024';
      var TOPPLUSOPEN_DATA_YEAR_FALLBACK = TOPPLUSOPEN_DATA_YEAR_LOCK;
      var TOPPLUSOPEN_DATA_YEAR = String(window.__TOPPLUSOPEN_DATA_YEAR__ || window.__BKG_TOPPLUSOPEN_DATA_YEAR__ || window.__TOPPLUSOPEN_LAST_DATA_YEAR__ || document.documentElement.getAttribute('data-topplusopen-year') || '').trim() || TOPPLUSOPEN_DATA_YEAR_LOCK;
      var BKG_DATENQUELLEN_URL = 'https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_topplusopen.html';
      var DL_DE_BY_20_URL = 'https://www.govdata.de/dl-de/by-2-0';
      var POSITRON_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';
      var TOPPLUSOPEN_ATTRIBUTION = '';
      var BASEMAP_ATTRIBUTION_REGISTRY = {
        positron: POSITRON_ATTRIBUTION,
        topplusopen: ''
      };
      var BASEMAP_STATE = {
        activeId: BASEMAP_DEFAULT_ID,
        activeLayer: null,
        initialLayer: null,
        mapDefaultMaxZoom: null,
        activeAttribution: '',
        attributionPrepared: false,
        topplusYearFetchPromise: null,
        monitorLayer: null,
        monitorLoadHandler: null,
        monitorErrorHandler: null,
        timeoutId: null,
        topplusHasSuccessfulLoad: false,
        tileErrorCount: 0
      };
      // Cluster-aware filtering support (always AND across groups)
      var MS = { map:null, cluster:null, markers:[], ready:false, userMarker:null, userAccuracyCircle:null, locationBound:false, locationToastTimer:null, locateControl:null, popupVisible:false, visibleMarkerCount:null };
      applyTopPlusOpenAttributionYear(TOPPLUSOPEN_DATA_YEAR);
      var MS_MOBILE_MEDIA = (window.matchMedia ? window.matchMedia('(max-width: ' + MOBILE_MAX_WIDTH + 'px)') : null);
      function isMobileView(){
        if(MS_MOBILE_MEDIA){ return !!MS_MOBILE_MEDIA.matches; }
        return !!(window.innerWidth && window.innerWidth <= MOBILE_MAX_WIDTH);
      }
      var isMobile = isMobileView();
      try{ window.isMobile = isMobile; }catch(e){}
      function syncViewportCssVars(){
        var vh = window.innerHeight || document.documentElement.clientHeight || 0;
        if(vh > 0){
          document.documentElement.style.setProperty('--ms-vh', (vh * 0.01) + 'px');
        }
        var safeBottom = 0;
        try{ safeBottom = window.visualViewport ? Math.max(0, (window.innerHeight || 0) - window.visualViewport.height) : 0; }catch(e){ safeBottom = 0; }
        document.documentElement.style.setProperty('--ms-safe-bottom-extra', Math.round(safeBottom) + 'px');
      }
      function isCompactViewport(){
        return isMobileView();
      }
      function getControlElement(){
        return document.getElementById('ms-control');
      }
      function isModalOpenById(id){
        var modal = document.getElementById(id);
        return !!(modal && !modal.classList.contains('ms-hidden'));
      }
      function mergeRelTokens(currentRel, requiredTokens){
        var merged = Object.create(null);
        String(currentRel || '').split(/\s+/).forEach(function(token){
          var normalized = String(token || '').trim().toLowerCase();
          if(normalized){ merged[normalized] = true; }
        });
        (requiredTokens || []).forEach(function(token){
          var normalized = String(token || '').trim().toLowerCase();
          if(normalized){ merged[normalized] = true; }
        });
        return Object.keys(merged).join(' ');
      }
      function hardenAnchorNewTab(anchor){
        if(!anchor || !anchor.setAttribute){ return; }
        try{ anchor.setAttribute('target', '_blank'); }catch(e){}
        var relValue = '';
        try{ relValue = anchor.getAttribute('rel') || ''; }catch(e){ relValue = ''; }
        try{ anchor.setAttribute('rel', mergeRelTokens(relValue, ['noopener', 'noreferrer'])); }catch(e){}
      }
      function openUrlInNewTabSecure(url){
        var href = String(url || '').trim();
        if(!href){ return false; }
        try{
          var tempLink = document.createElement('a');
          tempLink.href = href;
          hardenAnchorNewTab(tempLink);
          tempLink.style.position = 'absolute';
          tempLink.style.left = '-9999px';
          if(document.body){
            document.body.appendChild(tempLink);
            tempLink.click();
            if(tempLink.parentNode){ tempLink.parentNode.removeChild(tempLink); }
            return true;
          }
        }catch(e){}
        try{ return !!window.open(href, '_blank', 'noopener,noreferrer'); }catch(err){}
        return false;
      }
      function ensureSubmitCtaSecurity(){
        var submitCta = document.getElementById('ms-submit-continue');
        if(!submitCta){ return null; }
        hardenAnchorNewTab(submitCta);
        return submitCta;
      }
      function getSubmitFormUrl(){
        var submitCta = document.getElementById('ms-submit-continue');
        var href = '';
        try{ href = submitCta ? (submitCta.getAttribute('href') || submitCta.href || '') : ''; }catch(e){ href = ''; }
        return href || SUBMIT_FORM_URL;
      }
      function openSubmitModalOrFallback(){
        if(isMobileView()){
          closeMobileTransientOverlays({ keepSubmitModal: true, forceShowControl: true });
        }
        var submitModal = document.getElementById('ms-submit-modal');
        var submitCta = ensureSubmitCtaSecurity();
        if(submitModal){
          submitModal.classList.remove('ms-hidden');
          submitModal.setAttribute('aria-hidden', 'false');
          syncHeaderLayeringOverModals();
          syncMobileControlVisibility();
          if(submitCta){ setTimeout(function(){ try{ submitCta.focus(); }catch(e){} }, 0); }
          return true;
        }
        return openUrlInNewTabSecure(getSubmitFormUrl());
      }
      function closeAnyOpenMarkerOverlay(){
        try{ if(MS.map && typeof MS.map.closePopup === 'function'){ MS.map.closePopup(); } }catch(e){}
        try{ closeMarkerDetailsModal(); }catch(err){}
        MS.popupVisible = false;
        syncMobileControlVisibility(true);
      }
      function isDatabaseLinkHref(href){
        var rawHref = String(href || '').trim();
        if(!rawHref){ return false; }
        if(/gebaeudebrueter-in-berlin\.de/i.test(rawHref)){ return true; }
        try{
          var parsed = new URL(rawHref, window.location.href);
          return /(^|\.)gebaeudebrueter-in-berlin\.de$/i.test(parsed.hostname || '');
        }catch(e){ return false; }
      }
      function hardenDatabaseLinksInScope(scope){
        if(!scope || !scope.querySelectorAll){ return; }
        var links = scope.querySelectorAll('a[href]');
        if(!links || !links.length){ return; }
        links.forEach(function(link){
          var href = '';
          try{ href = link.getAttribute('href') || link.href || ''; }catch(e){ href = ''; }
          if(isDatabaseLinkHref(href)){ hardenAnchorNewTab(link); }
        });
      }
      function hasVisibleMapPopup(){
        if(MS && typeof MS.popupVisible === 'boolean'){ return MS.popupVisible; }
        return !!document.querySelector('.leaflet-popup-pane .leaflet-popup');
      }
      function syncHeaderLayeringOverModals(){
        var header = document.getElementById('ms-app-header');
        if(!header){ return; }
        header.style.removeProperty('z-index');
      }
      function syncMobileControlVisibility(forceShow){
        var ctrl = getControlElement();
        if(!ctrl){ return; }
        if(!isCompactViewport()){ ctrl.classList.remove('ms-overlay-hidden'); return; }
        if(forceShow === true){ ctrl.classList.remove('ms-overlay-hidden'); return; }
        var shouldHide = isModalOpenById('ms-info-modal') || isModalOpenById('ms-submit-modal') || isModalOpenById('ms-basemap-modal') || hasVisibleMapPopup();
        ctrl.classList.toggle('ms-overlay-hidden', shouldHide);
      }
      function hideModalById(id){
        var modal = document.getElementById(id);
        if(!modal){ return; }
        modal.classList.add('ms-hidden');
        modal.setAttribute('aria-hidden', 'true');
      }
      function closeSideSheetDom(){
        var sideSheet = document.getElementById('ms-side-sheet');
        var sideBackdrop = document.getElementById('ms-side-backdrop');
        var navToggle = document.getElementById('ms-nav-toggle');
        if(sideSheet){
          sideSheet.classList.remove('is-open');
          sideSheet.setAttribute('aria-hidden', 'true');
          sideSheet.setAttribute('aria-modal', 'false');
        }
        if(sideBackdrop){
          sideBackdrop.classList.remove('is-open');
          sideBackdrop.setAttribute('hidden', 'hidden');
        }
        if(navToggle){
          navToggle.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Menü öffnen');
        }
        try{ document.body.classList.remove('ms-side-open'); }catch(e){}
      }
      function closeBottomSheetDom(){
        var sheet = document.getElementById('ms-bottom-sheet');
        if(!sheet){ return; }
        sheet.classList.remove('open');
        sheet.classList.remove('ms-sheet-dragging');
        sheet.setAttribute('aria-hidden', 'true');
        sheet.style.removeProperty('transition');
        sheet.style.removeProperty('will-change');
        sheet.style.removeProperty('transform');
        var fabStack = document.getElementById('ms-fab-stack');
        if(fabStack){
          fabStack.classList.remove('is-hidden');
          fabStack.setAttribute('aria-hidden', 'false');
        }
      }
      function closeGbModalOverlay(){
        var overlay = document.getElementById('gbModalOverlay');
        if(!overlay || !overlay.classList.contains('gb-open')){ return; }
        try{
          if(typeof window.gbModalClose === 'function'){
            window.gbModalClose();
            return;
          }
        }catch(e){}
        overlay.classList.remove('gb-open');
      }
      function closeMobileTransientOverlays(options){
        var opts = options || {};
        if(!isMobileView()){ return; }
        if(!opts.keepMarkerOverlay){ closeAnyOpenMarkerOverlay(); }
        if(!opts.keepInfoModal){ hideModalById('ms-info-modal'); }
        if(!opts.keepSubmitModal){ hideModalById('ms-submit-modal'); }
        if(!opts.keepBasemapModal){ hideModalById('ms-basemap-modal'); }
        if(!opts.keepPlaceholderModal){ hideModalById('ms-placeholder-modal'); }
        if(!opts.keepBottomSheet){ closeBottomSheetDom(); }
        if(!opts.keepSideSheet){ closeSideSheetDom(); }
        if(!opts.keepGbOverlay){ closeGbModalOverlay(); }
        syncHeaderLayeringOverModals();
        syncMobileControlVisibility(opts.forceShowControl === true);
      }
      function normalizeTopPlusOpenYear(value){
        var raw = String(value || '').trim();
        if(!raw){ return ''; }
        var match = raw.match(/\b(19|20)\d{2}\b/);
        return match ? match[0] : '';
      }
      function buildTopPlusOpenAttribution(yearValue){
        var year = normalizeTopPlusOpenYear(yearValue) || TOPPLUSOPEN_DATA_YEAR_FALLBACK;
        return 'Kartendarstellung: &copy; BKG (' + year + ') · <a href="' + DL_DE_BY_20_URL + '" target="_blank" rel="noopener noreferrer">dl-de/by-2-0</a> · <a href="' + BKG_DATENQUELLEN_URL + '" target="_blank" rel="noopener noreferrer">Datenquellen</a>';
      }
      function applyTopPlusOpenAttributionYear(yearValue){
        var normalizedYear = normalizeTopPlusOpenYear(yearValue) || TOPPLUSOPEN_DATA_YEAR_FALLBACK;
        TOPPLUSOPEN_DATA_YEAR = normalizedYear;
        TOPPLUSOPEN_ATTRIBUTION = buildTopPlusOpenAttribution(normalizedYear);
        BASEMAP_ATTRIBUTION_REGISTRY.topplusopen = TOPPLUSOPEN_ATTRIBUTION;
      }
      function extractTopPlusOpenYearFromText(content){
        var text = String(content || '');
        if(!text){ return ''; }
        var matchProduktstandDate = text.match(/Produktstand\s*:\s*((?:19|20)\d{2})[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])/i);
        if(matchProduktstandDate && matchProduktstandDate[1]){ return matchProduktstandDate[1]; }
        var matchProduktstandYear = text.match(/Produktstand\s*:\s*((?:19|20)\d{2})/i);
        if(matchProduktstandYear && matchProduktstandYear[1]){
          var produktstandYear = normalizeTopPlusOpenYear(matchProduktstandYear[1]);
          if(produktstandYear){ return produktstandYear; }
        }
        var matchRevisionDate = text.match(/((?:19|20)\d{2})[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])[\s\S]{0,180}?codeListValue="revision"|codeListValue="revision"[\s\S]{0,180}?((?:19|20)\d{2})[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])/i);
        if(matchRevisionDate){
          var revisionYear = normalizeTopPlusOpenYear(matchRevisionDate[1] || matchRevisionDate[2]);
          if(revisionYear){ return revisionYear; }
        }
        var matchDirect = text.match(/Kartendarstellung[^\n]{0,220}BKG\s*\(([^)]+)\)/i);
        if(matchDirect && matchDirect[1]){
          var directYear = normalizeTopPlusOpenYear(matchDirect[1]);
          if(directYear){ return directYear; }
        }
        var matchBkg = text.match(/BKG\s*\(([^)]+)\)/i);
        if(matchBkg && matchBkg[1]){
          var bkgYear = normalizeTopPlusOpenYear(matchBkg[1]);
          if(bkgYear){ return bkgYear; }
        }
        return '';
      }
      function fetchTextForTopPlusOpenYear(url, timeoutMs){
        if(!url || typeof fetch !== 'function'){ return Promise.resolve(''); }
        return new Promise(function(resolve){
          var done = false;
          function finish(value){
            if(done){ return; }
            done = true;
            resolve(String(value || ''));
          }
          var timer = setTimeout(function(){ finish(''); }, timeoutMs);
          fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store' }).then(function(response){
            if(!response || !response.ok){
              clearTimeout(timer);
              finish('');
              return;
            }
            response.text().then(function(body){
              clearTimeout(timer);
              finish(body);
            }).catch(function(){
              clearTimeout(timer);
              finish('');
            });
          }).catch(function(){
            clearTimeout(timer);
            finish('');
          });
        });
      }
      function ensureTopPlusOpenDataYear(){
        var configuredSources = [
          window.__TOPPLUSOPEN_DATA_YEAR__,
          window.__BKG_TOPPLUSOPEN_DATA_YEAR__,
          window.__TOPPLUSOPEN_LAST_DATA_YEAR__,
          document.documentElement.getAttribute('data-topplusopen-year')
        ];
        for(var i = 0; i < configuredSources.length; i += 1){
          var configuredYear = normalizeTopPlusOpenYear(configuredSources[i]);
          if(configuredYear){
            applyTopPlusOpenAttributionYear(configuredYear);
            return Promise.resolve(configuredYear);
          }
        }
        var knownYear = normalizeTopPlusOpenYear(TOPPLUSOPEN_DATA_YEAR);
        if(knownYear){
          applyTopPlusOpenAttributionYear(knownYear);
          return Promise.resolve(knownYear);
        }
        if(BASEMAP_STATE.topplusYearFetchPromise){ return BASEMAP_STATE.topplusYearFetchPromise; }
        BASEMAP_STATE.topplusYearFetchPromise = fetchTextForTopPlusOpenYear(TOPPLUSOPEN_CAPABILITIES_URL, 9000).then(function(capabilitiesText){
          var yearFromCapabilities = extractTopPlusOpenYearFromText(capabilitiesText);
          if(yearFromCapabilities){
            applyTopPlusOpenAttributionYear(yearFromCapabilities);
            return yearFromCapabilities;
          }
          return fetchTextForTopPlusOpenYear(BKG_DATENQUELLEN_URL, 9000).then(function(sourcesText){
            var yearFromSources = extractTopPlusOpenYearFromText(sourcesText);
            if(yearFromSources){
              applyTopPlusOpenAttributionYear(yearFromSources);
              return yearFromSources;
            }
            applyTopPlusOpenAttributionYear(TOPPLUSOPEN_DATA_YEAR_FALLBACK);
            return TOPPLUSOPEN_DATA_YEAR;
          });
        }).then(function(resultYear){
          BASEMAP_STATE.topplusYearFetchPromise = null;
          return resultYear;
        }, function(){
          BASEMAP_STATE.topplusYearFetchPromise = null;
          applyTopPlusOpenAttributionYear(TOPPLUSOPEN_DATA_YEAR_FALLBACK);
          return TOPPLUSOPEN_DATA_YEAR;
        });
        return BASEMAP_STATE.topplusYearFetchPromise;
      }
      function normalizeBasemapId(value){
        var id = String(value || '').trim().toLowerCase();
        return (id === 'positron' || id === 'topplusopen') ? id : '';
      }
      function readBasemapFromUrl(){
        try{
          var params = new URLSearchParams(window.location.search || '');
          return normalizeBasemapId(params.get(BASEMAP_QUERY_KEY));
        }catch(e){ return ''; }
      }
      function readBasemapFromStorage(){
        try{ return normalizeBasemapId(window.localStorage.getItem(BASEMAP_STORAGE_KEY)); }catch(e){ return ''; }
      }
      function persistBasemapToStorage(id){
        try{ window.localStorage.setItem(BASEMAP_STORAGE_KEY, id); }catch(e){}
      }
      function updateBasemapUrlParam(id){
        var normalized = normalizeBasemapId(id);
        if(!normalized){ return; }
        try{
          var url = new URL(window.location.href);
          url.searchParams.set(BASEMAP_QUERY_KEY, normalized);
          window.history.replaceState(window.history.state || {}, '', url.toString());
        }catch(e){}
      }
      function detectCurrentBasemapLayer(){
        if(!MS.map || !window.L || typeof MS.map.eachLayer !== 'function'){ return null; }
        var found = null;
        MS.map.eachLayer(function(layer){
          if(found){ return; }
          try{
            if(layer instanceof L.TileLayer){ found = layer; }
          }catch(e){}
        });
        return found;
      }
      function ensureAttributionControl(){
        if(!MS.map){ return null; }
        var control = MS.map.attributionControl || null;
        if(!control && window.L && L.control && typeof L.control.attribution === 'function'){
          try{
            control = L.control.attribution({ position: 'bottomleft', prefix: false });
            control.addTo(MS.map);
            MS.map.attributionControl = control;
          }catch(e){ control = null; }
        }
        if(!control){ return null; }
        try{ if(typeof control.setPosition === 'function'){ control.setPosition('bottomleft'); } }catch(e){}
        try{ if(typeof control.setPrefix === 'function'){ control.setPrefix(''); } }catch(e){}
        if(!BASEMAP_STATE.attributionPrepared){
          try{
            if(control._attributions){
              Object.keys(control._attributions).forEach(function(key){ delete control._attributions[key]; });
            }
            if(typeof control._update === 'function'){ control._update(); }
          }catch(e){}
          BASEMAP_STATE.attributionPrepared = true;
          BASEMAP_STATE.activeAttribution = '';
        }
        return control;
      }
      function syncBasemapAttribution(id){
        var normalized = normalizeBasemapId(id) || BASEMAP_DEFAULT_ID;
        if(normalized === 'topplusopen'){
          applyTopPlusOpenAttributionYear(TOPPLUSOPEN_DATA_YEAR);
        }
        var control = ensureAttributionControl();
        if(!control){ return; }
        Object.keys(BASEMAP_ATTRIBUTION_REGISTRY).forEach(function(key){
          try{ control.removeAttribution(BASEMAP_ATTRIBUTION_REGISTRY[key]); }catch(e){}
        });
        var nextAttribution = BASEMAP_ATTRIBUTION_REGISTRY[normalized] || BASEMAP_ATTRIBUTION_REGISTRY[BASEMAP_DEFAULT_ID];
        try{
          control.addAttribution(nextAttribution);
          BASEMAP_STATE.activeAttribution = nextAttribution;
        }catch(e){
          BASEMAP_STATE.activeAttribution = '';
        }
        if(normalized === 'topplusopen'){
          ensureTopPlusOpenDataYear().then(function(){
            if(BASEMAP_STATE.activeId !== 'topplusopen'){ return; }
            var refreshedAttribution = buildTopPlusOpenAttribution(TOPPLUSOPEN_DATA_YEAR);
            BASEMAP_ATTRIBUTION_REGISTRY.topplusopen = refreshedAttribution;
            if(BASEMAP_STATE.activeAttribution !== refreshedAttribution){
              syncBasemapAttribution('topplusopen');
            }
          });
        }
      }
      function clearTopPlusOpenMonitor(){
        if(BASEMAP_STATE.timeoutId){
          clearTimeout(BASEMAP_STATE.timeoutId);
          BASEMAP_STATE.timeoutId = null;
        }
        if(BASEMAP_STATE.monitorLayer){
          try{
            if(BASEMAP_STATE.monitorLoadHandler){ BASEMAP_STATE.monitorLayer.off('load', BASEMAP_STATE.monitorLoadHandler); }
            if(BASEMAP_STATE.monitorErrorHandler){ BASEMAP_STATE.monitorLayer.off('tileerror', BASEMAP_STATE.monitorErrorHandler); }
          }catch(e){}
        }
        BASEMAP_STATE.monitorLayer = null;
        BASEMAP_STATE.monitorLoadHandler = null;
        BASEMAP_STATE.monitorErrorHandler = null;
        BASEMAP_STATE.topplusHasSuccessfulLoad = false;
        BASEMAP_STATE.tileErrorCount = 0;
      }
      function showBasemapWarning(message){
        if(typeof showMobileLocationToast === 'function'){
          showMobileLocationToast(message);
          return;
        }
        try{ console.warn(message); }catch(e){}
      }
      function createBasemapLayer(id){
        if(!window.L || typeof L.tileLayer !== 'function'){ return null; }
        if(id === 'topplusopen'){
          return L.tileLayer('https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png', {
            minZoom: 0,
            maxZoom: TOPPLUSOPEN_MAX_ZOOM,
            maxNativeZoom: TOPPLUSOPEN_MAX_ZOOM,
            attribution: '',
            detectRetina: false,
            noWrap: true
          });
        }
        return L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd',
          minZoom: 0,
          maxZoom: 20,
          maxNativeZoom: 20,
          attribution: '',
          detectRetina: !isMobileView()
        });
      }
      function syncMapMaxZoomForBasemap(id){
        if(!MS.map || typeof MS.map.setMaxZoom !== 'function'){ return; }
        if(BASEMAP_STATE.mapDefaultMaxZoom === null && typeof MS.map.getMaxZoom === 'function'){
          BASEMAP_STATE.mapDefaultMaxZoom = MS.map.getMaxZoom();
        }
        if(id === 'topplusopen'){
          try{ MS.map.setMaxZoom(TOPPLUSOPEN_MAX_ZOOM); }catch(e){}
          try{
            var currentZoom = (typeof MS.map.getZoom === 'function') ? MS.map.getZoom() : 0;
            if(typeof currentZoom === 'number' && currentZoom > TOPPLUSOPEN_MAX_ZOOM && typeof MS.map.setZoom === 'function'){
              MS.map.setZoom(TOPPLUSOPEN_MAX_ZOOM, { animate: false });
            }
          }catch(e){}
          return;
        }
        if(typeof BASEMAP_STATE.mapDefaultMaxZoom === 'number'){
          try{ MS.map.setMaxZoom(BASEMAP_STATE.mapDefaultMaxZoom); }catch(e){}
        }
      }
      function fallbackFromTopPlusOpen(){
        if(BASEMAP_STATE.activeId !== 'topplusopen'){ return; }
        showBasemapWarning('TopPlusOpen derzeit nicht erreichbar – wechsle auf Positron.');
        applyBasemapById('positron', { updateUrl: true, persist: true, skipWarning: true });
      }
      function monitorTopPlusOpenLayer(layer){
        if(!layer || typeof layer.on !== 'function'){ return; }
        clearTopPlusOpenMonitor();
        BASEMAP_STATE.monitorLayer = layer;
        BASEMAP_STATE.topplusHasSuccessfulLoad = false;
        BASEMAP_STATE.tileErrorCount = 0;
        BASEMAP_STATE.monitorLoadHandler = function(){
          BASEMAP_STATE.topplusHasSuccessfulLoad = true;
          BASEMAP_STATE.tileErrorCount = 0;
          if(BASEMAP_STATE.timeoutId){
            clearTimeout(BASEMAP_STATE.timeoutId);
            BASEMAP_STATE.timeoutId = null;
          }
        };
        BASEMAP_STATE.monitorErrorHandler = function(){
          BASEMAP_STATE.tileErrorCount += 1;
          if(BASEMAP_STATE.activeId === 'topplusopen' && BASEMAP_STATE.tileErrorCount >= TOPPLUSOPEN_MAX_TILE_ERRORS){
            fallbackFromTopPlusOpen();
          }
        };
        try{
          layer.on('load', BASEMAP_STATE.monitorLoadHandler);
          layer.on('tileerror', BASEMAP_STATE.monitorErrorHandler);
        }catch(e){}
        BASEMAP_STATE.timeoutId = setTimeout(function(){
          if(BASEMAP_STATE.activeId === 'topplusopen' && !BASEMAP_STATE.topplusHasSuccessfulLoad){ fallbackFromTopPlusOpen(); }
        }, TOPPLUSOPEN_TIMEOUT_MS);
      }
      function applyBasemapById(id, options){
        var opts = options || {};
        var normalized = normalizeBasemapId(id) || BASEMAP_DEFAULT_ID;
        if(!MS.map){
          BASEMAP_STATE.activeId = normalized;
          return false;
        }
        var sameIdActive = normalized === BASEMAP_STATE.activeId && BASEMAP_STATE.activeLayer && MS.map.hasLayer(BASEMAP_STATE.activeLayer);
        if(sameIdActive && !opts.forceRecreate){
          syncMapMaxZoomForBasemap(normalized);
          syncBasemapAttribution(normalized);
          if(opts.updateUrl){ updateBasemapUrlParam(normalized); }
          if(opts.persist){ persistBasemapToStorage(normalized); }
          return true;
        }
        var nextLayer = createBasemapLayer(normalized);
        if(!nextLayer){ return false; }
        clearTopPlusOpenMonitor();
        var previousLayer = BASEMAP_STATE.activeLayer || BASEMAP_STATE.initialLayer || detectCurrentBasemapLayer();
        if(previousLayer && MS.map.hasLayer(previousLayer)){
          try{ MS.map.removeLayer(previousLayer); }catch(e){}
        }
        try{ nextLayer.addTo(MS.map); }catch(e){ return false; }
        BASEMAP_STATE.activeLayer = nextLayer;
        BASEMAP_STATE.activeId = normalized;
        syncMapMaxZoomForBasemap(normalized);
        syncBasemapAttribution(normalized);
        if(normalized === 'topplusopen'){
          monitorTopPlusOpenLayer(nextLayer);
        }
        if(opts.updateUrl){ updateBasemapUrlParam(normalized); }
        if(opts.persist){ persistBasemapToStorage(normalized); }
        return true;
      }
      function initBasemapRuntime(){
        if(!MS.map){ return; }
        if(BASEMAP_STATE.mapDefaultMaxZoom === null && typeof MS.map.getMaxZoom === 'function'){
          BASEMAP_STATE.mapDefaultMaxZoom = MS.map.getMaxZoom();
        }
        ensureAttributionControl();
        if(!BASEMAP_STATE.initialLayer){ BASEMAP_STATE.initialLayer = detectCurrentBasemapLayer(); }
        BASEMAP_STATE.activeLayer = BASEMAP_STATE.initialLayer;
        BASEMAP_STATE.activeId = BASEMAP_DEFAULT_ID;
        var basemapFromUrl = readBasemapFromUrl();
        var basemapFromStorage = readBasemapFromStorage();
        var preferredBasemap = basemapFromUrl || basemapFromStorage || BASEMAP_DEFAULT_ID;
        if(preferredBasemap !== BASEMAP_DEFAULT_ID){
          var switched = applyBasemapById(preferredBasemap, { updateUrl: !!basemapFromUrl, persist: true });
          if(!switched && !applyBasemapById(BASEMAP_DEFAULT_ID, { updateUrl: !!basemapFromUrl, persist: true })){
            BASEMAP_STATE.activeId = BASEMAP_DEFAULT_ID;
          }
          syncBasemapAttribution(BASEMAP_STATE.activeId);
          return;
        }
        var defaultApplied = applyBasemapById(BASEMAP_DEFAULT_ID, {
          updateUrl: basemapFromUrl === BASEMAP_DEFAULT_ID,
          persist: true,
          forceRecreate: true
        });
        if(!defaultApplied){
          BASEMAP_STATE.activeId = BASEMAP_DEFAULT_ID;
          syncMapMaxZoomForBasemap(BASEMAP_DEFAULT_ID);
          syncBasemapAttribution(BASEMAP_DEFAULT_ID);
          if(basemapFromUrl === BASEMAP_DEFAULT_ID){ updateBasemapUrlParam(BASEMAP_DEFAULT_ID); }
        }
      }
      syncViewportCssVars();
      window.addEventListener('resize', syncViewportCssVars, { passive: true });
      window.addEventListener('orientationchange', syncViewportCssVars, { passive: true });
      window.addEventListener('resize', syncMobileControlVisibility, { passive: true });
      window.addEventListener('orientationchange', syncMobileControlVisibility, { passive: true });
      if(window.visualViewport && typeof window.visualViewport.addEventListener === 'function'){
        window.visualViewport.addEventListener('resize', syncViewportCssVars, { passive: true });
      }
      function resolveMapAndCluster(cb){
        function tryResolve(){
          var mapVarName = Object.keys(window).find(function(k){ return /^map_/.test(k); });
          var map = mapVarName ? window[mapVarName] : null;
          if(!map){ return setTimeout(tryResolve, 150); }
          // ensure zoom control is visible at the map edge
          if(!isMobileView() && map.zoomControl && typeof map.zoomControl.setPosition === 'function'){
            map.zoomControl.setPosition('bottomright');
          }
          var cluster = null;
          map.eachLayer(function(l){ if(l instanceof L.MarkerClusterGroup){ cluster = l; } });
          if(!cluster){ return setTimeout(tryResolve, 150); }
          cb(map, cluster);
        }
        tryResolve();
      }
      function parseMetaFromIconHtml(html){
        var temp = document.createElement('div'); temp.innerHTML = (html||'').trim();
        var el = temp.querySelector('.ms-marker');
        var species = []; var statuses = []; var statusColor = '#9e9e9e';
        if(el){
          try{ species = JSON.parse(el.getAttribute('data-species')||'[]'); }catch(e){}
          try{ statuses = JSON.parse(el.getAttribute('data-statuses')||'[]'); }catch(e){}
          statusColor = el.getAttribute('data-statuscolor') || '#9e9e9e';
        }
        return { species: species, statuses: statuses, statusColor: statusColor };
      }
      function initMarkers(){
        MS.markers = MS.cluster.getLayers();
        MS.markers.forEach(function(m){
          var html = (m.options && m.options.icon && m.options.icon.options && m.options.icon.options.html) || '';
          m._ms = parseMetaFromIconHtml(html);
          if(!m._msPopup && typeof m.getPopup === 'function'){
            try{ m._msPopup = m.getPopup(); }catch(e){ m._msPopup = null; }
          }
        });
        MS.visibleMarkerCount = MS.markers.length;
        updateInfoModalMarkerSentence();
        MS.ready = true;
      }
      function ensureMarkerDetailsModal(){
        var existing = document.getElementById('ms-marker-modal');
        if(existing){ return existing; }
        if(!document.body){ return null; }
        var overlay = document.createElement('div');
        overlay.id = 'ms-marker-modal';
        overlay.className = 'ms-modal ms-hidden';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = [
          '<div class="ms-modal-content ms-marker-modal-content" role="dialog" aria-modal="true" aria-labelledby="ms-marker-modal-title">',
            '<button id="ms-marker-modal-close" class="ms-modal-close" aria-label="Schließen">✕</button>',
            '<h2 id="ms-marker-modal-title" class="ms-modal-title">Fundortdetails</h2>',
            '<div id="ms-marker-modal-body" class="ms-marker-modal-scroll"></div>',
          '</div>'
        ].join('');
        document.body.appendChild(overlay);
        var closeBtn = overlay.querySelector('#ms-marker-modal-close');
        if(closeBtn){ closeBtn.addEventListener('click', closeMarkerDetailsModal); }
        overlay.addEventListener('click', function(ev){ if(ev.target === overlay){ closeMarkerDetailsModal(); } });
        document.addEventListener('keydown', function(ev){
          if(ev.key === 'Escape' && !overlay.classList.contains('ms-hidden')){ closeMarkerDetailsModal(); }
        });
        return overlay;
      }
      function closeMarkerDetailsModal(){
        var overlay = document.getElementById('ms-marker-modal');
        if(!overlay){ return; }
        overlay.classList.add('ms-hidden');
        overlay.setAttribute('aria-hidden', 'true');
      }
      function openMarkerDetailsModalFromMarker(marker){
        if(!isMobile || !marker){ return; }
        closeMobileTransientOverlays({ keepMarkerOverlay: true, forceShowControl: true });
        var overlay = ensureMarkerDetailsModal();
        if(!overlay){ return; }
        var body = overlay.querySelector('#ms-marker-modal-body');
        if(!body){ return; }
        var popup = marker._msPopup || (typeof marker.getPopup === 'function' ? marker.getPopup() : null);
        if(!popup){ return; }
        var content = (typeof popup.getContent === 'function') ? popup.getContent() : null;
        if(content && content.nodeType === 1){ body.innerHTML = content.outerHTML; }
        else { body.innerHTML = String(content || 'Keine Detaildaten verfügbar.'); }
        hardenDatabaseLinksInScope(body);
        overlay.classList.remove('ms-hidden');
        overlay.setAttribute('aria-hidden', 'false');
      }
      function bindMarkersForViewportMode(){
        if(!MS.markers || !MS.markers.length){ return; }
        MS.markers.forEach(function(marker){
          if(!marker){ return; }
          if(!marker._msPopup && typeof marker.getPopup === 'function'){
            try{ marker._msPopup = marker.getPopup(); }catch(e){ marker._msPopup = null; }
          }
          if(!marker._msMobileClickHandler){
            marker._msMobileClickHandler = function(ev){
              if(!isMobile){ return; }
              try{
                if(ev && ev.originalEvent && typeof ev.originalEvent.preventDefault === 'function'){ ev.originalEvent.preventDefault(); }
              }catch(e){}
              try{ if(MS.map && typeof MS.map.closePopup === 'function'){ MS.map.closePopup(); } }catch(err){}
              openMarkerDetailsModalFromMarker(marker);
            };
          }
          if(isMobile){
            try{ marker.off('click', marker._msMobileClickHandler); }catch(e){}
            try{ marker.on('click', marker._msMobileClickHandler); }catch(e){}
            if(marker._msPopup){
              try{ marker.unbindPopup(); }catch(e){}
            }
          } else {
            try{ marker.off('click', marker._msMobileClickHandler); }catch(e){}
            if(marker._msPopup && typeof marker.getPopup === 'function' && !marker.getPopup()){
              try{ marker.bindPopup(marker._msPopup); }catch(e){}
            }
          }
        });
      }
      function removeUserLocationLayers(){
        if(MS.map && MS.userMarker){ try{ MS.map.removeLayer(MS.userMarker); }catch(e){} }
        if(MS.map && MS.userAccuracyCircle){ try{ MS.map.removeLayer(MS.userAccuracyCircle); }catch(e){} }
        MS.userMarker = null;
        MS.userAccuracyCircle = null;
      }
      function updateUserLocationLayers(latlng, accuracy){
        if(!MS.map || !latlng){ return; }
        removeUserLocationLayers();
        try{
          MS.userMarker = L.circleMarker(latlng, {
            radius: 7,
            color: '#ffffff',
            weight: 2,
            fillColor: '#1976d2',
            fillOpacity: 1,
            interactive: false
          }).addTo(MS.map);
          MS.userAccuracyCircle = L.circle(latlng, {
            radius: Math.max(10, Number(accuracy) || 0),
            color: '#1976d2',
            weight: 1,
            fillColor: '#1976d2',
            fillOpacity: 0.12,
            interactive: false
          }).addTo(MS.map);
        }catch(e){}
      }
      function showMobileLocationToast(message){
        if(!isCompactViewport()){ return; }
        var toast = document.getElementById('ms-location-toast');
        if(!toast){
          toast = document.createElement('div');
          toast.id = 'ms-location-toast';
          toast.setAttribute('role', 'status');
          toast.setAttribute('aria-live', 'polite');
          toast.style.position = 'fixed';
          toast.style.left = '50%';
          toast.style.bottom = 'calc(16px + env(safe-area-inset-bottom, 0px))';
          toast.style.transform = 'translate(-50%, 8px)';
          toast.style.maxWidth = 'calc(100vw - 28px)';
          toast.style.padding = '8px 12px';
          toast.style.borderRadius = '10px';
          toast.style.background = 'rgba(33,33,33,0.92)';
          toast.style.color = '#fff';
          toast.style.fontSize = '12px';
          toast.style.lineHeight = '1.35';
          toast.style.zIndex = '10020';
          toast.style.boxShadow = '0 8px 22px rgba(0,0,0,0.22)';
          toast.style.opacity = '0';
          toast.style.transition = 'opacity .18s ease, transform .18s ease';
          document.body.appendChild(toast);
        }
        toast.textContent = message || 'Standort konnte nicht ermittelt werden.';
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';
        if(MS.locationToastTimer){ clearTimeout(MS.locationToastTimer); }
        MS.locationToastTimer = setTimeout(function(){
          toast.style.opacity = '0';
          toast.style.transform = 'translate(-50%, 8px)';
        }, 3600);
      }
      function ensureLocationBindings(){
        if(!MS.map || MS.locationBound){ return; }
        MS.locationBound = true;
        MS.map.on('locationfound', function(e){
          updateUserLocationLayers(e.latlng, e.accuracy);
        });
        MS.map.on('locationerror', function(e){
          var msg = 'Standort konnte nicht ermittelt werden.';
          if(e && e.code === 1){ msg = 'Standortfreigabe fehlt. Bitte im Browser erlauben.'; }
          else if(e && e.code === 2){ msg = 'Standort derzeit nicht verfügbar.'; }
          else if(e && e.code === 3){ msg = 'Standortabfrage hat zu lange gedauert.'; }
          showMobileLocationToast(msg);
          try{ console.warn('Geolocation unavailable:', e && e.message ? e.message : e); }catch(err){}
        });
      }
      function requestUserLocation(){
        if(!MS.map){ return; }
        if(!navigator.geolocation || typeof MS.map.locate !== 'function'){
          showMobileLocationToast('Standortfunktion wird vom Browser nicht unterstützt.');
          return;
        }
        ensureLocationBindings();
        try{
          MS.map.locate({
            setView: true,
            maxZoom: 17,
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000
          });
        }catch(e){}
      }
      function addLocateMapControl(){
        if(isMobileView()){
          if(MS.map && MS.locateControl && typeof MS.map.removeControl === 'function'){
            try{ MS.map.removeControl(MS.locateControl); }catch(e){}
          }
          MS.locateControl = null;
          return;
        }
        if(!MS.map || MS.locateControl || !L || typeof L.control !== 'function'){ return; }
        var LocateControl = L.Control.extend({
          options: { position: 'bottomright' },
          onAdd: function(){
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            var button = L.DomUtil.create('a', '', container);
            button.href = '#';
            button.title = 'Meinen Standort anzeigen';
            button.setAttribute('aria-label', 'Meinen Standort anzeigen');
            button.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3h-1.99A7.02 7.02 0 0 0 13 5.05V3.06a1 1 0 1 0-2 0v1.99A7.02 7.02 0 0 0 5.05 11H3.06a1 1 0 1 0 0 2h1.99A7.02 7.02 0 0 0 11 18.95v1.99a1 1 0 1 0 2 0v-1.99A7.02 7.02 0 0 0 18.95 13h1.99a1 1 0 1 0 0-2zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"></path></svg>';
            button.style.width = '34px';
            button.style.height = '34px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.background = '#fff';
            button.style.color = '#1976d2';
            button.style.textDecoration = 'none';
            button.style.borderBottom = 'none';
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(button, 'click', function(ev){
              L.DomEvent.stop(ev);
              requestUserLocation();
            });
            return container;
          }
        });
        MS.locateControl = new LocateControl();
        MS.map.addControl(MS.locateControl);
        try{
          var locateEl = MS.locateControl.getContainer && MS.locateControl.getContainer();
          var zoomEl = MS.map.zoomControl && MS.map.zoomControl.getContainer && MS.map.zoomControl.getContainer();
          if(locateEl && zoomEl && locateEl.parentNode && locateEl.parentNode === zoomEl.parentNode){
            locateEl.parentNode.insertBefore(locateEl, zoomEl);
          }
        }catch(e){}
      }
      function removeNativeMapControlsOnMobile(){
        if(!MS.map || !isMobileView()){ return; }
        try{
          if(MS.map.zoomControl && typeof MS.map.removeControl === 'function'){
            MS.map.removeControl(MS.map.zoomControl);
          }
        }catch(e){}
        try{
          if(MS.locateControl && typeof MS.map.removeControl === 'function'){
            MS.map.removeControl(MS.locateControl);
          }
        }catch(e){}
        MS.locateControl = null;
        try{
          var locateNodes = document.querySelectorAll('.leaflet-control-locate, .leaflet-control a[title*="Standort"], .leaflet-control a[aria-label*="Standort"]');
          locateNodes.forEach(function(node){
            var root = node.closest ? node.closest('.leaflet-control') : null;
            if(root && root.parentNode){ root.parentNode.removeChild(root); }
            else if(node && node.parentNode){ node.parentNode.removeChild(node); }
          });
        }catch(e){}
      }
      function autoLocateOnMobile(){
        if(!MS.map || !isCompactViewport()){ return; }
        requestUserLocation();
      }
      // More info modal toggle (desktop + mobile sheet)
      (function(){
        var togDesktop = document.getElementById('ms-more-info-toggle');
        var togSheet = document.getElementById('ms-more-info-toggle-sheet');
        var modal = document.getElementById('ms-info-modal');
        var closeBtn = document.getElementById('ms-info-close');
        var sheet = document.getElementById('ms-bottom-sheet');
        function openModal(ev){
          if(ev){ ev.preventDefault(); }
          updateInfoModalMarkerSentence();
          if(isMobileView()){
            closeMobileTransientOverlays({ keepInfoModal: true, forceShowControl: true });
          } else if(sheet){
            sheet.classList.remove('open');
            sheet.setAttribute('aria-hidden', 'true');
          }
          if(modal){ modal.classList.remove('ms-hidden'); }
          syncHeaderLayeringOverModals();
          syncMobileControlVisibility();
        }
        function closeModal(){
          if(modal){ modal.classList.add('ms-hidden'); }
          if(sheet){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
          syncHeaderLayeringOverModals();
          syncMobileControlVisibility();
        }
        if(togDesktop){ togDesktop.addEventListener('click', openModal); }
        if(togSheet){ togSheet.addEventListener('click', openModal); }
        // wire any copied desktop toggles or info buttons (e.g., placed near submit button)
        var extraDesktopTogs = document.querySelectorAll('.ms-more-info-toggle-copy, #ms-more-info-btn');
        extraDesktopTogs.forEach(function(t){ t.addEventListener('click', openModal); });
        if(closeBtn){ closeBtn.addEventListener('click', closeModal); }
        if(modal){ modal.addEventListener('click', function(ev){ if(ev.target === modal){ closeModal(); } }); }
      })();

      // Submit modal handlers (open submit modal from control button)
      (function(){
        var submitBtn = document.getElementById('ms-submit-btn');
        var submitModal = document.getElementById('ms-submit-modal');
        var submitClose = document.getElementById('ms-submit-close');
        var submitCancel = document.getElementById('ms-submit-cancel');
        var sheet = document.getElementById('ms-bottom-sheet');
        ensureSubmitCtaSecurity();
        function openSubmit(ev){
          if(ev){ ev.preventDefault(); }
          if(sheet){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
          openSubmitModalOrFallback();
        }
        function closeSubmit(){ if(submitModal){ submitModal.classList.add('ms-hidden'); } syncHeaderLayeringOverModals(); syncMobileControlVisibility(); }
        if(submitBtn){ submitBtn.addEventListener('click', openSubmit); }
        var submitSheetBtn = document.getElementById('ms-submit-btn-sheet');
        if(submitSheetBtn){ submitSheetBtn.addEventListener('click', openSubmit); }
        function isActuallyVisible(el){
          if(!el) return false;
          // getClientRects is empty when display:none or not in layout
          if(!el.getClientRects || el.getClientRects().length === 0) return false;
          var cs;
          try{ cs = window.getComputedStyle(el); }catch(e){ cs = null; }
          if(cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0')) return false;
          return true;
        }
        function applyMatchedWidth(target, width){
          if(!target || !width) return false;
          var px = Math.round(width);
          if(!px || px < 1) return false;
          target.style.setProperty('--ms-match-width', px + 'px');
          target.classList.add('ms-width-match');
          return true;
        }
        function matchInfoButtonWidth(){
          var s = document.getElementById('gb-feedback-control');
          var i = document.getElementById('ms-more-info-btn');
          if(!isActuallyVisible(s) || !isActuallyVisible(i)) return false;
          var r = s.getBoundingClientRect();
          if(!r || r.width < 80) return false;
          return applyMatchedWidth(i, r.width);
        }
        function matchApplyButtonWidth(){
          var reset = document.getElementById('ms-reset');
          var apply = document.getElementById('ms-apply-desktop');
          if(!isActuallyVisible(reset) || !isActuallyVisible(apply)) return false;
          var r = reset.getBoundingClientRect();
          if(!r || r.width < 120) return false;
          return applyMatchedWidth(apply, r.width);
        }
        function scheduleButtonSizing(){
          // run over a few frames so layout/fonts settle
          var frames = 0;
          function tick(){
            frames++;
            matchApplyButtonWidth();
            matchInfoButtonWidth();
            if(frames < 6) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
        // run once in case control starts expanded; otherwise we trigger on expand
        scheduleButtonSizing();
        window.addEventListener('resize', scheduleButtonSizing);
        if(submitClose){ submitClose.addEventListener('click', closeSubmit); }
        if(submitCancel){ submitCancel.addEventListener('click', closeSubmit); }
        if(submitModal){ submitModal.addEventListener('click', function(ev){ if(ev.target === submitModal){ closeSubmit(); } }); }
      })();
      function intersection(a, b){ return a.filter(function(x){ return b.indexOf(x) !== -1; }); }
      function applyMatchedWidthSafe(target, width){
        if(!target || !width) return false;
        var px = Math.round(width);
        if(!px || px < 1) return false;
        target.style.setProperty('--ms-match-width', px + 'px');
        target.classList.add('ms-width-match');
        return true;
      }
      function computeGradient(species){
        if(!species || !species.length){ return '#cccccc'; }
        var n = Math.min(species.length, 4);
        var seg = 360 / n;
        var stops = [];
        for(var i=0;i<n;i++){
          var sp = species[i];
          var color = SPECIES_COLORS_JS[sp] || '#9e9e9e';
          var start = (i*seg).toFixed(2);
          var end = ((i+1)*seg).toFixed(2);
          stops.push(color + ' ' + start + 'deg ' + end + 'deg');
        }
        return 'conic-gradient(' + stops.join(', ') + ')';
      }
      function applyVisualsToMarker(m, selectedSpecies, selectedStatus, speciesAll, statusAll){
        var sp = m._ms.species || [];
        var st = m._ms.statuses || [];
        var spSel = speciesAll ? sp : (selectedSpecies.length ? intersection(sp, selectedSpecies) : []);
        var el = m._icon;
        var inner = el ? el.querySelector('.ms-marker') : null;
        if(inner){
          inner.style.background = computeGradient(spSel);
          var hasNoStatus = !st || st.length === 0;
          var wantsNoStatus = selectedStatus.indexOf('none') !== -1;
          var stSel = statusAll ? st : (selectedStatus.length ? intersection(st, selectedStatus) : []);
          var color = 'transparent';
          if(statusAll){
            color = m._ms.statusColor || '#9e9e9e';
          } else if(stSel.length){
            var key = stSel[0];
            color = (STATUS_INFO_JS[key] && STATUS_INFO_JS[key].color) || (m._ms.statusColor || '#9e9e9e');
          } else if(wantsNoStatus && hasNoStatus){
            color = (STATUS_INFO_JS['none'] && STATUS_INFO_JS['none'].color) || (m._ms.statusColor || '#9e9e9e');
          }
          inner.style.outline = '2px solid ' + color;
          var badge = inner.querySelector('.ms-badge'); if(badge){ badge.classList.toggle('ms-badge-visible', !!stSel.length); badge.style.background = color; }
        }
      }
      function rebuildCluster(selectedSpecies, selectedStatus){
        if(!MS.ready){ return; }
        MS.cluster.clearLayers();
        var speciesAll = selectedSpecies.length === ALL_SPECIES.length;
        var statusAll = selectedStatus.length === ALL_STATUS.length;
        var toAdd = [];
        for(var i=0;i<MS.markers.length;i++){
          var m = MS.markers[i];
          var sp = m._ms.species || [];
          var st = m._ms.statuses || [];
          // Group semantics:
          // - none selected => show nothing
          // - all selected => do not restrict (also includes markers with empty st/sp)
          // - subset selected => restrict to intersection
          var speciesAllows = speciesAll ? true : (selectedSpecies.length ? intersection(sp, selectedSpecies).length > 0 : false);
          var hasNoStatus = !st || st.length === 0;
          var wantsNoStatus = selectedStatus.indexOf('none') !== -1;
          var statusAllows = statusAll ? true : (
            selectedStatus.length ? (
              (wantsNoStatus && hasNoStatus) || intersection(st, selectedStatus).length > 0
            ) : false
          );
          var visible = speciesAllows && statusAllows;
          if(visible){ toAdd.push(m); }
        }
        toAdd.forEach(function(m){ MS.cluster.addLayer(m); });
        MS.visibleMarkerCount = toAdd.length;
        updateInfoModalMarkerSentence();
        setTimeout(function(){ MS.cluster.getLayers().forEach(function(m){ applyVisualsToMarker(m, selectedSpecies, selectedStatus, speciesAll, statusAll); }); }, 75);
      }
      function getVisibleMarkerCount(){
        if(typeof MS.visibleMarkerCount === 'number' && isFinite(MS.visibleMarkerCount)){ return MS.visibleMarkerCount; }
        try{
          if(MS.cluster && typeof MS.cluster.getLayers === 'function'){
            var clusterCount = MS.cluster.getLayers().length;
            if(typeof clusterCount === 'number' && isFinite(clusterCount)){ return clusterCount; }
          }
        }catch(e){}
        try{
          if(MS.markers && typeof MS.markers.length === 'number' && isFinite(MS.markers.length)){ return MS.markers.length; }
        }catch(e){}
        return null;
      }
      function getInfoModalLeadParagraph(modal){
        if(!modal || !modal.querySelectorAll){ return null; }
        var paragraphs = modal.querySelectorAll('.ms-modal-text p');
        for(var i = 0; i < paragraphs.length; i += 1){
          var text = String(paragraphs[i].textContent || '').trim();
          if(/^Diese Karte zeigt\b/i.test(text)){ return paragraphs[i]; }
        }
        return null;
      }
      function getInfoModalSentenceTemplate(paragraph){
        if(!paragraph){ return ''; }
        var template = paragraph.getAttribute('data-ms-count-template') || '';
        if(template){ return template; }
        var currentText = String(paragraph.textContent || '').trim();
        template = currentText.replace(/^Diese Karte zeigt\s+(?:\d+\s+|zahlreiche\s+)?Standorte/i, 'Diese Karte zeigt {{count}} Standorte');
        if(template.indexOf('{{count}}') === -1){
          template = 'Diese Karte zeigt {{count}} Standorte von Gebäudebrütern in Berlin. Gebäudebrüter sind Tiere wie Mauersegler, Schwalben, Sperlinge oder Fledermäuse, die an Gebäuden leben.';
        }
        paragraph.setAttribute('data-ms-count-template', template);
        return template;
      }
      function updateInfoModalMarkerSentence(){
        var modal = document.getElementById('ms-info-modal');
        if(!modal){ return; }
        var paragraph = getInfoModalLeadParagraph(modal);
        if(!paragraph){ return; }
        var template = getInfoModalSentenceTemplate(paragraph);
        var count = getVisibleMarkerCount();
        var countText = (typeof count === 'number' && isFinite(count)) ? String(count) : 'zahlreiche';
        paragraph.textContent = template.replace('{{count}}', countText);
      }
      // build filter checkboxes into desktop and bottom-sheet accordions
      function buildFilters(){
        var sRow = document.getElementById('ms-species-row');
        var sAccordion = document.getElementById('ms-species-accordion-content');
        var stRow = document.getElementById('ms-status-row');
        var stAccordion = document.getElementById('ms-status-accordion-content');
        if(!sRow || !sAccordion || !stRow || !stAccordion) return;
        sRow.innerHTML = ''; sAccordion.innerHTML = '';
        stRow.innerHTML = ''; stAccordion.innerHTML = '';
        // 'Alle' for species
        function makeAllCheckbox(id){
          var wrap = document.createElement('label');
          wrap.className = 'ms-all-toggle';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = id;
          cb.checked = true;
          var track = document.createElement('span');
          track.className = 'ms-all-track';
          var thumb = document.createElement('span');
          thumb.className = 'ms-all-thumb';
          track.appendChild(thumb);
          var text = document.createElement('span');
          text.textContent = 'Alle';
          wrap.appendChild(cb);
          wrap.appendChild(track);
          wrap.appendChild(text);
          return {wrap: wrap, input: cb};
        }
        var sAllDesktop = makeAllCheckbox('ms-species-all'); sRow.appendChild(sAllDesktop.wrap);
        var sAllSheet = makeAllCheckbox('ms-species-all-sheet'); sAccordion.appendChild(sAllSheet.wrap);
        Object.keys(SPECIES_COLORS_JS).forEach(function(name){
          function makeEntry(prefix){
            var id = prefix + '-' + name;
            var wrap = document.createElement('label'); wrap.className = 'ms-filter-option';
            var cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = name; cb.id = id; cb.className = 'ms-filter-species'; cb.checked = true;
              var swatch = document.createElement('span'); swatch.className = 'ms-filter-swatch'; swatch.style.background = SPECIES_COLORS_JS[name];
            wrap.appendChild(cb);
            var value = document.createElement('span'); value.className = 'ms-value'; value.textContent = name;
            wrap.appendChild(value);
            wrap.appendChild(swatch);
            return wrap;
          }
          sRow.appendChild(makeEntry('ms-sp'));
          sAccordion.appendChild(makeEntry('ms-sp-sheet'));
        });
        // 'Alle' for status
        var stAllDesktop = makeAllCheckbox('ms-status-all'); stRow.appendChild(stAllDesktop.wrap);
        var stAllSheet = makeAllCheckbox('ms-status-all-sheet'); stAccordion.appendChild(stAllSheet.wrap);
        Object.keys(STATUS_INFO_JS).forEach(function(key){
          var info = STATUS_INFO_JS[key];
          function makeEntry(prefix){
            var id = prefix + '-' + key;
            var wrap = document.createElement('label'); wrap.className = 'ms-filter-option';
            var cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = key; cb.id = id; cb.className = 'ms-filter-status'; cb.checked = true;
            var swatch = document.createElement('span'); swatch.className = 'ms-filter-swatch ms-filter-swatch-status'; swatch.style.borderColor = info.color;
            wrap.appendChild(cb);
            var value = document.createElement('span'); value.className = 'ms-value'; value.textContent = info.label;
            if(key === 'verloren'){
              value.style.whiteSpace = 'nowrap';
              swatch.style.marginLeft = '2px';
            }
            wrap.appendChild(value);
            wrap.appendChild(swatch);
            return wrap;
          }
          stRow.appendChild(makeEntry('ms-st'));
          stAccordion.appendChild(makeEntry('ms-st-sheet'));
        });
      }
      function applyFilters(){
        var selectedSpecies = Array.from(document.querySelectorAll('.ms-filter-species:checked')).map(function(el){ return el.value; });
        var selectedStatus = Array.from(document.querySelectorAll('.ms-filter-status:checked')).map(function(el){ return el.value; });
        if(!MS.ready){ setTimeout(function(){ rebuildCluster(selectedSpecies, selectedStatus); }, 150); }
        else { rebuildCluster(selectedSpecies, selectedStatus); }
        updateFilterFabIndicator();
      }
      function updateFilterFabIndicator(){
        var filterFab = document.getElementById('fab-filter');
        if(!filterFab){ return; }
        var speciesBoxes = document.querySelectorAll('.ms-filter-species');
        var statusBoxes = document.querySelectorAll('.ms-filter-status');
        if(!speciesBoxes.length || !statusBoxes.length){
          filterFab.classList.remove('is-active');
          return;
        }
        var speciesChecked = Array.prototype.filter.call(speciesBoxes, function(el){ return el.checked; }).length;
        var statusChecked = Array.prototype.filter.call(statusBoxes, function(el){ return el.checked; }).length;
        var allSelected = speciesChecked === speciesBoxes.length && statusChecked === statusBoxes.length;
        filterFab.classList.toggle('is-active', !allSelected);
      }
      function wireFilters(){
        function bindChange(el, handler){
          if(!el){ return; }
          el.addEventListener('change', handler);
        }
        function syncByValue(source){
          if(!source){ return; }
          var selector = source.classList.contains('ms-filter-species') ? '.ms-filter-species' : '.ms-filter-status';
          document.querySelectorAll(selector).forEach(function(cb){
            if(cb !== source && cb.value === source.value){ cb.checked = source.checked; }
          });
        }
        function setGroupChecked(group, checked, source){
          document.querySelectorAll(group).forEach(function(cb){ if(cb !== source){ cb.checked = checked; } });
        }
        document.querySelectorAll('.ms-filter-species, .ms-filter-status').forEach(function(input){
          bindChange(input, function(ev){ syncByValue(ev.target); updateFilterFabIndicator(); });
        });
        var speciesAllDesktop = document.getElementById('ms-species-all');
        var speciesAllSheet = document.getElementById('ms-species-all-sheet');
        var statusAllDesktop = document.getElementById('ms-status-all');
        var statusAllSheet = document.getElementById('ms-status-all-sheet');
        bindChange(speciesAllDesktop, function(ev){ setGroupChecked('#ms-species-row input[type=checkbox], #ms-species-accordion-content input[type=checkbox]', ev.target.checked, ev.target); updateFilterFabIndicator(); });
        bindChange(speciesAllSheet, function(ev){ setGroupChecked('#ms-species-row input[type=checkbox], #ms-species-accordion-content input[type=checkbox]', ev.target.checked, ev.target); updateFilterFabIndicator(); });
        bindChange(statusAllDesktop, function(ev){ setGroupChecked('#ms-status-row input[type=checkbox], #ms-status-accordion-content input[type=checkbox]', ev.target.checked, ev.target); updateFilterFabIndicator(); });
        bindChange(statusAllSheet, function(ev){ setGroupChecked('#ms-status-row input[type=checkbox], #ms-status-accordion-content input[type=checkbox]', ev.target.checked, ev.target); updateFilterFabIndicator(); });

        var openBtn = document.getElementById('ms-open-sheet');
        var sheet = document.getElementById('ms-bottom-sheet');
        var ctrl = document.getElementById('ms-control');
        if(openBtn){
          openBtn.addEventListener('click', function(){
            syncMobileControlVisibility(true);
            if(isCompactViewport()){
              if(sheet){
                sheet.classList.toggle('open');
                sheet.setAttribute('aria-hidden', sheet.classList.contains('open') ? 'false' : 'true');
                if(!sheet.classList.contains('open')){ syncMobileControlVisibility(); }
              }
            } else if(ctrl){
              ctrl.classList.toggle('collapsed');
              if(!ctrl.classList.contains('collapsed')){
                try{ if(window.requestAnimationFrame){ requestAnimationFrame(function(){ requestAnimationFrame(function(){
                  var btn = document.getElementById('gb-feedback-control');
                  var info = document.getElementById('ms-more-info-btn');
                  var reset = document.getElementById('ms-reset');
                  var apply = document.getElementById('ms-apply-desktop');
                  if(btn && info){ var r1 = btn.getBoundingClientRect(); if(r1 && r1.width > 80){ applyMatchedWidthSafe(info, r1.width); } }
                  if(reset && apply){ var r2 = reset.getBoundingClientRect(); if(r2 && r2.width > 120){ applyMatchedWidthSafe(apply, r2.width); } }
                }); }); } }catch(e){}
              }
            }
          });
        }

        var applyMobile = document.getElementById('ms-apply-filters');
        var applyDesktop = document.getElementById('ms-apply-desktop');
        if(applyMobile){
          applyMobile.addEventListener('click', function(){
            applyFilters();
            if(sheet){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
          });
        }
        if(applyDesktop){
          applyDesktop.addEventListener('click', function(){ applyFilters(); });
        }

        document.querySelectorAll('.ms-accordion-toggle').forEach(function(toggle){
          toggle.addEventListener('click', function(){
            var targetId = toggle.getAttribute('data-target');
            var node = targetId ? document.getElementById(targetId) : null;
            if(node){ node.classList.toggle('open'); }
          });
        });

        var resetBtn = document.getElementById('ms-reset');
        var resetSheetBtn = document.getElementById('ms-reset-sheet');
        function resetFiltersToAll(){
          // Keep existing filter reset logic unchanged.
          document.querySelectorAll('.ms-filter-species, .ms-filter-status').forEach(function(el){ el.checked = true; });
          document.querySelectorAll('#ms-species-all, #ms-species-all-sheet, #ms-status-all, #ms-status-all-sheet').forEach(function(el){ el.checked = true; });
          rebuildCluster(Object.keys(SPECIES_COLORS_JS), Object.keys(STATUS_INFO_JS));
          updateFilterFabIndicator();
          // Mobile parity: reset closes sheet just like apply.
          if(sheet){
            sheet.classList.remove('open');
            sheet.setAttribute('aria-hidden', 'true');
            sheet.style.removeProperty('transform');
          }
        }
        if(resetBtn){
          resetBtn.addEventListener('click', resetFiltersToAll);
        }
        if(resetSheetBtn){
          resetSheetBtn.addEventListener('click', resetFiltersToAll);
        }
      }
      // close bottom sheet when tapping backdrop
      (function(){
        var sheet = document.getElementById('ms-bottom-sheet');
        if(!sheet) return;
        sheet.addEventListener('click', function(ev){ if(ev.target === sheet){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); } });
        // also close sheet when tapping the map area (leaflet container) or touching outside the sheet
        function closeIfMapTap(ev){
          try{
            if(!sheet.classList.contains('open')) return;
            var target = ev.target || window.event && window.event.srcElement;
            if(!target) return;
            // if tap/click occurred inside the sheet, ignore
            if(target.closest && target.closest('.ms-bottom-sheet')) return;
            // if tap/click occurred inside a leaflet map container, close the sheet
            if(target.closest && target.closest('.leaflet-container')){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
          }catch(e){}
        }
        document.addEventListener('click', closeIfMapTap, {passive:true});
        document.addEventListener('touchstart', closeIfMapTap, {passive:true});
      })();

      // Sticky header + side-sheet + FAB enhancements (mobile-first)
      (function initMobileRedesign(){
        var cleanups = [];
        var mobileMounted = false;
        var mobileRefs = null;
        var sideSheetObserver = null;

        function safeInvalidateMap(){
          setTimeout(function(){
            if(MS.map && typeof MS.map.invalidateSize === 'function'){
              try{ MS.map.invalidateSize(true); }catch(e){}
            }
          }, 40);
        }

        function addCleanup(target, eventName, handler, options){
          if(!target){ return; }
          target.addEventListener(eventName, handler, options);
          cleanups.push(function(){
            try{ target.removeEventListener(eventName, handler, options); }catch(e){}
          });
        }

        function runCleanup(){
          if(sideSheetObserver){
            try{ sideSheetObserver.disconnect(); }catch(e){}
            sideSheetObserver = null;
          }
          while(cleanups.length){
            var fn = cleanups.pop();
            try{ fn(); }catch(e){}
          }
        }

        function removeLegacyHeaderIfPresent(){
          var nodes = document.querySelectorAll('body > header:not(#ms-app-header), #ms-legacy-header, .ms-legacy-header, #old-header, .old-header');
          if(!nodes.length){ return; }
          nodes.forEach(function(node){ if(node && node.parentNode){ node.parentNode.removeChild(node); } });
          safeInvalidateMap();
        }

        function setDesktopControlVisibility(){
          var ctrl = document.getElementById('ms-control');
          if(!ctrl){ return; }
          if(isMobile){
            ctrl.style.display = 'none';
            ctrl.classList.add('ms-overlay-hidden');
            ctrl.setAttribute('aria-hidden', 'true');
          } else {
            ctrl.style.removeProperty('display');
            ctrl.classList.remove('ms-overlay-hidden');
            ctrl.setAttribute('aria-hidden', 'false');
          }
        }

        function ensureMobileRedesignDom(){
          if(document.getElementById('ms-mobile-root')){ return; }
          if(!document.body){ return; }
          var mount = document.createElement('div');
          mount.id = 'ms-mobile-root';
          mount.innerHTML = [
            '<header id="ms-app-header" data-stand-fallback="Unbekannt" role="banner">',
              '<button id="ms-nav-toggle" class="ms-icon-btn" type="button" aria-label="Menü öffnen" aria-controls="ms-side-sheet" aria-expanded="false">☰</button>',
              '<div class="ms-app-header-title">',
                '<div class="ms-app-title">Gebäudebrüter in Berlin</div>',
                '<div id="ms-app-stand" class="ms-app-stand">Stand: Unbekannt</div>',
              '</div>',
              '<button id="ms-header-submit" class="ms-icon-btn ms-icon-btn-accent" type="button" aria-label="Fundort melden">＋</button>',
            '</header>',
            '<div id="ms-side-backdrop" class="ms-side-backdrop" hidden></div>',
            '<aside id="ms-side-sheet" class="ms-side-sheet" aria-hidden="true" aria-modal="true" aria-label="Navigation" tabindex="-1">',
              '<div class="ms-side-head">',
                '<strong>Menü</strong>',
                '<button id="ms-side-close" class="ms-icon-btn" type="button" aria-label="Menü schließen">✕</button>',
              '</div>',
              '<nav class="ms-side-nav" aria-label="Hauptnavigation">',
                '<button class="ms-side-item" type="button" data-ms-nav-action="filter"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 4h18l-7 8v6a1 1 0 0 1-1.45.89l-2.5-1.25A1 1 0 0 1 9 17v-5L3 4z"></path></svg></span><span>Filter</span></button>',
                '<button class="ms-side-item" type="button" data-ms-nav-action="info"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M11 10h2v7h-2zm0-4h2v2h-2z"></path><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path></svg></span><span>Info &amp; Hilfe</span></button>',
                '<button class="ms-side-item" type="button" data-ms-nav-action="share"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18 16a3 3 0 0 0-2.24 1.01L8.91 13.7a3.1 3.1 0 0 0 0-3.4l6.85-3.31A3 3 0 1 0 15 5a3 3 0 0 0 .05.55L8.2 8.86a3 3 0 1 0 0 6.28l6.85 3.31A3 3 0 1 0 18 16z"></path></svg></span><span>Teile Karte</span></button>',
                '<button class="ms-side-item" type="button" data-ms-nav-action="feedback"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg></span><span>Sende Feedback</span></button>',
                '<div class="ms-side-divider" role="separator" aria-hidden="true"></div>',
                '<div class="ms-side-section-label">Rechtliches</div>',
                '<button class="ms-side-item" type="button" data-ms-nav-action="legal-terms"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5"></path><path fill="currentColor" d="M8 11h8v1.5H8zM8 14h8v1.5H8zM8 17h6v1.5H8z"></path></svg></span><span>Nutzungsbedingungen</span></button>',
                '<a class="ms-side-item" data-ms-nav-action="legal-combined" href="' + LEGAL_COMBINED_URL + '" target="_blank" rel="noopener noreferrer"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2 4 5.5V11c0 5.3 3.4 10.3 8 11.8 4.6-1.5 8-6.5 8-11.8V5.5L12 2zm0 4.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zm-2.1 5h4.2v7h-1.6v-2.6h-1v2.6H9.9v-7z"></path></svg></span><span>Impressum &amp; Datenschutz</span></a>',
                '<button class="ms-side-item" type="button" data-ms-nav-action="contact"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11zm1.8.3 7.2 5.2 7.2-5.2v-.3a1 1 0 0 0-1-1h-12.4a1 1 0 0 0-1 1v.3zm14.4 2-6.7 4.8a1 1 0 0 1-1.2 0L4.8 8.8v8.7a1 1 0 0 0 1 1h12.4a1 1 0 0 0 1-1V8.8z"></path></svg></span><span>Kontakt</span></button>',
                '<button class="ms-side-item" type="button" data-ms-nav-action="about-app"><span class="ms-side-icon"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"></path></svg></span><span>Über diese App</span></button>',
              '</nav>',
              '<div class="ms-side-footer">',
                '<div class="ms-side-logo-wrap">',
                  '<a class="ms-side-logo-link" href="' + NABU_LOGO_LINK + '" target="_blank" rel="noopener noreferrer" aria-label="NABU Bezirksgruppe Steglitz-Zehlendorf">',
                    '<img class="ms-side-logo" src="images/logo_bgsz.svg" alt="NABU Bezirksgruppe Steglitz-Zehlendorf" onerror="if(!this.dataset.fallback1){this.dataset.fallback1=\'1\';this.src=\'docs/images/logo_bgsz.svg\';}else{this.style.display=\'none\';}">',
                  '</a>',
                '</div>',
              '</div>',
            '</aside>',
            '<div id="ms-fab-stack" class="ms-fab-stack" aria-hidden="false">',
              '<button id="fab-layer" class="ms-fab-layer" type="button" aria-label="Kartenstil wählen">',
                '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2 1 7l11 5 9-4.09V16h2V7L12 2zm0 12L4.2 10.45 2 11.45l10 4.55 10-4.55-2.2-1L12 14zm0 4L4.2 14.45 2 15.45 12 20l10-4.55-2.2-1L12 18z"></path></svg>',
              '</button>',
              '<button id="fab-filter" class="ms-fab-filter" type="button" aria-label="Filter öffnen">',
                '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 4h18l-7 8v6a1 1 0 0 1-1.45.89l-2.5-1.25A1 1 0 0 1 9 17v-5L3 4z"></path></svg>',
                '<span class="ms-fab-badge" aria-hidden="true"></span>',
              '</button>',
              '<button id="fab-locate" class="ms-fab-locate" type="button" aria-label="Meinen Standort anzeigen">',
                '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3h-1.99A7.02 7.02 0 0 0 13 5.05V3.06a1 1 0 1 0-2 0v1.99A7.02 7.02 0 0 0 5.05 11H3.06a1 1 0 1 0 0 2h1.99A7.02 7.02 0 0 0 11 18.95v1.99a1 1 0 1 0 2 0v-1.99A7.02 7.02 0 0 0 18.95 13h1.99a1 1 0 1 0 0-2zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"></path></svg>',
              '</button>',
            '</div>',
            '<div id="ms-basemap-modal" class="ms-modal ms-hidden" aria-hidden="true">',
              '<div class="ms-modal-content ms-basemap-modal-content" role="dialog" aria-modal="true" aria-labelledby="ms-basemap-title">',
                '<button id="ms-basemap-close" class="ms-modal-close" type="button" aria-label="Schließen">✕</button>',
                '<h2 id="ms-basemap-title" class="ms-modal-title" tabindex="-1">Kartenstil wählen</h2>',
                '<form id="ms-basemap-form" class="ms-basemap-form">',
                  '<label class="ms-basemap-option">',
                    '<input type="radio" name="ms-basemap" value="positron">',
                    '<span class="ms-basemap-copy">',
                      '<span class="ms-basemap-option-title">Positron (CARTO)</span>',
                      '<span class="ms-basemap-option-desc">Helle, minimalistische Hintergrundkarte. Betont Marker.</span>',
                    '</span>',
                  '</label>',
                  '<label class="ms-basemap-option">',
                    '<input type="radio" name="ms-basemap" value="topplusopen">',
                    '<span class="ms-basemap-copy">',
                      '<span class="ms-basemap-option-title">TopPlusOpen (BKG)</span>',
                      '<span class="ms-basemap-option-desc">Amtliche Detailkarte für Deutschland (19 Zoomstufen, EPSG:3857).</span>',
                    '</span>',
                  '</label>',
                '</form>',
                '<div class="ms-basemap-actions">',
                  '<button id="ms-basemap-apply" class="ms-basemap-apply" type="button">Anwenden</button>',
                  '<button id="ms-basemap-cancel" class="ms-submit-btn" type="button">Abbrechen</button>',
                '</div>',
              '</div>',
            '</div>',
            '<div id="ms-placeholder-modal" class="ms-modal ms-hidden" aria-hidden="true">',
              '<div class="ms-modal-content" role="dialog" aria-modal="true" aria-labelledby="ms-placeholder-title">',
                '<button id="ms-placeholder-close" class="ms-modal-close" type="button" aria-label="Schließen">✕</button>',
                '<div id="ms-placeholder-title" class="ms-modal-title">Hinweis</div>',
                '<div id="ms-placeholder-text" class="ms-modal-body">Dieser Bereich ist in Vorbereitung.</div>',
              '</div>',
            '</div>'
          ].join('');
          document.body.appendChild(mount);
        }

        function removeMobileRedesignDom(){
          var root = document.getElementById('ms-mobile-root');
          if(root && root.parentNode){ root.parentNode.removeChild(root); }
        }

        function collectRefs(){
          return {
            header: document.getElementById('ms-app-header'),
            standNode: document.getElementById('ms-app-stand'),
            navToggle: document.getElementById('ms-nav-toggle'),
            sideSheet: document.getElementById('ms-side-sheet'),
            sideBackdrop: document.getElementById('ms-side-backdrop'),
            sideClose: document.getElementById('ms-side-close'),
            submitHeaderBtn: document.getElementById('ms-header-submit'),
            fabStack: document.getElementById('ms-fab-stack'),
            layerFab: document.getElementById('fab-layer'),
            filterFab: document.getElementById('fab-filter'),
            locateFab: document.getElementById('fab-locate'),
            bottomSheet: document.getElementById('ms-bottom-sheet'),
            basemapModal: document.getElementById('ms-basemap-modal'),
            basemapTitle: document.getElementById('ms-basemap-title'),
            basemapForm: document.getElementById('ms-basemap-form'),
            basemapApply: document.getElementById('ms-basemap-apply'),
            basemapCancel: document.getElementById('ms-basemap-cancel'),
            basemapClose: document.getElementById('ms-basemap-close'),
            placeholderModal: document.getElementById('ms-placeholder-modal'),
            placeholderTitle: document.getElementById('ms-placeholder-title'),
            placeholderText: document.getElementById('ms-placeholder-text'),
            placeholderClose: document.getElementById('ms-placeholder-close')
          };
        }

        function addDirectPressListener(el, handler){
          if(!el || typeof handler !== 'function'){ return; }
          var lastStamp = 0;
          var wrapped = function(ev){
            var now = Date.now();
            if(now - lastStamp < 260){ return; }
            lastStamp = now;
            if(ev && ev.preventDefault){ ev.preventDefault(); }
            handler(ev);
          };
          addCleanup(el, 'click', wrapped);
          addCleanup(el, 'pointerup', wrapped);
          addCleanup(el, 'touchstart', wrapped, { passive: false });
        }

        function extractStandText(header){
          var fallback = header.getAttribute('data-stand-fallback') || 'Unbekannt';
          var fromTitleSub = document.querySelector('.ms-title-sub');
          if(fromTitleSub && fromTitleSub.textContent){
            var subText = fromTitleSub.textContent.trim();
            if(subText){ return /stand\s*:/i.test(subText) ? subText.replace(/\s+/g, ' ') : ('Stand: ' + subText); }
          }
          var selectors = ['body'];
          for(var i=0;i<selectors.length;i++){
            var node = document.querySelector(selectors[i]);
            var text = node && node.textContent ? node.textContent : '';
            if(!text){ continue; }
            var m = text.match(/(?:Stand|erstellt am)\s*:??\s*([0-9]{1,2}\.[0-9]{2}\.[0-9]{4}|[0-9]{1,2}\.[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
            if(m && m[1]){ return 'Stand: ' + m[1]; }
          }
          return 'Stand: ' + fallback;
        }

        function openPlaceholder(title, text){
          if(!mobileRefs || !mobileRefs.placeholderModal || !mobileRefs.placeholderText){ return; }
          var resolvedTitle = title;
          var resolvedText = text;
          if(typeof resolvedText === 'undefined'){
            resolvedText = resolvedTitle;
            resolvedTitle = 'Hinweis';
          }
          closeMobileTransientOverlays({ keepPlaceholderModal: true, forceShowControl: true });
          if(mobileRefs.placeholderTitle){
            mobileRefs.placeholderTitle.textContent = resolvedTitle || 'Hinweis';
          }
          mobileRefs.placeholderText.textContent = resolvedText || 'Dieser Bereich ist in Vorbereitung.';
          mobileRefs.placeholderModal.classList.remove('ms-hidden');
          mobileRefs.placeholderModal.setAttribute('aria-hidden', 'false');
          syncHeaderLayeringOverModals();
          if(mobileRefs.placeholderClose){ mobileRefs.placeholderClose.focus(); }
        }

        function closePlaceholder(){
          if(!mobileRefs || !mobileRefs.placeholderModal){ return; }
          mobileRefs.placeholderModal.classList.add('ms-hidden');
          mobileRefs.placeholderModal.setAttribute('aria-hidden', 'true');
          syncHeaderLayeringOverModals();
        }
        function showShareToast(message){
          showMobileLocationToast(message || 'Link kopiert.');
        }
        function openContactLink(){
          openPlaceholder('Kontakt', CONTACT_UNAVAILABLE_TEXT);
        }
        function openAboutAppInfo(){
          openPlaceholder('Über diese App', ABOUT_APP_TEXT);
        }
        function shareCurrentMap(){
          var url = window.location.href;
          if(navigator.share){
            navigator.share({
              title: 'Gebäudebrüter in Berlin',
              text: 'Karte der Gebäudebrüter in Berlin',
              url: url
            }).catch(function(){});
            return;
          }
          if(navigator.clipboard && typeof navigator.clipboard.writeText === 'function'){
            navigator.clipboard.writeText(url).then(function(){
              showShareToast('Link zur Karte wurde kopiert.');
            }).catch(function(){
              showShareToast('Kopieren nicht möglich.');
            });
            return;
          }
          showShareToast('Kopieren nicht unterstützt.');
        }
        function syncBasemapModalSelection(){
          if(!mobileRefs || !mobileRefs.basemapForm){ return; }
          var activeBasemap = normalizeBasemapId(BASEMAP_STATE.activeId) || BASEMAP_DEFAULT_ID;
          var selectedInput = mobileRefs.basemapForm.querySelector('input[name="ms-basemap"][value="' + activeBasemap + '"]');
          if(selectedInput){ selectedInput.checked = true; }
        }
        function getBasemapSelectionFromModal(){
          if(!mobileRefs || !mobileRefs.basemapForm){ return ''; }
          var checked = mobileRefs.basemapForm.querySelector('input[name="ms-basemap"]:checked');
          return normalizeBasemapId(checked ? checked.value : '');
        }
        function closeBasemapModal(returnFocus){
          if(!mobileRefs || !mobileRefs.basemapModal){ return; }
          mobileRefs.basemapModal.classList.add('ms-hidden');
          mobileRefs.basemapModal.setAttribute('aria-hidden', 'true');
          syncHeaderLayeringOverModals();
          syncMobileControlVisibility();
          if(returnFocus && mobileRefs.layerFab && typeof mobileRefs.layerFab.focus === 'function'){
            mobileRefs.layerFab.focus();
          }
        }
        function openBasemapModal(){
          if(!mobileRefs || !mobileRefs.basemapModal){ return; }
          closeMobileTransientOverlays({ keepBasemapModal: true, forceShowControl: true });
          syncBasemapModalSelection();
          mobileRefs.basemapModal.classList.remove('ms-hidden');
          mobileRefs.basemapModal.setAttribute('aria-hidden', 'false');
          syncHeaderLayeringOverModals();
          syncMobileControlVisibility();
          if(mobileRefs.basemapTitle){
            setTimeout(function(){ try{ mobileRefs.basemapTitle.focus(); }catch(e){} }, 0);
          }
        }
        function applyBasemapSelectionFromModal(){
          var selectedId = getBasemapSelectionFromModal() || BASEMAP_DEFAULT_ID;
          var switched = applyBasemapById(selectedId, { updateUrl: true, persist: true });
          if(!switched && selectedId === 'topplusopen'){
            showBasemapWarning('TopPlusOpen derzeit nicht erreichbar – wechsle auf Positron.');
            applyBasemapById('positron', { updateUrl: true, persist: true });
          }
          closeBasemapModal(true);
        }

        function syncFabStackVisibility(){
          if(!mobileRefs || !mobileRefs.fabStack || !mobileRefs.bottomSheet){ return; }
          mobileRefs.fabStack.classList.remove('is-hidden');
          mobileRefs.fabStack.setAttribute('aria-hidden', 'false');
        }

        function openInfoModalFromMobile(){
          var modal = document.getElementById('ms-info-modal');
          if(!modal){ return; }
          updateInfoModalMarkerSentence();
          closeMobileTransientOverlays({ keepInfoModal: true, forceShowControl: true });
          modal.classList.remove('ms-hidden');
          modal.setAttribute('aria-hidden', 'false');
          syncHeaderLayeringOverModals();
          syncMobileControlVisibility();
        }

        function openSubmitModalFromMobile(){
          closeMobileTransientOverlays({ keepSubmitModal: true, forceShowControl: true });
          openSubmitModalOrFallback();
        }

        function closeBottomSheet(){
          if(!mobileRefs || !mobileRefs.bottomSheet){ return; }
          mobileRefs.bottomSheet.classList.remove('open');
          mobileRefs.bottomSheet.classList.remove('ms-sheet-dragging');
          mobileRefs.bottomSheet.setAttribute('aria-hidden', 'true');
          mobileRefs.bottomSheet.style.removeProperty('transition');
          mobileRefs.bottomSheet.style.removeProperty('will-change');
          mobileRefs.bottomSheet.style.removeProperty('transform');
          syncFabStackVisibility();
        }

        function openBottomSheet(){
          if(!mobileRefs || !mobileRefs.bottomSheet){ return; }
          closeMobileTransientOverlays({ keepBottomSheet: true, forceShowControl: true });
          mobileRefs.bottomSheet.classList.add('open');
          mobileRefs.bottomSheet.setAttribute('aria-hidden', 'false');
          mobileRefs.bottomSheet.style.removeProperty('transform');
          var speciesAccordion = document.getElementById('ms-species-accordion-content');
          var statusAccordion = document.getElementById('ms-status-accordion-content');
          if(speciesAccordion){ speciesAccordion.classList.add('open'); }
          if(statusAccordion){ statusAccordion.classList.add('open'); }
          syncFabStackVisibility();
          syncHeaderLayeringOverModals();
          syncMobileControlVisibility(true);
        }

        function closeSideSheet(returnFocus){
          if(!mobileRefs){ return; }
          mobileRefs.sideSheet.classList.remove('is-open');
          mobileRefs.sideSheet.setAttribute('aria-hidden', 'true');
          mobileRefs.sideSheet.setAttribute('aria-modal', 'false');
          mobileRefs.sideBackdrop.classList.remove('is-open');
          mobileRefs.sideBackdrop.setAttribute('hidden', 'hidden');
          mobileRefs.navToggle.classList.remove('is-open');
          mobileRefs.navToggle.setAttribute('aria-expanded', 'false');
          mobileRefs.navToggle.setAttribute('aria-label', 'Menü öffnen');
          document.body.classList.remove('ms-side-open');
          if(returnFocus && mobileRefs.__lastOpener && typeof mobileRefs.__lastOpener.focus === 'function'){
            mobileRefs.__lastOpener.focus();
          }
        }

        function openSideSheet(opener){
          if(!mobileRefs){ return; }
          closeMobileTransientOverlays({ keepSideSheet: true, forceShowControl: true });
          mobileRefs.__lastOpener = opener || mobileRefs.navToggle;
          mobileRefs.sideBackdrop.removeAttribute('hidden');
          mobileRefs.sideSheet.classList.add('is-open');
          mobileRefs.sideSheet.setAttribute('aria-hidden', 'false');
          mobileRefs.sideSheet.setAttribute('aria-modal', 'true');
          mobileRefs.sideBackdrop.classList.add('is-open');
          mobileRefs.navToggle.classList.add('is-open');
          mobileRefs.navToggle.setAttribute('aria-expanded', 'true');
          mobileRefs.navToggle.setAttribute('aria-label', 'Menü schließen');
          document.body.classList.add('ms-side-open');
          var focusables = Array.prototype.slice.call(mobileRefs.sideSheet.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')).filter(function(el){
            return !el.disabled && el.getAttribute('aria-hidden') !== 'true';
          });
          if(focusables.length){ focusables[0].focus(); }
          else { mobileRefs.sideSheet.focus(); }
        }

        function removeBottomSheetExtraActions(){
          if(!mobileRefs || !mobileRefs.bottomSheet){ return; }
          var submitSheet = mobileRefs.bottomSheet.querySelector('#ms-submit-btn-sheet');
          if(submitSheet && submitSheet.parentNode){ submitSheet.parentNode.removeChild(submitSheet); }
          var byIdFeedback = mobileRefs.bottomSheet.querySelector('#gb-feedback-control, #gb-feedback-control-sheet');
          if(byIdFeedback && byIdFeedback.parentNode){ byIdFeedback.parentNode.removeChild(byIdFeedback); }
          var actionNodes = mobileRefs.bottomSheet.querySelectorAll('button, a');
          actionNodes.forEach(function(node){
            var text = (node.textContent || '').trim().toLowerCase();
            if(text === 'feedback' || text.indexOf('nistplatz melden') !== -1){
              if(node.parentNode){ node.parentNode.removeChild(node); }
            }
          });
        }

        function bindMobileEvents(){
          if(!mobileRefs){ return; }

          // Close marker modal when tapping the sticky app header area.
          addCleanup(mobileRefs.header, 'click', function(){
            var markerModal = document.getElementById('ms-marker-modal');
            if(markerModal && !markerModal.classList.contains('ms-hidden')){
              closeMarkerDetailsModal();
            }
          });

          addDirectPressListener(mobileRefs.navToggle, function(){
            if(mobileRefs.sideSheet.classList.contains('is-open')){ closeSideSheet(true); }
            else { openSideSheet(mobileRefs.navToggle); }
          });
          addDirectPressListener(mobileRefs.sideClose, function(){ closeSideSheet(true); });
          addDirectPressListener(mobileRefs.sideBackdrop, function(){ closeSideSheet(true); });
          addDirectPressListener(mobileRefs.layerFab, function(){ openBasemapModal(); });
          addDirectPressListener(mobileRefs.filterFab, function(){ openBottomSheet(); });
          addDirectPressListener(mobileRefs.locateFab, function(){ requestUserLocation(); });

          addCleanup(document, 'click', function(ev){
            if(!mobileRefs || !isMobileView()){ return; }
            var target = ev && ev.target;
            var reportLink = target && target.closest ? target.closest('a.gb-report-link') : null;
            if(!reportLink){ return; }
            if(ev && ev.cancelable){ ev.preventDefault(); }
            if(ev && typeof ev.stopImmediatePropagation === 'function'){ ev.stopImmediatePropagation(); }
            if(ev && ev.stopPropagation){ ev.stopPropagation(); }
            closeMobileTransientOverlays({ keepSubmitModal: true, forceShowControl: true });
            if(!openSubmitModalOrFallback()){
              openUrlInNewTabSecure(getSubmitFormUrl());
            }
          }, true);

          if(mobileRefs.submitHeaderBtn){
            addDirectPressListener(mobileRefs.submitHeaderBtn, function(){
              openSubmitModalFromMobile();
            });
          }

          (function setupSidebarSwipe(){
            var startX = 0;
            var startTime = 0;
            var active = false;
            addCleanup(mobileRefs.sideSheet, 'pointerdown', function(ev){
              if(!mobileRefs.sideSheet.classList.contains('is-open')){ return; }
              if(ev.pointerType === 'mouse' && ev.button !== 0){ return; }
              active = true;
              startX = ev.clientX;
              startTime = Date.now();
            }, { passive: true });
            addCleanup(mobileRefs.sideSheet, 'pointerup', function(ev){
              if(!active){ return; }
              active = false;
              var dx = ev.clientX - startX;
              var dt = Math.max(1, Date.now() - startTime);
              var velocity = Math.abs(dx) / dt;
              if(dx <= -52 || (dx <= -32 && velocity > 0.5)){ closeSideSheet(true); }
            }, { passive: true });
            addCleanup(mobileRefs.sideSheet, 'pointercancel', function(){ active = false; }, { passive: true });
          })();

          (function setupBottomSheetSwipe(){
            var sheet = mobileRefs.bottomSheet;
            if(!sheet){ return; }
            var startY = 0;
            var startTime = 0;
            var dragging = false;
            var activePointerId = null;
            var sheetHeight = 0;
            var rafId = 0;
            var queuedOffset = 0;
            var settleTimer = null;

            function canStart(target){
              if(!target || !target.closest){ return false; }
              return !!target.closest('.ms-sheet-handle, .ms-sheet-header');
            }
            function clearSettleTimer(){
              if(!settleTimer){ return; }
              clearTimeout(settleTimer);
              settleTimer = null;
            }
            function queueTranslate(offset){
              queuedOffset = Math.max(0, offset || 0);
              if(rafId){ return; }
              rafId = requestAnimationFrame(function(){
                rafId = 0;
                sheet.style.transform = 'translate3d(0,' + queuedOffset.toFixed(1) + 'px,0)';
              });
            }
            function resetSheetTransform(){
              sheet.classList.remove('ms-sheet-dragging');
              sheet.style.removeProperty('will-change');
              sheet.style.removeProperty('transition');
              sheet.style.removeProperty('transform');
            }
            function beginDrag(clientY, pointerId){
              dragging = true;
              activePointerId = pointerId;
              startY = clientY;
              startTime = Date.now();
              sheetHeight = Math.max(1, Math.round(sheet.getBoundingClientRect().height || 0));
              clearSettleTimer();
              if(rafId){ cancelAnimationFrame(rafId); rafId = 0; }
              sheet.classList.add('ms-sheet-dragging');
              sheet.style.willChange = 'transform';
              sheet.style.transition = 'none';
              sheet.style.transform = 'translate3d(0,0,0)';
            }
            function settleAfter(durationMs){
              clearSettleTimer();
              settleTimer = setTimeout(function(){
                settleTimer = null;
                resetSheetTransform();
              }, durationMs);
            }
            function snapBack(){
              sheet.classList.remove('ms-sheet-dragging');
              sheet.style.removeProperty('will-change');
              sheet.style.transition = 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1)';
              sheet.style.transform = 'translate3d(0,0,0)';
              settleAfter(150);
            }
            function closeWithGesture(){
              sheet.classList.remove('ms-sheet-dragging');
              sheet.style.removeProperty('will-change');
              var closeDistance = Math.max(sheetHeight || 0, 180);
              sheet.style.transition = 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1)';
              sheet.style.transform = 'translate3d(0,' + closeDistance + 'px,0)';
              clearSettleTimer();
              settleTimer = setTimeout(function(){
                settleTimer = null;
                sheet.style.removeProperty('transition');
                closeBottomSheet();
              }, 170);
            }

            addCleanup(sheet, 'pointerdown', function(ev){
              if(!sheet.classList.contains('open')){ return; }
              if(ev.pointerType === 'mouse' && ev.button !== 0){ return; }
              if(!canStart(ev.target)){ return; }
              beginDrag(ev.clientY, ev.pointerId);
              try{ if(typeof sheet.setPointerCapture === 'function'){ sheet.setPointerCapture(ev.pointerId); } }catch(e){}
              if(ev.cancelable){ ev.preventDefault(); }
            }, { passive: false });

            addCleanup(sheet, 'pointermove', function(ev){
              if(!dragging){ return; }
              if(activePointerId !== null && ev.pointerId !== activePointerId){ return; }
              var dy = Math.max(0, ev.clientY - startY);
              queueTranslate(Math.min(dy, sheetHeight || dy));
              if(ev.cancelable){ ev.preventDefault(); }
            }, { passive: false });

            addCleanup(sheet, 'pointerup', function(ev){
              if(!dragging){ return; }
              if(activePointerId !== null && ev.pointerId !== activePointerId){ return; }
              dragging = false;
              try{ if(activePointerId !== null && typeof sheet.releasePointerCapture === 'function'){ sheet.releasePointerCapture(activePointerId); } }catch(e){}
              activePointerId = null;
              var dy = Math.max(0, ev.clientY - startY);
              var dt = Math.max(1, Date.now() - startTime);
              var velocity = dy / dt;
              var closeThreshold = Math.max(48, Math.round((sheetHeight || 0) / 3));
              if(dy >= closeThreshold || velocity > 0.7){ closeWithGesture(); }
              else { snapBack(); }
              if(ev.cancelable){ ev.preventDefault(); }
            }, { passive: false });

            addCleanup(sheet, 'pointercancel', function(ev){
              if(activePointerId !== null && ev.pointerId !== activePointerId){ return; }
              dragging = false;
              activePointerId = null;
              snapBack();
            }, { passive: true });

            addCleanup(sheet, 'touchmove', function(ev){
              if(!dragging){ return; }
              if(ev.cancelable){ ev.preventDefault(); }
            }, { passive: false });
          })();

          addCleanup(mobileRefs.sideSheet, 'keydown', function(ev){
            if(ev.key === 'Escape'){
              ev.preventDefault();
              closeSideSheet(true);
              return;
            }
            if(ev.key !== 'Tab'){ return; }
            var focusables = Array.prototype.slice.call(mobileRefs.sideSheet.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')).filter(function(el){
              return !el.disabled && el.getAttribute('aria-hidden') !== 'true';
            });
            if(!focusables.length){
              ev.preventDefault();
              return;
            }
            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if(ev.shiftKey && document.activeElement === first){
              ev.preventDefault();
              last.focus();
            } else if(!ev.shiftKey && document.activeElement === last){
              ev.preventDefault();
              first.focus();
            }
          });

          addCleanup(document, 'keydown', function(ev){
            if(ev.key === 'Escape' && mobileRefs && mobileRefs.sideSheet.classList.contains('is-open')){
              closeSideSheet(true);
            }
            if(ev.key === 'Escape' && mobileRefs && mobileRefs.bottomSheet && mobileRefs.bottomSheet.classList.contains('open')){
              closeBottomSheet();
            }
            if(ev.key === 'Escape' && mobileRefs && mobileRefs.basemapModal && !mobileRefs.basemapModal.classList.contains('ms-hidden')){
              closeBasemapModal(true);
            }
            if(ev.key === 'Escape' && mobileRefs && mobileRefs.placeholderModal && !mobileRefs.placeholderModal.classList.contains('ms-hidden')){
              closePlaceholder();
            }
          });

          if(mobileRefs.placeholderClose){
            addCleanup(mobileRefs.placeholderClose, 'click', function(){ closePlaceholder(); });
          }
          if(mobileRefs.placeholderModal){
            addCleanup(mobileRefs.placeholderModal, 'click', function(ev){ if(ev.target === mobileRefs.placeholderModal){ closePlaceholder(); } });
          }
          if(mobileRefs.basemapApply){
            addCleanup(mobileRefs.basemapApply, 'click', function(){ applyBasemapSelectionFromModal(); });
          }
          if(mobileRefs.basemapCancel){
            addCleanup(mobileRefs.basemapCancel, 'click', function(){ closeBasemapModal(true); });
          }
          if(mobileRefs.basemapClose){
            addCleanup(mobileRefs.basemapClose, 'click', function(){ closeBasemapModal(true); });
          }
          if(mobileRefs.basemapModal){
            addCleanup(mobileRefs.basemapModal, 'click', function(ev){ if(ev.target === mobileRefs.basemapModal){ closeBasemapModal(true); } });
          }
          if(mobileRefs.basemapForm){
            addCleanup(mobileRefs.basemapForm, 'submit', function(ev){
              if(ev && ev.preventDefault){ ev.preventDefault(); }
              applyBasemapSelectionFromModal();
            });
          }

          addCleanup(mobileRefs.sideSheet, 'click', function(ev){
            var item = ev.target && ev.target.closest ? ev.target.closest('[data-ms-nav-action]') : null;
            if(!item){ return; }
            var action = item.getAttribute('data-ms-nav-action');
            if(action === 'filter'){
              closeSideSheet(false);
              openBottomSheet();
              return;
            }
            if(action === 'share'){
              closeSideSheet(false);
              shareCurrentMap();
              return;
            }
            if(action === 'info'){
              openInfoModalFromMobile();
              return;
            }
            if(action === 'about-app'){
              openAboutAppInfo();
              return;
            }
            if(action === 'feedback'){
              closeMobileTransientOverlays({ forceShowControl: true });
              try{ window.location.href = FEEDBACK_MAILTO; }catch(e){}
              return;
            }
            if(action === 'contact'){
              openContactLink();
              return;
            }
            if(action === 'legal-terms'){
              openPlaceholder('Nutzungsbedingungen', 'Nutzungsbedingungen werden derzeit vorbereitet.');
              return;
            }
            if(action === 'legal-combined'){
              closeSideSheet(false);
              return;
            }
          });

          addCleanup(document, 'change', function(ev){
            if(!mobileRefs || !ev || !ev.target){ return; }
            if(ev.target.classList && (ev.target.classList.contains('ms-filter-species') || ev.target.classList.contains('ms-filter-status'))){
              updateFilterFabIndicator();
              return;
            }
            if(/^ms-(species|status)-all/.test(ev.target.id || '')){ updateFilterFabIndicator(); }
          });

          if(mobileRefs.bottomSheet && typeof MutationObserver !== 'undefined'){
            sideSheetObserver = new MutationObserver(syncFabStackVisibility);
            sideSheetObserver.observe(mobileRefs.bottomSheet, { attributes: true, attributeFilter: ['class'] });
          }
        }

        function mountMobileUi(){
          if(mobileMounted || !isMobile){ return; }
          removeLegacyHeaderIfPresent();
          ensureMobileRedesignDom();
          mobileRefs = collectRefs();
          if(!mobileRefs.header || !mobileRefs.standNode || !mobileRefs.navToggle || !mobileRefs.sideSheet || !mobileRefs.sideBackdrop || !mobileRefs.layerFab || !mobileRefs.filterFab || !mobileRefs.bottomSheet || !mobileRefs.basemapModal){
            mobileRefs = null;
            return;
          }
          document.body.classList.add('ms-mobile-redesign');
          setDesktopControlVisibility();
          mobileRefs.standNode.textContent = extractStandText(mobileRefs.header);
          removeBottomSheetExtraActions();
          bindMobileEvents();
          syncFabStackVisibility();
          updateFilterFabIndicator();
          syncHeaderLayeringOverModals();
          mobileMounted = true;
          safeInvalidateMap();
        }

        function unmountMobileUi(){
          runCleanup();
          removeMobileRedesignDom();
          document.body.classList.remove('ms-mobile-redesign');
          document.body.classList.remove('ms-side-open');
          mobileRefs = null;
          mobileMounted = false;
          setDesktopControlVisibility();
          safeInvalidateMap();
        }

        function teardownDesktop(){
          if(MS.map && MS.locateControl && typeof MS.map.removeControl === 'function'){
            try{ MS.map.removeControl(MS.locateControl); }catch(e){}
          }
          MS.locateControl = null;
        }

        function initDesktop(){
          setDesktopControlVisibility();
          addLocateMapControl();
          if(MS.map && MS.map.zoomControl && typeof MS.map.addControl === 'function'){
            try{ MS.map.addControl(MS.map.zoomControl); }catch(e){}
          }
          bindMarkersForViewportMode();
        }

        function teardownMobile(){
          if(mobileMounted || document.getElementById('ms-mobile-root')){ unmountMobileUi(); }
        }

        function initMobile(){
          mountMobileUi();
          removeNativeMapControlsOnMobile();
          bindMarkersForViewportMode();
        }

        function applyViewportGate(){
          isMobile = !!(MS_MOBILE_MEDIA ? MS_MOBILE_MEDIA.matches : (window.innerWidth <= MOBILE_MAX_WIDTH));
          try{ window.isMobile = isMobile; }catch(e){}
          removeLegacyHeaderIfPresent();
          if(isMobile === true){
            initMobile();
            teardownDesktop();
          } else {
            initDesktop();
            teardownMobile();
          }
          safeInvalidateMap();
        }

        applyViewportGate();
        if(MS_MOBILE_MEDIA){
          if(typeof MS_MOBILE_MEDIA.addEventListener === 'function'){
            MS_MOBILE_MEDIA.addEventListener('change', applyViewportGate);
          } else if(typeof MS_MOBILE_MEDIA.addListener === 'function'){
            MS_MOBILE_MEDIA.addListener(applyViewportGate);
          }
        }
        window.addEventListener('resize', applyViewportGate, { passive: true });
        window.addEventListener('orientationchange', function(){
          applyViewportGate();
          safeInvalidateMap();
        }, { passive: true });
      })();

      // initial pass
      resolveMapAndCluster(function(map, cluster){
        MS.map = map;
        MS.cluster = cluster;
        try{
          if(MS.map && MS.map.options){ MS.map.options.closePopupOnClick = false; }
        }catch(e){}
        initBasemapRuntime();
        initMarkers();
        bindMarkersForViewportMode();
        removeNativeMapControlsOnMobile();
        addLocateMapControl();
        window.addEventListener('resize', function(){
          removeNativeMapControlsOnMobile();
          addLocateMapControl();
        }, { passive: true });
        if(MS.map && typeof MS.map.on === 'function'){
          MS.map.on('popupopen', function(e){
            try{
              if(e && e.popup){
                var popupContentNode = (typeof e.popup.getContent === 'function') ? e.popup.getContent() : null;
                if(popupContentNode && popupContentNode.nodeType === 1){ hardenDatabaseLinksInScope(popupContentNode); }
                var popupNode = null;
                if(typeof e.popup.getElement === 'function'){ popupNode = e.popup.getElement(); }
                if(!popupNode && e.popup._container){ popupNode = e.popup._container; }
                if(popupNode){ hardenDatabaseLinksInScope(popupNode); }
              }
            }catch(linkErr){}
            if(isMobile){
              try{
                if(MS.map && typeof MS.map.closePopup === 'function'){ MS.map.closePopup(); }
                if(e && e.popup && e.popup._source){ openMarkerDetailsModalFromMarker(e.popup._source); }
              }catch(err){}
              MS.popupVisible = false;
              syncMobileControlVisibility();
              return;
            }
            MS.popupVisible = true; syncMobileControlVisibility();
            try{
              if(e && e.popup && e.popup.options){
                e.popup.options.closeOnClick = false;
                e.popup.options.autoClose = false;
              }
              var popupEl = null;
              if(e && e.popup){
                if(typeof e.popup.getElement === 'function'){ popupEl = e.popup.getElement(); }
                else if(e.popup._container){ popupEl = e.popup._container; }
              }
              if(!popupEl){ popupEl = document.querySelector('.leaflet-popup'); }
              if(popupEl){ hardenDatabaseLinksInScope(popupEl); }
              var viewportH = 0;
              try{
                viewportH = (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : (window.innerHeight || document.documentElement.clientHeight || 0);
              }catch(err){ viewportH = (window.innerHeight || 0); }
              if(popupEl && viewportH > 0){
                var popupWrapper = popupEl.querySelector('.leaflet-popup-content-wrapper');
                var popupContent = popupEl.querySelector('.leaflet-popup-content');
                var wrapperMax = Math.max(180, Math.floor(viewportH * 0.78));
                var contentMax = Math.max(140, Math.floor(viewportH * 0.66));
                if(popupWrapper){
                  popupWrapper.style.maxHeight = wrapperMax + 'px';
                  popupWrapper.style.overflow = 'hidden';
                }
                if(popupContent){
                  popupContent.style.maxHeight = contentMax + 'px';
                  popupContent.style.overflowY = 'auto';
                  popupContent.style.overflowX = 'hidden';
                  popupContent.style.webkitOverflowScrolling = 'touch';
                  popupContent.style.overscrollBehavior = 'contain';
                  popupContent.style.touchAction = 'pan-y';
                }
              }
              if(popupEl && window.L && L.DomEvent){
                try{ L.DomEvent.disableClickPropagation(popupEl); }catch(err){}
                try{ L.DomEvent.disableScrollPropagation(popupEl); }catch(err){}
              }
              if(popupEl){
                ['touchstart','touchmove','touchend','pointerdown','pointermove','wheel'].forEach(function(evName){
                  try{ popupEl.addEventListener(evName, function(ev){ ev.stopPropagation(); }, { passive: false }); }catch(err){}
                });
              }
            }catch(err){}
          });
          MS.map.on('popupclose', function(){ MS.popupVisible = false; setTimeout(syncMobileControlVisibility, 0); });
          MS.map.on('click', function(ev){
            try{
              var target = ev && ev.originalEvent ? ev.originalEvent.target : null;
              if(!target){ return; }
              if(target.closest && target.closest('.leaflet-popup')){ return; }
              if(target.closest && target.closest('.leaflet-container')){
                if(MS.map && typeof MS.map.closePopup === 'function'){ MS.map.closePopup(); }
              }
            }catch(err){}
            setTimeout(function(){
              if(!document.querySelector('.leaflet-popup-pane .leaflet-popup')){
                MS.popupVisible = false;
                syncMobileControlVisibility();
              }
            }, 0);
          });
        }
        syncMobileControlVisibility();
        autoLocateOnMobile();
      });
      buildFilters();
      wireFilters();
      setTimeout(function(){ var selectedSpecies = Object.keys(SPECIES_COLORS_JS); var selectedStatus = Object.keys(STATUS_INFO_JS); rebuildCluster(selectedSpecies, selectedStatus); }, 250);
    })();
