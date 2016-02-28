/** 
 * wrapping clas for a simple google map.<br />
 * I want to use it to point cities in my diashows http://www.axel-hahn.de/diashows/.<br />
 * see https://developers.google.com/maps/documentation/javascript/reference
 * 
 * <br />
 * PROJECT HOME: <a href="http://sourceforge.net/projects/ahgeomap/"       target="_blank">http://sourceforge.net/projects/ahgeomap/</a><br />
 * DOC:          <a href="http://www.axel-hahn.de/docs/ahgeomap/index.htm" target="_blank">http://www.axel-hahn.de/docs/ahgeomap/index.htm</a><br />
 * SOURCE:       https://github.com/axelhahn/ahgeomap
 * DEMO:         http://www.axel-hahn.de/demos/geolocation-maps/
 * <br />
 * 
 * @author    Axel Hahn
 * @version   0.01
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

    this._userPosition = false;   // user pos (by navigator.geolocation.getCurrentPosition)

    this._aMapOptions = {
        zoom: 3,
        latitude: 0,
        longitude: 0,
        // mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        // mapTypeId: google.maps.MapTypeId.TERRAIN,
        // mapTypeId: google.maps.MapTypeId.SATTELITE,
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

    this._map = false;


    // ----------------------------------------------------------------------
    // 
    // set options
    // 
    // ----------------------------------------------------------------------

    /**
     * set options and override defaults of _aMapOptions
     * @param {object} aOptions
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
        this._aMapOptions['latitude'] = false;
        this._aMapOptions['longitude'] = false;

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
            return false;
        }
        return false;
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
     * move map to a new position
     * @param {object} position   position object
     * @returns {Boolean}
     */
    this.setPos = function (position) {
        return this.setPosition(position.coords.latitude, position.coords.longitude);
    };

    /**
     * move map to a new position
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

        // Show the lat and lng under the mouse cursor.
        var coordsDiv = document.getElementById('coords');
        if (coordsDiv){
            this._map.controls[google.maps.ControlPosition.TOP_CENTER].push(coordsDiv);
            this._map.addListener('mousemove', function (event) {
                coordsDiv.textContent =
                        'lat: ' + Math.round(event.latLng.lat()) + ', ' +
                        'lng: ' + Math.round(event.latLng.lng());
            });
        }

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
        this._map.panTo(latlng);
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
     * @param {float}  lon    position - longitude
     * @returns {undefined}
     */
    this.addMarker = function (title, lat, lon, sDescr) {
        if (!lat || !lon) {
            lat = this._aMapOptions['latitude'];
            lon = this._aMapOptions['longitude'];
        }
        var latlng = new google.maps.LatLng(lat, lon);

        var marker = new google.maps.Marker({
            position: latlng,
            map: this._map,
            title: title
        });
        if (sDescr) {
            var infowindow = new google.maps.InfoWindow({
                content: sDescr
            });
            marker.addListener('click', function () {
                infowindow.open(this._map, marker);
            });
        }
        // marker.setMap(this._map);

    };

    /**
     * draw a line from users position to target
     * @param {float}  lat    position - latitude
     * @param {float}  lon    position - longitude
     * @returns {undefined}
     */
    this.addLineFromHomeToTarget = function (lat, lon) {
        // Define a symbol using a predefined path (an arrow)
        // supplied by the Google Maps JavaScript API.
        /*
        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };
        */

        // Create the polyline and add the symbol via the 'icons' property.
        var line = new google.maps.Polyline({
            path: [this._userPosition, {lat: lat, lng: lon}],
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