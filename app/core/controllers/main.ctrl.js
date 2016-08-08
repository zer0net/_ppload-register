angular.module('ZeroVidzReg').controller('MainCtrl', ['$scope','$sce','$location','$http',
	function($scope,$sce,$location,$http) {

		// init
		$scope.init = function(){
	    	$scope.loading = true;			
			$scope.site_address = $location.$$absUrl.split('0/')[1].split('/')[0];
			$scope.onOpenWebSocket();
		};

	    // show Channel
	    $scope.showChannel = function(channelId) {
			$.getJSON('/'+channelId+'/data/channel.json',function(data){
				$scope.$apply(function() {
					$scope.channel = data.channel;
					$scope.videos = data.videos;
				});
			});
	    };

	    // get channels
	    $scope.getChannels = function(){
	    	$scope.channels = [];
	    	$scope.userDirectories = [];
	    	$scope.channelIds = [];
			$.getJSON('/'+$scope.site_address+'/content.json',function(data){
				$.each( data, function( key, val ) {           
				    if(key=='files') {
						$.each( val, function( key2, val2 ) {   
						    if (key2.match("^data/users/")) {
						    	$scope.userDirectories.push(key2);
					            $.getJSON('/'+$scope.site_address+'/'+key2, function(data){
					            	data.channels.forEach(function(channel,index){
					            		if ($scope.channelIds.indexOf(channel.channel_id) < 0){
					            			$scope.channels.push(channel);
					            			$scope.channelIds.push(channel.channel_id);
											$scope.$apply();
					            		}
					            	});
					            });
						    }
						});
					}
				});
				$scope.$apply(function(){
					$scope.loading = false;
				});
			});
	    };

	    // get channel
	    $scope.getChannel = function(channelId,channel) {
			$.getJSON('/'+channelId+'/data/channel.json',function(data){
				$scope.$apply(function() {
					channel.name = data.channel.name;
					channel.description = data.channel.description;
					channel.img = data.channel.img;
					channel.videos = data.videos;
				});
			});
	    };

		// render video
		$scope.renderVideo = function (video) {
			video.imgSrc = 'uploads/posters/' + video.file_name.split('.')[0] + '.png';
		};

		// on open web socket
	    $scope.onOpenWebSocket = function(e) {
			// site info
			Page.cmd("siteInfo", {},function(site_info) {
				Page.site_info = site_info;
				$scope.$apply(function(){
					if (site_info.cert_user_id) {
						$scope.user = site_info.cert_user_id;
					} else {
						$scope.selectUser();
					}
					$scope.page = Page;
					Page.cmd("siteUpdate", {"address": site_info.address},function(res){
						$scope.getChannels();
					});
				});
			});
	    };

	    // select user
	    $scope.selectUser = function(){
	    	Page.cmd("certSelect", [["zeroid.bit"]]);
	    };

		// add channel
		$scope.addChannel = function(channelId,channel) {
			if ($scope.channelIds){
				if ($scope.channelIds.indexOf(channelId) < 0){		
					$scope.createChannel(channelId,channel);
				} else {
					Page.cmd("wrapperNotification", ["done", "Channel "+channelId+" already exists in database", 10000]);				
				}
			} else {
				$scope.createChannel(channelId,channel);
			}
		};

		$scope.createChannel = function(channelId,channel) {
			var inner_path = "data/users/"+Page.site_info.auth_address+"/data.json";
			// get file
			Page.cmd("fileGet", { "inner_path": inner_path, "required": false },function(data) {

	        	// data
				if (data) { data = JSON.parse(data); }
				else { data = {"channels": [] }; }
				var videos = [];
				$scope.videos.forEach(function(video,index){
					video = {
						channel_id:channelId,
						video_id:video.video_id,
						title:video.title,
						file_name:video.file_name,
						file_type:video.file_type
					};
					videos.push(video);
				});
		    	// new video
				channel = {
					"channel_id":channelId,
					"user_id":$scope.user,
					"videos":videos,
					"date_added":+(new Date)
				};

				// save
				data.channels.push(channel);
				var json_raw = unescape(encodeURIComponent(JSON.stringify(data, void 0, '\t')));

				// write to file
				Page.cmd("fileWrite", [inner_path, btoa(json_raw)], function(res) {
					Page.cmd("siteSign", ["5JdgAdEPmUb83QwSUmkCGWz6EbR6GtYDanbJD4dT9cxESjyGRQ3"], function(res) {
						Page.cmd("sitePublish", {inner_path}, function(res) {
							$scope.$apply(function() {
								Page.cmd("wrapperNotification", ["done", "Channel Added!", 10000]);
								window.location.href = '';
							});
						});
					});
				});
		    });
		};

		// delete channel
		$scope.deleteChannel = function(channel){
			var inner_path = "data/users/"+Page.site_info.auth_address+"/data.json";			
			Page.cmd("fileGet", { "inner_path": inner_path, "required": false },function(data) {
				data = JSON.parse(data);
				var channelIndex;
				data.channels.forEach(function(ch,index){
					if (ch.channel_id === channel.channel_id){
						channelIndex = index;
					}
				});
				data.channels.splice(channelIndex,1);
				var json_raw = unescape(encodeURIComponent(JSON.stringify(data, void 0, '\t')));
				// write to file
				Page.cmd("fileWrite", [inner_path, btoa(json_raw)], function(res) {
					Page.cmd("siteSign", ["5JdgAdEPmUb83QwSUmkCGWz6EbR6GtYDanbJD4dT9cxESjyGRQ3"], function(res) {
						Page.cmd("sitePublish", {inner_path}, function(res) {
							$scope.$apply(function() {
								Page.cmd("wrapperNotification", ["done", "Channel Deleted!", 10000]);
								window.location.href = '';
							});
						});
					});
				});
		    });
		};

	}
]);