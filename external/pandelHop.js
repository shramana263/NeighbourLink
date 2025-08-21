// ratings
var RATINGS_DISABLED = false;
var RATING_UNSEEN = -1;
var RATING_WISHLIST = 0;
var RATING_MIN = -1;
var RATING_MAX = 5;

// initial map view
var DEFAULT_LATITUDE = 22.5535899;
var DEFAULT_LONGITUDE = 88.3580924;
var DEFAULT_ZOOM = 12;

// zoom when a pandal is selected
var ZOOM_WHEN_PANDAL_SELECTED = false;
var PANDAL_SELECTED_ZOOM = 18;

// server API
var API_GET_DATA = '/api/getData';
var API_GET_PHOTOS = '/api/getPhotos';
var API_RATE_PLACE = '/api/ratePlace';
var API_ADD_PHOTO = '/api/addPhoto';
var API_ADD_PLACE = '/api/addPlace';
var API_DELETE_PLACE = '/api/deletePlace';
var API_MOVE_PLACE = '/api/movePlace';
var IMG_CROSSHAIRS = '/img/crosshairs.png';

// marker parameters
var INFO_WINDOW_OFFSET_Y = -40;
var MAP_MARKER_W = 36;
var MAP_MARKER_H = 42;
var MARKER0_SZ = 12;
var CROSSHAIRS_SZ = 16;

//photo uploads
var MAX_PHOTO_UPLOADS = 20;

// tile parameters
var TILE_IMAGE_SIZE = 200;
var TILE_BORDER = 2;

// the map
var map;
// the markers on the map
var markerFromPandalId = [];
// all of the pandals received from the server
var sortedPandals = [];
// pandals visible given the current filter setting
var filteredPandals = [];
// sparse array of all of the pandals
var pandalFromId = [];
// map from uuid to pandal
var pandalFromUuid = Object();
// pandal ratings by ID
var ratingFromId = [];
// user info from the server
var userInfo = null;

var prevSelectedPandalId = Number.NaN;
var selectedPandalId = Number.NaN;
var infoWindow = null;
var tiler = null;

function clearAll() {
	clearMarkers();
	hideInfoWindow();
	tiler.setTileContents([]);
	markerFromPandalId = [];
	sortedPandals = [];
	filteredPandals = [];
	pandalFromId = [];
	pandalFromUuid = Object();
	ratingFromId = [];
	userInfo = null;
	prevSelectedPandalId = Number.NaN;
	selectedPandalId = Number.NaN;
}

// hide stuff before the page is shown
$( document ).ready( function() {
	hideMapOverlays();
	// disable the menu items that require login
	$("#menu-popup li.requires-login a").addClass("ui-state-disabled");
});

// clear map markers
function clearMarkers() {
	for(var pandal_id in markerFromPandalId)
		markerFromPandalId[pandal_id].setMap(null);
	markerFromPandalId = []
}

function hideInfoWindow() {
	if (infoWindow != null) {
		infoWindow.open(null);
		infoWindow = null;
	}
}

function showPandalInfoWindow(pandal) {
	hideInfoWindow();

	var content = "<span class='info-window-pandal-name' onclick='javascript:onInfoWindowSelect(" + pandal.id + ")'>"+pandal.name+"</span>";

	if (pandal.awards) {
		for(var i=0; i<pandal.awards.length; i++)
			content += '<br><b>' + pandal.awards[i].awarder + '</b><br>&nbsp;-&nbsp;&nbsp;' + pandal.awards[i].award + " (" + pandal.awards[i].year + ")";
	}
	// todo: this is pretty clunky
	var isSmallMarker = ((pandal.average_rating==0)&&(getRatingFromId(pandal.id)!=RATING_WISHLIST));
	infoWindow = new google.maps.InfoWindow({
		content : content,
		position : {lat:pandal.latitude,lng:pandal.longitude},
		pixelOffset: new google.maps.Size(0,(isSmallMarker?0:INFO_WINDOW_OFFSET_Y))
	});
	google.maps.event.addListener(infoWindow, 'closeclick', function() {infoWindow=null});
	// tag the infoWindow with the pandal ID so we can detect the geolocation infoWindow
	infoWindow.pandalId = pandal.id;

	infoWindow.open(map);
}

// center the map on a pandal and zoom in
function showPandalOnMap(pandal) {
	map.panTo(new google.maps.LatLng(pandal.latitude, pandal.longitude));
	if (ZOOM_WHEN_PANDAL_SELECTED)
		map.setZoom(PANDAL_SELECTED_ZOOM);
}

function updateMenuEnabledState() {
	if (isLoggedIn()) {
		$("#menu-popup li.requires-login a").removeClass("ui-state-disabled");

		if (!userInfo || !selectedPandalId || (!userInfo.admin && pandalFromId[selectedPandalId].is_public))
			$("#menu-popup li.requires-movable-pandal a").addClass("ui-state-disabled");
		if (!userInfo || !selectedPandalId || pandalFromId[selectedPandalId].is_public)
			$("#menu-popup li.requires-deletable-pandal a").addClass("ui-state-disabled");
	}
	else
		$("#menu-popup li.requires-login a").addClass("ui-state-disabled");
}

function selectTile(id) {
	$('#side-panel-cell-' + id).addClass('side-panel-cell-selected');
}

function deselectTile(id) {
	$('#side-panel-cell-' + id).removeClass('side-panel-cell-selected');
}

function selectPandal(pandal, showOnMap) {
	if (selectedPandalId) {
		deselectTile(selectedPandalId);
		prevSelectedPandalId = selectedPandalId;
	}
	selectedPandalId = pandal.id;
	selectTile(selectedPandalId);
	showPandalInfoWindow(pandal);
	tiler.showTile(pandal.id, true);
	if (showOnMap)
		showPandalOnMap(pandal);
	updateMenuEnabledState();
	hideMapOverlays();
}

function deselectPandal() {
	if (selectedPandalId) {
		deselectTile(selectedPandalId);
		prevSelectedPandalId = selectedPandalId;
		selectedPandalId = Number.NaN;
		hideInfoWindow();
		updateMenuEnabledState();
	}
}

function onSearchPandalsClicked() {
	$("#menu-popup").on("popupafterclose", function(event) {
		$(this).unbind(event);
		$('#search-popup').popup( "open", {positionTo: '#menu-button'});
	});
}

function onMyPandalHoppingBlogClicked() {
	if (userInfo)
		$("#menu-popup").on("popupafterclose", function(event) {
			$(this).unbind(event);
			location.pathname = userPageUrl;
		});
}

function onRecentPhotosClicked() {
	$("#menu-popup").on("popupafterclose", function(event) {
		$(this).unbind(event);
		location.pathname = recentPageUrl;
	});
}

// this is called when a pandal is selected during a search
function onSearchSelect(id) {
	var pandal = pandalFromId[id];

	// hide the dropdown
	$('input[data-type="search"]').val("");
   	$('input[data-type="search"]').trigger("keyup");
	$('#search-popup').popup("close");

	selectPandal(pandal, true);
}

function onAddPandalClicked() {
	showAddPandalOverlays();
	/*if (geoMarker) {
		map.panTo(geoMarker.getPosition());
		map.setZoom(ZOOM_TO_LOCATION_ZOOM);
	}*/
	$("#menu-popup").on("popupafterclose", function(event) {
		$(this).unbind(event);
		openOkayPopup("Add Pandal", "Move and zoom the map to position the red dot <img src='" + IMG_CROSSHAIRS + "'/> where you want the new pandal to be placed. Then press the <b>Add Pandal</b> button at the upper-right of the map. To cancel press the <b>X</b> button." , "Okay" );
	});
}

function onAddPandalCancelClick() {
	hideMapOverlays();
}

function onAddPandalAddClick() {
	$('#add-pandal-form').on('submit', function(e) {
		$(this).unbind(e);
		if (e.preventDefault) e.preventDefault();
		hideMapOverlays();
		$('#add-pandal-popup').popup("close");
		var center = map.getCenter();
		var name = $('#add-pandal-form input[name="name"]').val();
		useAccessToken(function(tok){
			api_addPandal(name, center.lat(), center.lng(), tok);
		});
		return false;
	});
	// clear the old name
	$('#add-pandal-name').val('');
	$('#add-pandal-popup').popup("open");
}

function api_addPandal(name, lat, lng, tok) {
	var params = {name:name, lat:lat, lng:lng, tok:tok};
	if (window.hasOwnProperty('eventName') && (eventName != null))
		params["event"] = eventName;
	postUrl(API_ADD_PLACE, params).done(function(response) {
		if (!response.error) {
			var pandal = response;
			addPandals([pandal]);
			selectPandal(pandal, true);
		}
	});
}

function onMoveSelectedPandalClicked() {
	showMovePandalOverlays();
	$("#menu-popup").on("popupafterclose", function(event) {
		$(this).unbind(event);
		openOkayPopup("Move Pandal", "Move and zoom the map to position the red dot <img src='" + IMG_CROSSHAIRS + "'/> where you want the pandal to be moved to. Then press the <b>Move Pandal</b> button at the upper-right of the map. To cancel press the <b>X</b> button." , "Okay" );
	});
}

function onMoveSelectedPandalCancelClick() {
	hideMapOverlays();
}

function onMoveSelectedPandalMoveClick() {
	hideMapOverlays();
	if (selectedPandalId) {
		var center = map.getCenter();
		useAccessToken(function(tok){
			api_movePandal(selectedPandalId, center.lat(), center.lng(), tok);
		});
	}
}

function api_getPhotos(pandal_id) {
	var pandal = pandalFromId[pandal_id];
	pandal.getPhotosPromise = $.Deferred();
	useAccessToken(function(tok){
		getUrl(API_GET_PHOTOS, {pandal_id: pandal_id, tok: tok}).done(function(response) {
			console.log(response);
			pandal.photos = response.photos;
			pandal.getPhotosPromise.resolve();
		}).fail(function() {
			alert("Error communicating with the server. Please check your internet connection and reload the page.");
		});
	});
}

function api_movePandal(pandal_id, lat, lng, tok) {
	postUrl(API_MOVE_PLACE, {pandal_id:pandal_id, lat:lat, lng:lng, tok:tok}).done(function(response) {
		console.log(response);
		if (response.num_pandals_moved) {
			var pandal = pandalFromId[response.pandal_id];
			pandal.latitude = response.latitude;
			pandal.longitude = response.longitude;
			var marker = markerFromPandalId[pandal.id];
			if (marker)
				marker.setPosition( new google.maps.LatLng(pandal.latitude, pandal.longitude) );
			// move the info window (the cheesy way)
			if (infoWindow && (infoWindow.pandalId == pandal.id)) {
				hideInfoWindow();
				showPandalInfoWindow(pandal);
			}
		}
	});
}

function onDeleteSelectedPandalOkayClicked() {
	if (selectedPandalId) {
		var pandal = pandalFromId[selectedPandalId];
		// never delete a public pandal - use the admin interface
		if (!pandal.is_public) {
			useAccessToken(function(tok){
				api_deletePandal(pandal.id, tok);
			});
		}
	}
}

function onDeleteSelectedPandalClicked() {
	if (selectedPandalId) {
		$("#menu-popup").on("popupafterclose", function(event) {
			$(this).unbind(event);
			var pandal = pandalFromId[selectedPandalId];
			openCancelPopup("Delete pandal?", 'If you delete a pandal the pandal and all of its photos will be gone forever.<br><br> Are you sure you want to delete the pandal "' + pandal.name + '"?', "Delete", onDeleteSelectedPandalOkayClicked, false);
		});
	}
}

function api_deletePandal(pandal_id, tok) {
	postUrl(API_DELETE_PLACE, {pandal_id:pandal_id, tok:tok}).done(function(response) {
		console.log(response);
		if (response.num_pandals_deleted) {
			var pandal_id = response.pandal_id;
			// deselect the deleted pandal (unless a different one is now selected)
			if (pandal_id == selectedPandalId)
				deselectPandal();
			// remove from sortedPandals
			for(var i = 0; i < sortedPandals.length; i++)
				if (sortedPandals[i].id == pandal_id) {
					sortedPandals.splice(i,1);
					break;
				}
			// delete stuff from lists
			delete pandalFromUuid[pandalFromId[pandal_id].uuid];
			delete pandalFromId[pandal_id];
			delete ratingFromId[pandal_id];
			// refresh stuff
			initPandalSearch();
			onChangePandalFilter();
		}
	});
}

function onPopupPhotoClicked(pandal_id) {
	// Todo: For now we close the pandal popup when we start the slideshow. This addresses a bug
	// that when the slideshow is up on top of the popup there is always an href active that shows up
	// in the lower left of Chrome.
	closePandalDialog();

	// This is on a 1 ms timeout so that the close pandal callbacks can be completed first.
	// I used to have this inside a popupafterclose callback but it would have to run after the
	// one that is installed during initialize(), and its hard to ensure that order.
	setTimeout(function(){
		var pandal = pandalFromId[pandal_id];
		startSlideshow2(pandal.uuid);
	}, 100);
}

function getRatingFromId(id) {
	return (id in ratingFromId)?(ratingFromId[id]):(RATING_UNSEEN);
}

function getThumbUrl(photo_uuid) {
	return "/photos/thumbs/" + photo_uuid + ".jpg"
}

function getSlideUrl(photo_uuid) {
	// we need the absolute URL in order for the sharing links to work
	return "http://" + window.location.hostname + (window.location.port?(":"+window.location.port):"") + "/photos/slides/" + photo_uuid + ".jpg"
}

function onPandalPopupLoginButtonClicked() {
	$(document).on('popupafterclose', '#pandal-popup', function(event) {
		$(this).unbind(event);
		// todo: this delay is a hack due to JQM's behavior
		setTimeout(function(){ 
			onLoginMenuClicked();
		}, 1000);
	});
	$("#pandal-popup").popup( "close" );
}

function openPandalDialog(pandal, suppressHistory) {
	// make sure the photos are loaded for the slideshow
	if (!pandal.photos && !pandal.getPhotosPromise)
		api_getPhotos(pandal.id);

	var id = pandal.id;
	var rating = getRatingFromId(id);

	hideMapOverlays();

	// show the appropriate stuff based on whether the user is logged in
	var loggedIn = isLoggedIn();
	$('#pandal-popup-not-logged-in-div').toggle(!loggedIn);
	$('#pandal-popup-logged-in-div').toggle(loggedIn);
	$('#add-photo-button').toggle(loggedIn);

	// clear the old photo, which otherwise briefly appears
	$("#pandal-popup-photo").attr("src", "");

	// Reset the radio buttons according to the pandal ratings.
	for(var i = RATING_MIN; i <= RATING_MAX; i++)
		$('#rating-radio-choice-'+i).attr("checked", false);
	$('#rating-radio-choice-'+rating).attr("checked","checked");
	// In theory, we should only need this:
	// $("#pandal-popup input[type='radio']").checkboxradio("refresh");
	// But there seems to be a bug where after a few times the radio
	// stops showing the checked option as checked. So we rebuild from html.
	$('#pandal-popup').html($('#pandal-popup').html());
	$('#pandal-popup').trigger('create');

	$("#pandal-popup-name").html(pandal.name);
	$("#pandal-popup-photo").unbind("click"); // get rid of old click handler if any
	$("#pandal-popup-photo").click( function () {
		onPopupPhotoClicked(id);
	});
	if (!pandal.banner_photo_uuid)
		$("#pandal-popup-photo").attr("src", "");
	else {
		$("#pandal-popup-photo").attr("src", getThumbUrl(pandal.banner_photo_uuid));
	}
	// add an id that is specific to this pandal so we can select for it
	$(".pandal-popup-stars-div").attr("id", "pandal-popup-stars-div-" + id);
	updateStarsInPopup(pandal);

	$("#activity-log-link").attr("href", "/place/"+pandal.uuid);

	// remove previous onclick bindings (see the error handler below)
	$('#add-photo-button').unbind('click');

	// open the popup
	$("#pandal-popup").popup( "open" );

	// plupload
	if (loggedIn) {
		useAccessToken(function(tok){
			var uploader = new plupload.Uploader({
				runtimes : 'html5,flash,silverlight,html4',

				browse_button : 'add-photo-button',
				container: document.getElementById('plupload-hidden-container'),

				url : API_ADD_PHOTO,

				file_data_name : "imageFile",

				filters : {
					max_file_size : '10mb',
					mime_types: [
						{title : "Image files", extensions : "jpg,jpeg"},
					]
				},

				flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
				silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',

				multipart_params : {
					"place_id" : id.toString(),
					"tok" : tok
				},

				init: {
					PostInit: function() {
						$('#photo-upload-status').html('');
						$('#photo-upload-status').hide();
						$('#add-photo-button').show();
						indexFromFileId = [];
						numFiles = 0;
					},

					FilesAdded: function(up, files) {
						if (files.length > MAX_PHOTO_UPLOADS)
							alert("A maximum of " + MAX_PHOTO_UPLOADS + " photos can be uploaded at a time. The first " + MAX_PHOTO_UPLOADS + "  photos that you selected will be uploaded.");
						up.files.splice(MAX_PHOTO_UPLOADS);
						files.splice(MAX_PHOTO_UPLOADS);
						plupload.each(files, function(file) {
							indexFromFileId[file.id] = numFiles;
							numFiles++;
						});
						uploader.start();
					},

					UploadProgress: function(up, file) {
						var i = indexFromFileId[file.id];
						$('#add-photo-button').hide();
						$('#photo-upload-status').html("<div id='uploading-k-of-n'> Uploading " + (i+1) + " of " + numFiles + "</div><div id='uploading-percent'>" + file.percent + "%</div>");
						$('#photo-upload-status').show();
					},

					FileUploaded:  function(upldr, file, object) {
						var i = indexFromFileId[file.id];
						if (i == numFiles-1) {
							$('#add-photo-button').show();
							$('#photo-upload-status').hide();
							$('#photo-upload-status').html("");
						}
						photo = eval('(' + object.response + ')');
						if (photo.error) {
							console.log("Photo upload error: " + photo.error);
							alert("Server failed to upload photos. Please try again.");
						}
						else {
							console.log("Added photo: " + object.response);
							thumbUrl = getThumbUrl(photo.uuid);
							if (photo.pandal_id == selectedPandalId)
								$("#pandal-popup-photo").attr("src", thumbUrl);
							$("#side-panel-cell-"+photo.pandal_id+" img").attr("src", thumbUrl);
							if (!pandal.hasOwnProperty("photos"))
								pandal.photos = [];
							pandal.photos.unshift(photo);
							// make this photo the banner if there isn't one
							if (!pandal.banner_photo_uuid)
								pandal.banner_photo_uuid = photo.uuid;
						}
					},

					Error: function(up, err) {
						console.log("Plupload Error #" + err.code + ": " + err.message);
						$('#add-photo-button').unbind('click');
						$('#add-photo-button').bind('click', function(){
							alert('Your browser is not supported for photo upload. Please try a newer browser.');
						});
					}
				}
			});

			uploader.init();
		});
	}

	// the pandal popup has its own URL
	if (!suppressHistory)
		pushHistoryState(id);
}

function onRatingChange() {
	// There is a very special case being handled here. If the current filter is Wishlist and the rating
	// in the popup is changed from Wishlist to something else, the pandal will disappear from the current
	// filter set and be deselected. But the popup is still open and the user may want to change the rating.
	// So we keep around the previously selected pandal ID and use it if there is no selection.
	var pandalId = selectedPandalId?selectedPandalId:prevSelectedPandalId;
	var oldRating = getRatingFromId(pandalId);
	var newRating = parseInt($('input[name=rating-radio]:checked').val());

	if (!RATINGS_DISABLED || (((oldRating == RATING_UNSEEN) || (oldRating == RATING_WISHLIST)) && ((newRating == RATING_UNSEEN) || (newRating == RATING_WISHLIST)))) {
		console.log("rating pandal " + pandalFromId[pandalId].name + " a " + newRating );
		useAccessToken(function(tok){
			api_ratePandal(pandalId, newRating, tok);
		});
	}
	else {
		console.log("ignoring rating change");
	}
}

var WISHLIST_FILTER_NAME = "Wishlist";

function isCurrentFilterWishlist() {
	return ($("#pandal-filter-select option:selected").val() == WISHLIST_FILTER_NAME);
}

function setCurrentFilter(filter) {
	var sel = $("#pandal-filter-select");
	sel.val(filter).attr('selected', true).siblings('option').removeAttr('selected');
	sel.selectmenu("refresh", true);
	onChangePandalFilter();
}

function api_ratePandal(pandal_id, rating, tok) {
	postUrl(API_RATE_PLACE, {pandal_id: pandal_id, rating: rating, tok: tok}).done(function(response) {
		if (response.error) {
			alert("An error occured. Please try rating the pandal again.");
			console.log("ratePandal error: " + response.error);
			return;
		}
		console.log("rating change successful");
		// new ratings
		var newRating = response.new_rating;
		var newAverageRating = response.average_rating;

		// old ratings
		var pandal_id = response.pandal_id;
		var pandal = pandalFromId[pandal_id];
		var oldRating = getRatingFromId(pandal_id);
		var oldAverageRating = pandal.average_rating;

		// set the new ratings
		ratingFromId[pandal_id] = newRating;
		var oldStars = getNumStars(pandal.average_rating);
		pandal.average_rating = response.average_rating;
		var newStars = getNumStars(response.average_rating);

		if (oldStars != newStars) {
			updateStarsInSidePanelAndPopup(pandal_id);
		}

		// If our current filter is Wishlist and a rating changes then we have to re-filter
		// because we don't have an incremental way of dealing with the sidebar
		if (	isCurrentFilterWishlist() &&
			((oldRating==RATING_WISHLIST)!= (newRating==RATING_WISHLIST)))
			onChangePandalFilter();
		// update the marker if the wishlist or average rating of this marker changed
		else if (((oldRating==RATING_WISHLIST)!= (newRating==RATING_WISHLIST)) ||
				(getNumStars(oldAverageRating)!=getNumStars(newAverageRating))) {
			updateMapMarker(pandal_id);
			// sometimes the infoWindow needs to be moved because unrated pandals only have a dot
			if (infoWindow && (infoWindow.pandalId == pandal.id)) {
				hideInfoWindow();
				showPandalInfoWindow(pandal);
			}
		}
	});
}

function onSidePanelSelect(pandal_id) {
	var pandal = pandalFromId[pandal_id];
	if (pandal_id == selectedPandalId)
		openPandalDialog(pandal);
	else
		selectPandal(pandal, true);
}

function onMapSelect(id) {
	var pandal = pandalFromId[id];
	// If an unselected map marker is clicked, or the user had close the info window then we
	// do a select (which will just reopen the info window if this pandal is already selected).
	// The (infoWindow.pandalId != id) takes care of the geolocation infoWindow.
	if ((infoWindow == null) || (id != infoWindow.pandalId) || (id != selectedPandalId)) {
		selectPandal(pandal, false);
	}
	else {
		openPandalDialog(pandal);
	}
}

function onInfoWindowSelect(id) {
	var pandal = pandalFromId[id];
	openPandalDialog(pandal);
}

function afterResize(mapw, maph) {
	var winw = $(window).width();
	var winh = $(window).height();

	$(".map-overlay-buttons").css({right: winw-mapw});

	// move the crosshairs (depends on variables in both of the above blocks)
	var left = ((mapw-CROSSHAIRS_SZ)/2);
	var top = ((maph-CROSSHAIRS_SZ)/2);
	$("#map-crosshairs").css({left: left, top: top});

	// resize map keeping same center
	var center = map.getCenter();
	google.maps.event.trigger(map, "resize");
	map.setCenter(center);
}

function openIntroPopup() {
	// if we change the intro and want it to appear again, just change "tag" to something new
	var tag = '4';
	if (getLocalStorage('intro_popup') !== tag) {
		setLocalStorage('intro_popup', tag);
		$("#intro-popup").popup("open");
	}
}

// initialize the app
function initialize() {

	var mapOptions;

	// center the map
	mapOptions = {
		center : new google.maps.LatLng(DEFAULT_LATITUDE, DEFAULT_LONGITUDE),
		zoom : DEFAULT_ZOOM,
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		mapTypeControl : false,
		scaleControl : true,
		overviewMapControl : false,
		streetViewControl : false,
		fullscreenControl : false
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	tiler = new Tiler({
		getTileHtml: getSidePanelCellHtml,
		afterResize: afterResize,
		headerId: "Header",
		tileViewportId: "tile-viewport",
		mapId: "map-canvas",
		tileSize: TILE_IMAGE_SIZE + 2*TILE_BORDER,
		border: TILE_BORDER
	});

	// track the user's location
	initGeoLocation();

	// The filter button keeps focus after being clicked, leaving a blue halo, so we remove the focus after the
	// popup closes (the popup ID *-listbox-popup and the button ID *-button are created internally by JQM).
	// This also seems to address a bug on Android where the menu button and the filter button would kind
	// of get stuck together and you'd get the filter when trying to click the menu.
	$(document).on('popupafterclose', '#pandal-filter-select-listbox-popup', function () {
		setTimeout(function(){
			$('#pandal-filter-select-button').blur();
		}, 100);
	});

	$(document).on('popupafterclose', '#pandal-popup', function () {
		// go back in history if this is a popup URL (it will be if the popup was not closed by pressing the back button)
		if (window.location.pathname.indexOf('/site/') >= 0)
			window.history.back();
	});

	// This magically prevents some erroneous page navigations done by JQM.
	// Since I am messing with the history, it confuses JQM. In the long run I need
	// to turn off JQM history but they I have to replace it for all popup menus.
	$(document).on("pagebeforechange", function(e) {
		e.preventDefault();
	} )

	window.addEventListener("popstate", function(e){
		console.log("popstate: " + window.location.pathname);
		// If the gallery is open, we close it. In the long run if our states become more complicated
		// we may need to be more careful here and check if it's really a "closed gallery" state (not, for
		// example, an open gallery state).
		if (gallery)
			gallery.close();
		var m = window.location.pathname.match("/site/([0-9a-zA-Z_-]+)/photo/([0-9a-zA-Z_-]+)");
		if (m)
			startSlideshow2(m[1], m[2]);
		else {
			m = window.location.pathname.match("/site/([0-9a-zA-Z_-]+)");
			if (m) {
				var pandal = pandalFromUuid[m[1]];
				selectPandal(pandal, true);
				// use a delay to work around JQM quirkiness (otherwise the popup closes immediately)
				setTimeout(function(){
					openPandalDialog(pandal, true); // suppress history
				}, 100);
			}
			else
				$('#pandal-popup').popup( "close" );
		}
	});

	// After getting the public pandals and initializing the login system
	// (which loads the pandals from the server) we can process the URL
	// and open the pandal popup or slideshow
	initLogin().then(initStateFromUrl);

	// The only way I have figured out how to open this dialog on startup without messing up
	// JQMs history is to do it on a timer. The system I had before this of opening it when JQM
	// thinks the page is ready only worked without history turned on. But I want to be able to
	// use the back button for this dialog too.
	// Only show the intro popup when the user navigates to the root (we don't want it to interfere
	// if the first time the user comes to the site it is via a link to a photo or pandal).
	if (window.location.pathname == '/') {
		setTimeout(function(){ 
			openIntroPopup()
		}, 1000);
	}
}

function addSlash(path) {
	if (path[path.length-1] == '/')
		return path;
	return path + '/';
}

function pushHistoryState(selectedPandalId) {
	var newUrl = addSlash(window.location.pathname) + "site/" + pandalFromId[selectedPandalId].uuid;
	// replace the state if it's one of ours
	if (window.location.pathname.indexOf("/site/") >= 0)
		window.history.replaceState(null, "title", newUrl);
	else
		window.history.pushState(null, "title", newUrl);
}

function closePandalDialog() {
	$('#pandal-popup').popup( "close" );
}

function getRatingsFromServer(tok) {
	if (tok) {
		api_getRatings(tok);
	}
}

function getUrl(url, args, dataType) {
	if (!dataType)
		dataType = "json";

	var settings = {
		url: url,
		data: args,
		dataType: dataType
	};

	return $.ajax(settings);
}

function postUrl(url, args) {
	var settings = {
		url: url,
		data: args,
		dataType: "json",
		method: "POST",
	};

	return $.ajax(settings);
}

function getNumStars(average_rating) {
	return Math.round(average_rating);
}

// create a marker
function createMarker(pandal) {
	// select icon based on rating
	var numStars = getNumStars(pandal.average_rating);
	var icon = '/img/m' + numStars + ((getRatingFromId(pandal.id)==RATING_WISHLIST)?'wish':'') + '.png';

	if (icon == '/img/m0.png')
		var image = {
			url: icon,
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(MARKER0_SZ/2, MARKER0_SZ/2)
		}
	else
		var image = {
			url: icon,
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(MAP_MARKER_W/2, MAP_MARKER_H)
		};

	var markerConfig = {
		title : pandal.name,
		position : new google.maps.LatLng(pandal.latitude, pandal.longitude),
		icon : image,
		draggable : false,
		map: map
	};
	var marker = new google.maps.Marker(markerConfig);

	var id = pandal.id;
	google.maps.event.addListener(marker,"click", function(mouseEvent) {
		onMapSelect(id);
	});

	return marker;
}

function initPandalSearch(){
	$("#searchPandals_ul").on("filterablebeforefilter", function (e, data) {
		var ul = $(this);
		var htmlContent = "";
		var pandals = filteredPandals; // change this to sortedPandals if we want to search all of them
 
		// add an <li> for each pandal
		for(var i=0; i<pandals.length; i++) {
			htmlContent += "<li><a href=\"" + 'javascript:onSearchSelect(' + pandals[i].id + ')' + "\">" + pandals[i].name + "</a></li>";
		}

		ul.html(htmlContent);
		ul.listview("refresh");
		ul.trigger("updatelayout");
	});
}

function addPandals(newPandals, awards) {
	console.log("addPandals: " + newPandals.length);
	if (newPandals.length > 0) {
		// append the new elements
		for (var i=0; i < newPandals.length; i++)
			sortedPandals.push(newPandals[i]);

		// map IDs to pandals
		for(var i = 0; i < newPandals.length; i++) {
			pandalFromId[newPandals[i].id] = newPandals[i];
			pandalFromUuid[newPandals[i].uuid] = newPandals[i];
		}

		// attach the awards to each pandal
		if (awards) {
			console.log("awards: " + awards.length);
			for(var i in awards) {
				var award = awards[i];
				var pandal_id = award.pandal_id;
				if (pandal_id in pandalFromId) {
					var pandal = pandalFromId[pandal_id];
					if (!("awards" in pandal)) {
						pandal.awards = [];
					}
					pandal.awards.push(award);
				}
			}
		}

		// initialize the autocomplete
		initPandalSearch();

		// populate the map and sidebar
		// todo: it would be nice if this was incremental, but it should be quite rare that addPandals is called
		// due to a nonzero number of personal pandals.
		onChangePandalFilter();
	}
}

function processData(response) {
	var before = Date.now();
	clearAll();

	if (response.lapse)
		console.log("server processing took " + Math.round(1000 * response.lapse) + " milliseconds");

	if (response.user)
		userInfo = response.user;

	var oldRatingFromId = ratingFromId;

	if (response.ratings) {
		ratings = response.ratings;

		// record them by pandal ID
		ratingFromId = [];
		for(var i = 0; i < ratings.length; i++)
			ratingFromId[ratings[i].pandal_id] = ratings[i].rating;
	}

	if (response.pandals) {
		sortedPandals = [];
		pandalFromId = [];
		pandalFromUuid = Object();

		addPandals(response.pandals, response.awards);
	}

	var after = Date.now();
	console.log("processData took " + (after-before) + " milliseconds");
}

function initStateFromUrl() {
	// open the pandal popup or slideshow based on the current URL
	var re0 = /\/site\/([0-9a-zA-Z_-]+)/;
	var match0 = re0.exec(window.location.pathname);

	if (match0) {
		var i = window.location.pathname.indexOf('/site/');
		if (i >= 0)
			var basePath = window.location.pathname.slice(0,i);
		else
			var basePath = window.location.pathname;

		// select pandal
		var pandal = pandalFromUuid[match0[1]];
		if (pandal)
			selectPandal(pandal, true)
		else {
			console.log("pandal does not exist");
			// return the URL to the root since we won't open the popup
			window.history.replaceState(null, "title", basePath);
			return;
		}

		var re1 = /\/photo\/([0-9a-zA-Z_-]+)/;
		var match1 = re1.exec(window.location.pathname);

		// put in a root state so we can use back() to exit the slideshow or popup
		window.history.replaceState(null, "title", basePath);

		if (match1) {
			startSlideshow2(pandal.uuid, match1[1])
		}
		else {
			openPandalDialog(pandal, false)
		}
	}
}

function unpack(splash) {
	var n = 65;
	var a = splash.substring(0,2*n);
	var b = splash.substring(2*n);
	var m = [];
	for( var i = 0; i < n; i++)
		m[a[2*i+1]] = a[2*i];
	var s = '';
	for (var i = 0; i < b.length; i++)
		s += m[b[i]];
	return JSON.parse(atob(s));
}

function api_getData(tok) {
	var before = Date.now();
	var deferred = $.Deferred();
	if (window.hasOwnProperty('ph_splash') && (ph_splash != null)) {
		processData(unpack(ph_splash));
		// if the user logs in or out the ph_splash is invalid, so we just use it once
		ph_splash = null
		deferred.resolve();
	}
	else {
		var params = {}
		if (tok)
			params["tok"] = tok;
		else
			params["logout"] = null;
		if (window.hasOwnProperty('eventName') && (eventName != null))
			params["event"] = eventName;
		getUrl(API_GET_DATA, params, "text").done(function(response) {
			processData(unpack(response));
			deferred.resolve();
		}).fail(function() {
			deferred.reject();
		});
	}
	deferred.done(function() {
		var after = Date.now();
		console.log("api_getData took " + (after-before) + " milliseconds");
	});
	return deferred.promise();
}

function updateMapMarker(pandal_id) {
	var pandal = pandalFromId[pandal_id];
	console.log("updating marker for " + pandal.name);
	markerFromPandalId[pandal_id].setMap(null);
	markerFromPandalId[pandal_id] = createMarker(pandal);
}

function createMapMarkers(pandals) {
	clearMarkers();
	for(var i = 0; i < pandals.length; i++)
		markerFromPandalId[pandals[i].id] = createMarker(pandals[i]);
}

function onFilteredPandalsChanged() {
	createMapMarkers(filteredPandals);
	populateSidePanel(filteredPandals);
}

function hasAward(pandal, awarder) {
	if (pandal.awards)
		for (i in pandal.awards)
			if (pandal.awards[i].awarder == awarder)
				return true;

	return false;
}

// filter the pandals according to rating and awards
function updateFilteredPandals(starsThreshold, awardName) {
	var foundSelected = false;
	filteredPandals = [];

	for (var i=0; i<sortedPandals.length; i++) {
		var pandal = sortedPandals[i];
		if (	(!awardName && (getNumStars(pandal.average_rating) >= starsThreshold)) ||
			((awardName=="Wishlist") && (getRatingFromId(pandal.id) == RATING_WISHLIST)) ||
			(awardName && hasAward(pandal, awardName)))
		{
			filteredPandals.push(pandal);
			if (selectedPandalId == pandal.id)
				foundSelected = true;
		}
	}

	// if the selected pandal is not in the new filtered set, deselect it
	if (!foundSelected)
		deselectPandal();

	onFilteredPandalsChanged();
}

function getStarsUrl(average_rating) {
	return (average_rating==0)?(""):("/img/stars" + getNumStars(average_rating) + ".png");
}

function getSidePanelCellHtml(pandalId, tileSize) {
	var thumbSize = tileSize - 2*TILE_BORDER;
	var pandal = pandalFromId[pandalId];
	// todo: this is a hack to scale the stars down from 48 to 24 and also scale them with the tiles
	var starsHeight = (24*thumbSize)/TILE_IMAGE_SIZE;
	var imgSrc = pandal.banner_photo_uuid?getThumbUrl(pandal.banner_photo_uuid):"";
	var starsUrl = getStarsUrl(pandal.average_rating);
	// we have to hide the image if there are no stars or else it draws a box, but we need the img there in case the rating changes,
	// and this is the only place we really know the tile size
	var imgDisplay = starsUrl ? "inline" : "none";
	var starsDiv = "<div class='pandal-stars-overlay' style='height:" + starsHeight + "px'><img style='display: " + imgDisplay + ";height:" + starsHeight + "px' src='" + starsUrl + "'/></div>";

	return "<div onclick='javascript:onSidePanelSelect(" + pandal.id + ")' class='side-panel-cell' id='side-panel-cell-" + pandal.id + "' style='width:" + thumbSize + "px;height:" + thumbSize + "px'><img src='" + imgSrc + "' style='width:" + thumbSize + "px;height:" + thumbSize + "px'></img><div class='pandal-name-overlay'>" + pandal.name + "</div>" + starsDiv + "</div>";
}

function updateStarsInPopup(pandal) {
	var starsUrl = getStarsUrl(pandal.average_rating);
	// we select using an id that is only valid for this pandal
	if (starsUrl)
		$("#pandal-popup-stars-div-"+pandal.id).html("<img src='" + starsUrl + "' id='pandal-popup-stars-img'></img>");
	else
		$("#pandal-popup-stars-div-"+pandal.id).html("<div id='no-rating-yet-text'>(no stars yet)</div>");
}

function updateStarsInSidePanelAndPopup(pandalId) {
	var pandal = pandalFromId[pandalId];
	var starsUrl = getStarsUrl(pandal.average_rating);
	// select the side panel image
	var selector = "#side-panel-cell-" + pandal.id + " .pandal-stars-overlay img"
	$(selector).attr("src", starsUrl);
	$(selector).toggle(Boolean(starsUrl));
	// update the popup
	updateStarsInPopup(pandal);
}

// add pandals to the side panel
function populateSidePanel(pandals) {
	if (tiler) {
		var idList = [];
		for(var index in pandals)
			idList[index] = pandals[index].id;

		tiler.setTileContents(idList);
		if (selectedPandalId) {
			selectTile(selectedPandalId);
			tiler.showTile(selectedPandalId);
		}
	}
}

// this is called when the user selects a new pandal filter
function onChangePandalFilter() {
	var selectedIndex = Math.max(0, document.getElementById('pandal-filter-select').selectedIndex);
	var selectedValue = document.getElementById('pandal-filter-select').options[selectedIndex].value;

	var minStars = parseInt(selectedValue);

	if (isNaN(minStars))
		updateFilteredPandals(0, selectedValue);
	else
		updateFilteredPandals(minStars, "");
}

var gallery;

// an onclick handler that just follows the href (to work around photoswipe breaking internal links)
function onclickHref(obj) {
	location.assign(obj.getAttribute("href"));
}

function startSlideshow2(pandal_uuid, photo_uuid) {
	var pandal = pandalFromUuid[pandal_uuid];
	// if there are already photos for the pandal, use them
	if (pandal.photos)
		startSlideshow(pandal_uuid, photo_uuid);
	else {
		// if getPhotos is not underway, start it
		if (!pandal.getPhotosPromise)
			api_getPhotos(pandal.id);
		// when the photos are ready, start the slideshow
		pandal.getPhotosPromise.done(function(){
			startSlideshow(pandal_uuid, photo_uuid);
		});
	}
}

function startSlideshow(pandal_uuid, photo_uuid){
	var html = "";
	var pandal = pandalFromUuid[pandal_uuid];
	var photos = pandal.photos;

	var i = window.location.pathname.indexOf('/site/');
	if (i >= 0)
		var basePath = window.location.pathname.slice(0,i+1);
	else
		var basePath = addSlash(window.location.pathname);

	if (photos) {
		var items = [];
		var startIndex = 0;
		for(var i=0; i<photos.length; i++){
			var photo = photos[i];
			if (photo.uuid == photo_uuid)
				startIndex = i;
			items.push({
				src: getSlideUrl(photo.uuid),
				w: photo.slide_width,
				h: photo.slide_height,
				pid: photo.uuid,
				title: pandal.name,
				// JQM breaks links to the same server, so we have to do it manually
				subtitle: ("Photo taken by <a onclick='javascript:onclickHref(this)' class='slideshow-user-link' href='" + basePath + "user/" + photo.user_uuid + "'>" + photo.user_name + "</a> on " + photo.when_taken)
			});
		}

		var pswpElement = document.querySelector('#gallery');

		if (!pswpElement)
			console.log("failed to select #gallery");

		var options = {
			index: startIndex,
			history: false,

			addCaptionHTMLFn: function(item, captionEl, isFake) {
				if(!item.title) {
					captionEl.children[0].innerText = '';
					return false;
				}
				captionEl.children[0].innerHTML = item.title +  '<br/><small>' + item.subtitle + '</small>';
				return true;
			}
		};

		gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
		if (gallery)
			gallery.init();
		else
			console.log("gallery failed to open");

		photo_uuid = items[startIndex].pid;

		// push the first photo onto the history (or replace the one that is there)
		if (window.location.pathname.indexOf('/photo/') >= 0)
			window.history.replaceState(null, "title", basePath + "site/" + pandal_uuid + "/photo/" + photo_uuid);
		else
			window.history.pushState(null, "title", basePath + "site/" + pandal_uuid + "/photo/" + photo_uuid);

		// when the photo changes, change the history
		gallery.listen('afterChange', function() {
			var pid = items[gallery.getCurrentIndex()].pid;
			window.history.replaceState(null, "title", basePath + "site/" + pandal_uuid + "/photo/" + pid);
		});
		// when the slideshow is destroyed, go back in history
		gallery.listen('destroy', function() {
			// There is a tricky problem being solved here. The gallery can be closed by pressing the
			// close button or by pressing the back button. But if the former, we have to rewind history
			// but we don't want it to do anything since the gallery will already be closed. So we null
			// out the gallery global here so that popstate knows now to try to close the gallery in this case.
			gallery = null;
			// If the slideshow is closed due to pressing the back button, we don't want to back() again.
			// We only go back() manually if the current state is a slideshow state (photoUuid exists).
			if (window.location.pathname.indexOf('/photo/') >= 0) {
				window.history.back();
			}
		});
	}
}

function onMenuClicked() {
	hideMapOverlays();
	$('#menu-popup').popup( "open", {positionTo: '#menu-button'} );
}

function hideMapOverlays() {
	$(".map-overlay").hide();
}

function showAddPandalOverlays() {
	$("#add-pandal-button-group-on-map").show();
	$("#map-crosshairs").show();
}

function showMovePandalOverlays() {
	hideMapOverlays();
	$("#move-pandal-button-group-on-map").show();
	$("#map-crosshairs").show();
}

function openOkayPopup(title, contents, okay_text, okay_callback) {
	$('#okay-popup-title').html(title);
	$('#okay-popup-contents').html(contents);
	$('#okay-popup-okay-button').html(okay_text);
	$('#okay-popup-okay-button').unbind("click");
	if (okay_callback)
		$('#okay-popup-okay-button').click(okay_callback);
	$('#okay-popup').popup( "open" );
}

function openCancelPopup(title, contents, okay_text, okay_callback, redirect_on_okay) {
	if (redirect_on_okay)
		$('#cancel-popup-okay-button').removeAttr('data-rel');
	else
		$('#cancel-popup-okay-button').attr('data-rel', 'back');
	$('#cancel-popup-title').html(title);
	$('#cancel-popup-contents').html(contents);
	$('#cancel-popup-okay-button').html(okay_text);
	$('#cancel-popup-okay-button').unbind("click");
	$('#cancel-popup-okay-button').click(okay_callback);
	$('#cancel-popup').popup( "open" );
}

function onGetTheAndroidAppClicked() {
	window.open('https://play.google.com/store/apps/details?id=com.pandalhop.pandalhopper');
}

function helpClicked() {
	$("#menu-popup").on("popupafterclose", function(event) {
		$(this).unbind(event);
		location.pathname = "/html/faq.html"
	});
}

function onLoginMenuClicked() {
	openCancelPopup('Facebook Login', "Pandal Hopper uses Facebook to verify your identity. It will not post on your behalf or anything like that. If your browser blocks the Facebook popup you will have to unblock it.<br><br>If you choose not to log in you can still browse the pandals, but you won't be able to add pandals, rate them or save them to a wishlist, or upload photos.<br><br>Please upload only photos taken yourself. Photos with text overlays, ads or any other inappropriate content will be removed at our discretion.<br>", "Agree and Login", onLoginClicked, true);
}

function onLoginClicked() {
	window.location = "/social-auth/login/facebook/?next=/pandalhop"
}

function onLogoutClicked() {
	window.location = "/logout/?next=/pandalhop"
}

function initLogin() {
	var deferred = $.Deferred();

	// enable the menu items that require login
	updateMenuEnabledState();

	api_getData(null).done(function() {
		deferred.resolve();
	}).fail(function() {
		deferred.reject();
	});

	return deferred.promise();
}

function useAccessToken(callback) {
	// This is leftover from when we were using access tokens. Now the session knows whether you are logged in or not.
	callback(null);
}

