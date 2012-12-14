function onBodyLoad() {
	document.addEventListener("deviceready", onDeviceReady, false);
}

var watchID = null;
var lng,lat,deviceID;

function onDeviceReady() {
	
	deviceID = device.uuid;
	navigator.geolocation.watchPosition(setLatLng, onFail, {enableHighAccuracy: true});

	$( document ).delegate("#plant", "pageinit", function() {
		
		
		$.ajax({
		  type: "GET",
		  dataType: "JSON",
		  url: "http://api.chasemoody.com/acl/users/"+deviceID,
		  success: function(data){
		  	console.log(data);
		  	if(data === false){
		  		addUUID();
		  	}else{
		  		console.log('Exists');
		  	}
		  }
		});
		
		$('.planFunc').click(function(){
			plantFlag();
		});
	});
	
	$( document ).delegate("#map", "pageinit", function() {
		
		/*var data = [
		  ['Person 1', 30.268167, -97.768839, 4],
		  ['Person 2', 30.268093, -97.767444, 5],
		  ['Chase', 30.267148, -97.76826, 3],
		  ['Isaac', 30.267129, -97.764269, 2],
		  ['Ashley', 30.267833, -97.769161, 1]
		];
		
		mapAllLoc(data);
		*/
		
		$.ajax({
		  type: "GET",
		  dataType: "JSON",
		  url: "http://api.chasemoody.com/acl/flags",
		  success: function(data){
		  	mapAllLoc(data);
		  }
		});
		
	});
	
	$( document ).delegate("#info", "pageinit", function() {
		$('.latlng').empty().append('<p>Lat: ' + lat + '</p><p>Lng: ' + lng + '</p>');
		$('.device').empty().append('Device Name: '     + device.name     + '<br />' + 
                            'Device PhoneGap: ' + device.phonegap + '<br />' + 
                            'Device Platform: ' + device.platform + '<br />' + 
                            'Device UUID: '     + device.uuid     + '<br />' + 
                            'Device Version: '  + device.version  + '<br />');
	});
	
	$( document ).delegate("#feedback", "pageinit", function() {
		$('.submit_comment').click(function(){
			
			$.ajax({
			  type: "POST",
			  contentType: 'application/json',
			  dataType: "json",
        	  data: formToJSONComment(),
			  url: "http://api.chasemoody.com/acl/comment",
			  beforeSend: function() {
			    $('#comment_form').empty().append('<center><img src="assets/img/ajax-loader.gif"/></center>');
			  },
			  success: function(){
			  	$('#comment_form').empty().append('<p>Thank you for your feedback.');
			  }
			});
			
		});
	});
}

function setLatLng(position){
	lng = position.coords.longitude;
	lat = position.coords.latitude;
}

/* Initialize Map */
function mapAllLoc(data){
	var aclCenter = new google.maps.LatLng(30.268167, -97.768839);
	
	var mapOptions = {
      center: aclCenter,
      zoom: 14, //Change zoom for more of city to test out this week
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    var map = new google.maps.Map(document.getElementById('map_holder'),mapOptions);
	
	function infoCallback(infowindow, marker) { 
		  return function() {
		    infowindow.open(map, marker);
		  };
    }
	
    for (var i = 0; i < data.length; i++) {
    	var loc = data[i];
    	var myLatLng = new google.maps.LatLng(loc["Lat"], loc["Lng"]);
	    var marker = new google.maps.Marker({
	        position: myLatLng,
	        animation: google.maps.Animation.DROP,
	        map: map,
	        title: loc["name"]
	    });
	    
	    var contentString = "Name: "+loc["name"]+"<br/>Lat: "+loc["Lat"]+"<br/>Lng: "+loc["Lng"]
	    +"<br/>Timestamp: "+loc["timestamp"]+"<br/>Comment: "+loc["comment"];
		
		/*google.maps.event.addListener(marker, 'click', function() {
		  infowindow.setContent(contentString);
		  infowindow.open(map, marker);
		});*/
		
		var infowindow = new google.maps.InfoWindow();
        infowindow.setContent(contentString);
	      google.maps.event.addListener(
	        marker, 
	        'click', 
	        infoCallback(infowindow, marker)
	      );
          
	}
	
	var curentLatLng = function(position, map) {
		var current = new google.maps.LatLng(position.coords.longitude, position.coords.latitude);
		
		var centermarker = new google.maps.Marker({
	        position: current,
	        animation: google.maps.Animation.DROP,
	        map: map,
	        icon: {
			    path: google.maps.SymbolPath.CIRCLE,
			    scale: 10
			  },
	        title: "This is you!"
	    });
	};
	
	navigator.geolocation.watchPosition(curentLatLng, onFail,{enableHighAccuracy: true});
}

function plantFlag(){
	// Ajax POST using addUID on fail plant flag
	var comment = $('#plantComment').val();
	
	$.ajax({
	  type: "POST",
	  contentType: 'application/json',
	  dataType: "json",
      data: formToJSONLatLng(comment),
	  url: "http://api.chasemoody.com/acl/plant",
	  beforeSend: function() {
		$('.geoContainer').empty().append('<center><img src="assets/img/ajax-loader.gif"/></center>');
	  },
	  success: function(data){
	  	console.log(data);
	  	$('#plantComment').val('');
	  	$('.geoContainer').empty().append('<p>Flag Planted</p><p>Lat: '+data['Lat']+'</p><p>Lng: '+data['Lng']+'</p>');
	  }
	});
	
}

// clear the watch that was started earlier
function clearWatch() {
    if (watchID != null) {
        navigator.geolocation.clearWatch(watchID);
        watchID = null;
    }
}

// Called if something bad happens.
function onFail(message) {
  alert('Failed because: ' + message);
}

// Helper function to serialize all the form fields into a JSON string
function formToJSONComment() {
    return JSON.stringify({
        "UDID": deviceID,
        "comment": $('#comment').val()
        });
}

function formToJSONLatLng(comment) {
	/*console.log('UDID: '+deviceID);
	console.log('Lat: '+lat);
	console.log('Lng: '+lng);*/
    return JSON.stringify({
        "UDID": deviceID,
        "Lat": lat,
        "Lng": lng,
        "comment": comment
        });
}

function addUUID(){
	$.ajax({
	  type: "POST",
	  contentType: 'application/json',
	  dataType: "json",
	  data: formToJSONDevice(),
	  url: "http://api.chasemoody.com/acl/device",
	  success: function(){
	  	console.log('Device Added');
	  }
	});
}

function formToJSONDevice(){
	return JSON.stringify({
		"name": device.name,
		"UDID": deviceID
	});
}

// document.addEventListener("pause", yourCallbackFunction, false); //Use this to disconnect geo
