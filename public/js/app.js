(function() {
	angular.module('TheLightingControllerClientExampleApp', ['ngRoute', 'ngMaterial', 'ngMessages'])

	.config(function($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				templateUrl: '/partials/login.html',
				controller: 'LoginController',
				controllerAs: 'loginVM'
			})
			.when('/buttons', {
				templateUrl: '/partials/buttons.html',
				controller: 'ButtonsController',
				controllerAs: 'buttonsVM'
			})
			.when('/tools', {
				templateUrl: '/partials/tools.html',
				controller: 'ToolsController',
				controllerAs: 'toolsVM'
			})
			.when('/faders', {
				templateUrl: '/partials/faders.html',
				controller: 'FadersController',
				controllerAs: 'fadersVM'
			});

		$locationProvider.html5Mode(true);
	})

	.controller('ApplicationController', ['Socket', '$location', '$rootScope', function(Socket, $location, $rootScope) {
		var vm = this;
		this.SocketService = Socket;
		this.authed = false;

		function socketEvent(data) {
			if (data.event === 'connected') {
				//live app connects
				vm.authed = true;
				$location.path('/buttons');
			}
			if (data.event === 'disconnected') {
				//live app disconnects
				vm.authed = false;
				$location.path('/');
			}
			$rootScope.$apply();
		}

		Socket.socket.on('liveEvent', socketEvent);
		Socket.socket.on('disconnect', function() {
			//socket server disconnects
			$location.path('/');
			vm.authed = false;
			$rootScope.$apply();
		});

		if (!this.authed && $location.path() !== '/') {
			$location.path('/');
		}
	}])

	.controller('LoginController', ['Socket', '$location', '$rootScope', function(Socket, $location, $rootScope) {
		var vm = this;
		this.errors = {
			password: false
		};

		this.connect = function() {
			vm.errors.socket = false;
			vm.errors.password = false;
			Socket.socket.emit('connectLive', {
				ip: this.ip,
				password: this.password
			});
		}

		function socketEvent(data) {
			if (data.event === 'error' && data.data.type === 'BAD PASSWORD') {
				vm.errors.password = true;
			}
			if (data.event === 'error' && data.data.type === 'SOCKET') {
				vm.errors.socket = true;
			}
			$rootScope.$apply();
		}

		Socket.socket.on('liveEvent', socketEvent);
	}])

	.controller('ButtonsController', ['Socket', '$rootScope', '$sce', function(Socket, $rootScope, $sce) {
		var vm = this;

		vm.buttonData = {
			data: {}
		};

		vm.pageButtonRows = function (columnButtons) {
			var max = 0;
			var col;
			for (col in columnButtons) {
				if (columnButtons[col] > max) {
					max = columnButtons[col]
				}
			}
			return max;
		}

		vm.replaceTilde = function(button) {
			var txt = button.name.replace(/~/g, '<br />');
			if (button.flash) {
				txt += '<i class="fa fa-bolt button-icon"></i>';
			}
			return $sce.trustAsHtml(txt);
		}

		vm.rowSpanForButton = function(button, page) {
			var maxRows = vm.pageButtonRows(page.columnButtons);
			var buttonsInRow = page.columnButtons[button.column];

			return maxRows/buttonsInRow;
		}

		vm.setPressed = function(button) {
			Socket.socket.emit('sendLive', {
				command: 'buttonPress',
				args: [button.name]
			});
		};

		vm.release = function(button) {
			Socket.socket.emit('sendLive', {
				command: 'buttonRelease',
				args: [button.name]
			});
		};

		vm.mousedown = function(button) {
			if (button.flash) {
				this.setPressed(button);
			}
		};

		vm.mouseup = function(button) {
			if (button.flash) {
				this.release(button);
			}
		};

		vm.onSwipeLeft = function() {
			if (vm.activePageIndex === vm.buttonData.data.pages.length-1) {
				return;
			}
			vm.activePageIndex++;
		};

		vm.onSwipeRight = function() {
			if (vm.activePageIndex === 0) {
				vm.activePageIndex = null;
				return;
			}
			vm.activePageIndex--;
		};

		vm.orderButtons = function(btns) {
			return btns.sort(function(a,b){
				if (a.line > b.line) {
					return 1;
				}
				if (b.line > a.line) {
					return -1;
				}
				
				if (a.line === b.line) {
					if (a.column < b.column) {
						return -1;
					}
					if (a.column > b.column) {
						return 1;
					}
					
				}
				return 0;
			});
		}

		function getButton(name) {
			var toReturn = null;
			vm.buttonData.data.pages.forEach(function(page){
				page.buttons.forEach(function(btn){
					if (btn.name === name) {
						toReturn = btn;
					}
				});
			});
			return toReturn;
		}

		vm.activePageIndex = null;

		Socket.socket.on('liveEvent', function(data) {
			if (data.event === 'buttonList') {
				vm.buttonData.data = data.data;
			}

			var btn;
			if (data.event === 'buttonPress') {
				btn = getButton(data.data);
				if (btn) {
					btn.pressed = true;
				}
			}
			if (data.event === 'buttonRelease') {
				btn = getButton(data.data);
				if (btn) {
					btn.pressed = false;
				}
			}

			if (data.event === 'interfaceChange') {
				getButtonList();
			}
			$rootScope.$apply();
		});

		function getButtonList() {
			Socket.socket.emit('sendLive', {
				command: 'buttonList'
			});
		}

		getButtonList();
	}])

	.controller('ToolsController', ['Socket', 'BPMCounter', '$rootScope', function(Socket, BPMCounter, $rootScope) {
		this.frozen = false;
		this.autoBpm = false;
		this.manualBpmVal = null;

		this.bpmToggle =  function() {
			if (!this.autoBpm) {
				Socket.socket.emit('sendLive', {
					command: 'autoBpmOn'
				});
			} else {
				Socket.socket.emit('sendLive', {
					command: 'autoBpmOff'
				});
			}
		};

		this.freezeToggle = function() {
			if (!this.frozen) {
				Socket.socket.emit('sendLive', {
					command: 'freeze'
				});
			} else {
				Socket.socket.emit('sendLive', {
					command: 'unfreeze'
				});
			}
		};

		this.manualBPM = function() {
			BPMCounter.tap();
			if (BPMCounter.state.whole) {
				this.manualBpmVal = BPMCounter.state.whole;
				Socket.socket.emit('sendLive', {
					command: 'bpm',
					args: [BPMCounter.state.whole]
				});
			}
		};
		
	}])

	.controller('FadersController', ['Socket', '$rootScope', function(Socket, $rootScope) {
		var vm = this;

		vm.buttonData = {
			data: {}
		};

		this.sendFaderChange = function(fader, faderIndex) {
			Socket.socket.emit('sendLive', {
				command: 'faderChange',
				args: [faderIndex, fader.value]
			});
		}

		function getFader(index) {
			return vm.buttonData.data.faders[index];
		}

		Socket.socket.on('liveEvent', function(data) {
			if (data.event === 'buttonList') {
				vm.buttonData.data = data.data;
			}
			if (data.event === 'faderChange') {
				var fader = getFader(data.data.index);
				if (fader) {
					fader.value = data.data.value;
				} else {
					console.log('no btn')
				}
			}
			$rootScope.$apply();
		});

		Socket.socket.emit('sendLive', {
			command: 'buttonList'
		});
	}])

	.service('Socket', ['$rootScope', function($rootScope) {
		const SocketService = {
			socket: null,
			connected: false
		};

		SocketService.socket = io('http://localhost:3000');
		SocketService.socket.on('connect', function() {
			//socket server connects
			SocketService.connected = true;
			$rootScope.$apply();
		});
		SocketService.socket.on('disconnect', function() {
			//socket server disconnects
			SocketService.connected = false;
			$rootScope.$apply();
		});

		return SocketService;
	}]);
}());
