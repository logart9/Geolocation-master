var ff = {
	
	watchID: null,
	deviceID: null,
	lng: null,
	lat: null,
	aclCenter: new google.maps.LatLng(30.268167, -97.768839),
	
    init: function() {
        this.bindEvents();
    },
   
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener("pause", this.clearWatch, false);
        document.addEventListener('resume', this.onDeviceReady, false);
    },

	onDeviceReady: function(){
		ff.deviceID = device.uuid;
		navigator.geolocation.watchPosition(ff.setCoords, ff.onFail, {enableHighAccuracy: true});
		
		/*********************
		 * Init Views
		 *********************/
		$( document ).delegate("#plantFlag", "pageinit", function(){ff.plantFlag()});
		$( document ).delegate("#mapAllFriends", "pageinit", function(){ff.mapAllFriends()});
		$( document ).delegate("#info", "pageinit", function(){ff.deviceInfo()});
		$( document ).delegate("#sendComment", "pageinit", function(){ff.sendComment()});
	
	},
	
	/*********************
	 * Page Functions
	 *********************/
	plantFlag: function(){

		$('.setFlag').click(function(){
			ff.postCoords();
		});
		
	},
	
	mapAllFriends: function(){
		$.ajax({
		  type: "GET",
		  dataType: "JSON",
		  url: "http://api.chasemoody.com/acl/flags",
		  success: function(data){
		  	ff.pinOnMap(data);
		  }
		});
	},
	
	deviceInfo: function(){
		
		$('.latlng').empty().append('<p>Lat: ' + ff.lat + '</p><p>Lng: ' + ff.lng + '</p>');
		$('.device').empty().append('Device Name: '     + device.name     + '<br />' + 
                            'Device PhoneGap: ' + device.phonegap + '<br />' + 
                            'Device Platform: ' + device.platform + '<br />' + 
                            'Device UUID: '     + device.uuid     + '<br />' + 
                            'Device Version: '  + device.version  + '<br />');
		
	},
	
	sendComment: function(){
		$('.submit_comment').click(function(){
			ff.postComment();
		});
	},
	
	/*********************
	 * Helpers
	 *********************/
	pinOnMap: function(data){
		
		var mapOptions = {
	      center: ff.aclCenter,
	      zoom: 14,
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
			
			var infowindow = new google.maps.InfoWindow();
	        infowindow.setContent(contentString);
		      google.maps.event.addListener(
		        marker, 
		        'click', 
		        infoCallback(infowindow, marker)
		      );
	          
		}
		
	},
	
	pinYourLocation: function(){
		
		var current = new google.maps.LatLng(ff.lng, ff.lat);
		
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
		
	},
	
	setCoords: function(position){
		
		ff.lng = position.coords.longitude;
		ff.lat = position.coords.latitude;
		
	},
	
	postCoords: function(){
		
		// Ajax POST using addUID on fail plant flag
		var comment = $('#plantComment').val();
		
		var jsonData = JSON.stringify({
			        "UDID": ff.deviceID,
			        "Lat": ff.lat,
			        "Lng": ff.lng,
			        "comment": comment
			        });
		
		$.ajax({
		  type: "POST",
		  contentType: 'application/json',
		  dataType: "json",
	      data: jsonData,
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
		
	},
	
	postComment: function(){
		
		var jsonData = JSON.stringify({
	        "UDID": ff.deviceID,
	        "comment": $('#comment').val()
	        });
		
		$.ajax({
		  type: "POST",
		  contentType: 'application/json',
		  dataType: "json",
    	  data: jsonData,
		  url: "http://api.chasemoody.com/acl/comment",
		  beforeSend: function() {
		    $('#comment_form').empty().append('<center><img src="assets/img/ajax-loader.gif"/></center>');
		  },
		  success: function(){
		  	$('#comment_form').empty().append('<p>Thank you for your feedback.');
		  }
		});
		
	},
	
	checkForDevice: function(){
		
		$.ajax({
		  type: "GET",
		  dataType: "JSON",
		  url: "http://api.chasemoody.com/acl/users/"+ff.deviceID,
		  success: function(data){
		  	console.log(data);
		  	if(data === false){
		  		ff.addDevice();
		  	}else{
		  		console.log('Exists');
		  	}
		  }
		});
		
	},
	
	addDevice: function(){
		
		var jsonData = JSON.stringify({
						"name": device.name,
						"UDID": ff.deviceID
					});
		
		$.ajax({
		  type: "POST",
		  contentType: 'application/json',
		  dataType: "json",
		  data: jsonData,
		  url: "http://api.chasemoody.com/acl/device",
		  success: function(){
		  	console.log('Device Added');
		  }
		});
		
	},
	
	clearWatch: function(){
		
		if (ff.watchID != null) {
	        navigator.geolocation.clearWatch(ff.watchID);
	        ff.watchID = null;
	    }
	    
	},
	
	onFail: function(message){
		
		alert('Failed because: ' + message);
		
	}
	
}

$(function() {ff.init();});
