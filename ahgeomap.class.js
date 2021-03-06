/** 
 * wrapping class for a simple google map.<br />
 * I want to use it to point cities in my diashows http://www.axel-hahn.de/diashows/<br />
 * see
 * 
 * getter: https://developers.google.com/maps/documentation/javascript/reference<br />
 * events: https://developers.google.com/maps/documentation/javascript/events<br />
 * 
 * 
 * 
 * <br />
 * PROJECT HOME: <a href="http://www.axel-hahn.de/projects/javascript/ahgeomap/"       target="_blank">http://www.axel-hahn.de/projects/javascript/ahgeomap/</a><br />
 * DOC:          <a href="http://www.axel-hahn.de/docs/ahgeomap/index.htm" target="_blank">http://www.axel-hahn.de/docs/ahgeomap/index.htm</a><br />
 * SOURCE:       <a href="https://github.com/axelhahn/ahgeomap"            target="_blank">https://github.com/axelhahn/ahgeomap</a><br />
 * DEMO:         <a href="http://www.axel-hahn.de/demos/geolocation-maps/" target="_blank">http://www.axel-hahn.de/demos/geolocation-maps/</a><br />
 * <br />
 * 
 * @author    Axel Hahn
 * @version   0.9
 *
 * @this {ahgeomap}
 * 
 * @constructor
 * 
 * @example
 * &lt;div id="divmap">&lt;/div>
 * (...)
 * &lt;script>
 *   var oMap=new ahgeomap("divmap");
 * &lt;/script>
 * 
 * @param {string} sDivname - id of an existing div
 * @param {object} aOptions - map options to override (optional)
 * @return none
 */
var ahgeomap = function (sDivname, aOptions) {

    // ----------------------------------------------------------------------
    // internal variables
    // ----------------------------------------------------------------------

    this._oDivMap = false; 	  // div object of the map

    this._userPosition = false;   // user pos (return from navigator.geolocation.getCurrentPosition)

    this._aMapOptions = {
        zoom: 3,
        latitude: 0,
        longitude: 0,
        mapTypeId: google.maps.MapTypeId.ROADMAP, // one of HYBRID | ROADMAP | SATTELITE | TERRAIN
        mapTypeControl: false,
        panControl: true,
        panControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        zoomControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: false,
        streetViewControl: false,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        }
        
    };

    // helper object .. store elements to be handled if the user position is known
    // see this.addLineFromHomeToTarget()
    this._aWaitForUserPos = {};
    
    // map object ... will be initialized in this.showMap()
    this._map = false;


    // ----------------------------------------------------------------------
    // 
    // set options
    // 
    // ----------------------------------------------------------------------

    /**
     * set options and override defaults of see this._aMapOptions
     * @param {object} aOptions  map options
     * @returns {Boolean}
     */
    this.setOptions = function (aOptions) {
        if (aOptions) {
            for (var s in this._aMapOptions) {
                if (aOptions[s]) {
                    this._aMapOptions[s] = aOptions[s];
                }
            }
        }
        return true;
    };


    // ----------------------------------------------------------------------
    // 
    // position functions
    // 
    // ----------------------------------------------------------------------

    /**
     * get current position and fill it into internal position vars;
     * function returns return success of navigator.geolocation.getCurrentPosition
     * @returns {boolean}
     */
    this.getCurrentPosition = function () {

        if (navigator.geolocation) {

            var that = this;
            return navigator.geolocation.getCurrentPosition(function (position) {
                that.setAsHomePos(position);
                return true;
                },
                function (error) {
                    switch (error.code) {
                        case error.PERMISSION_DENIED :
                            alert("Error. PERMISSION_DENIED");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            alert("Error. POSITION_UNAVAILABLE");
                            break;
                        case error.TIMEOUT:
                            alert("Error. TIMEOUT");
                            break;
                        default:
                            alert("unknown error code");
                    }
                },
                {maximumAge: 60000, timeout: 5000, enableHighAccuracy: false}
            );
        }
        return false;
    };


    /**
     * get the position of the user (this returns the saved position of 
     * getCurrentPosition()
     * @returns {object}
     */
    this.getHomePosition = function () {
        return this._userPosition;
    };


    /**
     * set home position; callback of navigator.geolocation.getCurrentPosition
     * in this.getCurrentPosition
     * @param {object} position   position object
     * @returns {Boolean}
     */
    this.setAsHomePos = function (position) {
        this._userPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        if (this._aWaitForUserPos['line']) {
            var aLines=this._aWaitForUserPos['line'];
            for(var i=0; i<aLines.length; i++){
                this.addLineFromHomeToTarget(aLines[i]['lat'], aLines[i]['lng']);
            }
        }
        return this.setPos(position);
    };


    /**
     * move map to users position
     * @returns {Boolean}
     */
    this.setHomePosition = function () {
        if (!this._userPosition) {
            return false;
        }
        return this.setPosition(this._userPosition['lat'], this._userPosition['lng']);
    };


    /**
     * move map to a new position with a given position object
     * @param {object} position   position object
     * @returns {Boolean}
     */
    this.setPos = function (position) {
        return this.setPosition(position.coords.latitude, position.coords.longitude);
    };


    /**
     * move map to a new position by given coordinates 
     * @param {float} fLat   latitude
     * @param {float} fLong  longitude
     * @param {type} iZoom   zoom level
     * @returns {Boolean}
     */
    this.setPosition = function (fLat, fLong, iZoom) {
        this._aMapOptions['latitude'] = fLat;
        this._aMapOptions['longitude'] = fLong;
        if (iZoom) {
            this.setZoom(iZoom, false);
        } else {
            this.setZoom(this.getMapZoom());
        }
        this.showMap();
        return true;
    };

    // ----------------------------------------------------------------------
    // 
    // map functions
    // 
    // ----------------------------------------------------------------------


    /**
     * get the position displayed at the center of the map. Note that this LatLng object is not wrapped.
     * @returns {position}
     */
    this.getMapCenter = function () {
        return this._map.getCenter();
    };


    /**
     * get zoom level of the visible map
     * @returns {Integer}
     */
    this.getMapZoom = function () {
        return this._map.getZoom();
    };


    /**
     * add a listener to the map ... then you can react on changes like zoom,
     * movement or events like mousemove, clicks etc.
     * @see available events https://developers.google.com/maps/documentation/javascript/events
     * @param {string}   name of the event you want to listen 
     * @param {function} sFunction
     * @returns {Boolean}
     */
    this.addMapListener = function (sEvent, sFunction){
        return this._map.addListener(sEvent, function () {
            eval(sFunction);
        });
    };


    /**
     * initialize and draw a map
     * @returns {undefined}
     */
    this.showMap = function () {
        if (this._map) {
            return this.updateMap();
        }

        var latlng = new google.maps.LatLng(this._aMapOptions['latitude'], this._aMapOptions['longitude']);
        this._aMapOptions['center'] = latlng;

        this._map = new google.maps.Map(this._oDivMap, this._aMapOptions);

        // add Listers...
        /*
        if (this._aListeners){
            for (var sEvent in this._aListeners){
                if (this._aListeners[sEvent]){
                    this.addMapListener(sEvent, this._aListeners[sEvent]);
                }
            };
        };
        */
    };


    /**
     * update existing, visible map: move to given poition; set zoom
     * https://developers.google.com/maps/documentation/javascript/reference#Map
     * @returns {undefined}
     */
    this.updateMap = function () {
        var latlng = new google.maps.LatLng(this._aMapOptions['latitude'], this._aMapOptions['longitude']);
        this._aMapOptions['center'] = latlng;
        this._map.setZoom(this._aMapOptions['zoom']);
        // this._map.panTo(latlng);
        this._map.setCenter(latlng);
    };


    /**
     * set zoomlevel of a map
     * @param {integer} iZoom       zoomlevel: 1=far .. 15=close
     * @param {bool}    bUpdateMap  update map; default = false
     * @returns {Boolean}
     */
    this.setZoom = function (iZoom, bUpdateMap) {
        this._aMapOptions['zoom'] = iZoom;
        if (!bUpdateMap === false) {
            this.updateMap();
        }
        return true;
    };


    /**
     * set a marker icon
     * @param {string} title  title
     * @param {float}  lat    position - latitude
     * @param {float}  lng    position - longitude
     * @param {string} sDescr  more text
     * @returns {undefined}
     */
    this.addMarker = function (title, lat, lng, sDescr) {
        if (!lat || !lng) {
            lat = this._aMapOptions['latitude'];
            lng = this._aMapOptions['longitude'];
        }
        var latlng = new google.maps.LatLng(lat, lng);

        var marker = new google.maps.Marker({
            position: latlng,
            map: this._map,
            title: title
        });
        if (!sDescr) {
            sDescr=title;
        }
        if (sDescr) {
            var infowindow = new google.maps.InfoWindow({
                content: sDescr
            });
            marker.addListener('click', function () {
                infowindow.open(this._map, marker);
            });
        }

    };
    
    /**
     * set a marker icon on users position
     * @param {string} title   title
     * @param {string} sDescr  more text
     * @returns {undefined}
     */
    this.addMarkerOnHome = function (title, sDescr) {
        if (!title){
            title="Your are here.";
        }
        return this.addMarker(title, this._userPosition['lat'], this._userPosition['lng'], sDescr);
    };


    /**
     * draw a line from users position to target
     * @param {float}  lat    position - latitude
     * @param {float}  lng    position - longitude
     * @returns {undefined}
     */
    this.addLineFromHomeToTarget = function (lat, lng) {
        // Define a symbol using a predefined path (an arrow)
        // supplied by the Google Maps JavaScript API.
        /*
        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };
        */
        if (!this._userPosition) {
            if (!this._aWaitForUserPos['line']) {
                this._aWaitForUserPos['line'] = [];
            }
            this._aWaitForUserPos['line'].push({lat: lat, lng: lng});
            return false;
        }

        // Create the polyline and add the symbol via the 'icons' property.
        var line = new google.maps.Polyline({
            path: [this._userPosition, {lat: lat, lng: lng}],
            icons: [{
                    // icon: lineSymbol,
                    offset: '100%'
                }],
            strokeColor: '#333399',
            strokeOpacity: 0.7,
            strokeWeight: 2,
            map: this._map
        });

    };

    // ----------------------------------------------------------------------
    // init object
    // ----------------------------------------------------------------------
    if (!sDivname) {
        return false;
    };

    if (aOptions) {
        this.setOptions(aOptions);
    };

    this._oDivMap = document.getElementById(sDivname);
    if (!this._oDivMap) {
        return false;
    };

};