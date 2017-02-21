(function() {
	angular.module('TheLightingControllerClientExampleApp')
		.service('BPMCounter', [function() {
			var resetAfter = 2; //seconds

			var state = {
				count: 0,
				msecsFirst: 0,
				msecsPrevious: 0,
				average: 0,
				whole: 0

			};

			function ResetCount() {
				state.count = 0;
			}

			function tap() {
				timeSeconds = new Date();
				msecs = timeSeconds.getTime();
				if ((msecs - state.msecsPrevious) > 1000 * resetAfter) {
					state.count = 0;
				}

				if (state.count === 0) {
					state.msecsFirst = msecs;
					state.count = 1;
				} else {
					bpmAvg = 60000 * state.count / (msecs - state.msecsFirst);
					state.average = Math.round(bpmAvg * 100) / 100;
					state.whole = Math.round(bpmAvg);
					state.count++;
				}
				state.msecsPrevious = msecs;
			}
			
			return {
				tap: tap,
				state: state
			};

		}]);
}());
