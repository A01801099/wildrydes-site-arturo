/*global WildRydes _config L */

var WildRydes = window.WildRydes || {};

(function ($) {
    var map;
    var markerLayer;
    var selectedPickup = null;

    function initMap() {
        map = L.map('map').setView([37.7749, -122.4194], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);

        map.on('click', function (e) {
            selectedPickup = e.latlng;
            markerLayer.clearLayers();
            L.marker(selectedPickup).addTo(markerLayer);
            $('#request-button').prop('disabled', false);
            $('#pickup-display').text('Lat: ' + selectedPickup.lat.toFixed(5) + ', Lng: ' + selectedPickup.lng.toFixed(5));
        });
    }

    function requestUnicorn(pickupLocation) {
        WildRydes.authToken.then(function (token) {
            if (!token) {
                alert('You are not logged in. Please sign in first.');
                window.location.href = '/signin.html';
                return;
            }

            if (!_config.api.invokeUrl) {
                alert('API not configured. Please update js/config.js with your API Gateway URL.');
                return;
            }

            $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/ride',
                headers: {
                    Authorization: token
                },
                data: JSON.stringify({
                    PickupLocation: {
                        Latitude: pickupLocation.lat,
                        Longitude: pickupLocation.lng
                    }
                }),
                contentType: 'application/json',
                success: completeRequest,
                error: function ajaxError(jqXHR, textStatus, errorThrown) {
                    console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                    console.error('Response: ', jqXHR.responseText);
                    alert('An error occurred when requesting your unicorn:\n' + jqXHR.responseText);
                }
            });
        });
    }

    function completeRequest(data) {
        console.log('Ride request complete:', data);
        var unicorn = data.Unicorn;
        var html = '<div class="unicorn-result">' +
            '<h3>🦄 Your unicorn is on the way!</h3>' +
            '<p><strong>Name:</strong> ' + unicorn.Name + '</p>' +
            '<p><strong>Color:</strong> ' + unicorn.Color + '</p>' +
            '<p><strong>Gender:</strong> ' + unicorn.Gender + '</p>' +
            '<p><strong>Ride ID:</strong> ' + data.RideId + '</p>' +
            '</div>';
        $('#result-panel').html(html).show();
        $('#request-button').prop('disabled', true);
    }

    $(function onDocReady() {
        $('#signOut').click(function () {
            WildRydes.signOut();
            alert('You have been signed out.');
            window.location.href = '/index.html';
        });

        $('#request-button').click(function () {
            if (!selectedPickup) {
                alert('Please select a pickup location on the map first.');
                return;
            }
            $('#result-panel').hide();
            requestUnicorn(selectedPickup);
        });

        WildRydes.authToken.then(function (token) {
            if (!token) {
                window.location.href = '/signin.html';
            }
        }).catch(function () {
            window.location.href = '/signin.html';
        });

        initMap();
    });
}(jQuery));
