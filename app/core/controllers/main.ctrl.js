angular.module('ZeroVidzUser').controller('MainCtrl', ['$scope','$sce','$location','$http',
	function($scope,$sce,$location,$http) {

		$scope.init = function(){
			$scope.onOpenWebSocket();
			$scope.getChannels();
			$scope.channel = {};
		};

		// on open web socket
	    $scope.onOpenWebSocket = function(e) {
			// site info
			Page.cmd("siteInfo", {}, (function(_this) {
				return function(site_info) {
					$scope.$apply(function(){
						if (site_info.cert_user_id) {
							$scope.user = site_info.cert_user_id;
						} else {
							$scope.selectUser();
						}
						$scope.page = Page;
					});
					return _this.site_info = site_info;
				};
			})(Page));
	    };

	    // select user
	    $scope.selectUser = function(){
	    	Page.cmd("certSelect", [["zeroid.bit"]]);
	    };
	    
	    // get channels
	    $scope.getChannels = function(){
			Page.cmd("fileGet", { "inner_path": "data/channels.json", "required": false },function(data) {
				$scope.$apply(function(){
					data = JSON.parse(data);
					$scope.channels = data.channels;
				});
			});
	    };


	    // show Channel
	    $scope.showChannel = function(channelId) {
			$.getJSON('/'+channelId+'/data/channel.json',function(data){
				$scope.$apply(function() {
					$scope.channel = data.channel;
					$scope.videos = data.videos;
					console.log(data);
				});
			});
	    };

	    // Add Channel
	    $scope.getChannel = function(channelId,channel) {
			$.getJSON('/'+channelId+'/data/channel.json',function(data){
				$scope.$apply(function() {
					channel.videos = data.videos;
					console.log(data);
				});
			});
	    };

		// render video
		$scope.renderVideo = function (video) {
			video.imgSrc = 'uploads/posters/' + video.file_name.split('.')[0] + '.png';
		};

		// add channel
		$scope.addChannel = function(channelId) {		
			var inner_path = "data/channels.json";
			// get file
			Page.cmd("fileGet", { "inner_path": inner_path, "required": false },function(data) {
	        	// data
				if (data) { data = JSON.parse(data); }
				else { data = {"next_item_id":1,"channels": [] }; }

		    	// new video
				var channel = {
					"channel_id":channelId,
					"name":$scope.channel.name,
					"img":$scope.channel.img,
					"description":$scope.channel.description
				};

				// save
				data.next_item_id += 1;
				data.channels.push(channel);
				var json_raw = unescape(encodeURIComponent(JSON.stringify(data, void 0, '\t')));

				// write to file
				Page.cmd("fileWrite", [inner_path, btoa(json_raw)], function(res) {
					// publish
					Page.cmd("sitePublish",{"inner_path": inner_path}, function(res){
						// apply to scope
						$scope.$apply(function() {
							Page.cmd("wrapperNotification", ["done", "Channel Added!", 10000]);
						});
					});
				});
		    });	
		};

	}
]);