let tweet_array = [];

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	//TODO: create a new array or manipulate tweet_array to create a graph of the number of tweets containing each type of activity.
	// We'll keep values = tweet_array and let Vega-Lite aggregate counts by activityType.

	// Convert Tweet objects → plain JSON-like data that Vega-Lite can actually read
	// (still derived directly from tweet_array — not a new logical dataset)
	const dataValues = tweet_array.map(t => ({
		source: t.source,
		activityType: t.activityType,
		distance: t.distance,
		dayOfWeek: t.dayOfWeek
	}));

	activity_vis_spec = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "A graph of the number of Tweets containing each type of activity.",
	  "data": {
	    "values": dataValues // still from tweet_array
	  },
	  //TODO: Add mark and encoding
	  "transform": [
		{ "filter": "datum.source === 'completed_event'" }
	  ],
	  "mark": "bar",
	  "encoding": {
		"x": { "field": "activityType", "type": "nominal", "sort": "-y", "title": "Activity type" },
		"y": { "aggregate": "count", "type": "quantitative", "title": "Tweets" },
		"tooltip": [
			{ "field": "activityType", "title": "Activity" },
			{ "aggregate": "count", "title": "Tweets" }
		]
	  },
	  "width": "container",
	  "height": 300
	};

	vegaEmbed('#activityVis', activity_vis_spec, {actions:false})
		.catch(err => console.error("Error embedding activityVis:", err));

	// Compute top 3 most common activities
	const completed = tweet_array.filter(t => t.source === 'completed_event' && t.activityType && t.activityType !== 'unknown');
	const freq = new Map();
	completed.forEach(t => freq.set(t.activityType, (freq.get(t.activityType) ?? 0) + 1));
	const top3 = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);

	if (document.getElementById('numberActivities')) {
		const distinct = new Set(completed.map(t => t.activityType));
		document.getElementById('numberActivities').innerText = String(distinct.size);
	}
	if (document.getElementById('firstMost'))  document.getElementById('firstMost').innerText  = top3[0] ?? '';
	if (document.getElementById('secondMost')) document.getElementById('secondMost').innerText = top3[1] ?? '';
	if (document.getElementById('thirdMost'))  document.getElementById('thirdMost').innerText  = top3[2] ?? '';

	//TODO: create the visualizations which group the three most-tweeted activities by the day of the week.
	//Use those visualizations to answer the questions about which activities tended to be longest and when.

	const dayOrder = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

	const specRaw = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "Distances by day (raw points) for the three most tweeted activities",
	  "data": { "values": dataValues },
	  "transform": [
		{ "filter": "datum.source === 'completed_event'" },
		{ "filter": {"field":"activityType", "oneOf": top3} }
	  ],
	  "mark": "point",
	  "encoding": {
		"x": { "field": "dayOfWeek", "type": "ordinal", "sort": dayOrder, "title": "Day of week" },
		"y": { "field": "distance", "type": "quantitative", "title": "Distance (mi)" },
		"color": { "field": "activityType", "type": "nominal", "title": "Activity" },
		"tooltip": [
			{ "field": "activityType", "title": "Activity" },
			{ "field": "dayOfWeek", "title": "Day" },
			{ "field": "distance", "title": "Miles" }
		]
	  },
	  "width": "container",
	  "height": 360
	};

	const specAgg = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "Mean distance by day for the three most tweeted activities (aggregated)",
	  "data": { "values": dataValues },
	  "transform": [
		{ "filter": "datum.source === 'completed_event'" },
		{ "filter": {"field":"activityType", "oneOf": top3} }
	  ],
	  "mark": "bar",
	  "encoding": {
		"column": { "field": "activityType", "type": "nominal", "title": "Activity" },
		"x": { "field": "dayOfWeek", "type": "ordinal", "sort": dayOrder, "title": "Day of week" },
		"y": { "aggregate": "mean", "field": "distance", "type": "quantitative", "title": "Mean distance (mi)" },
		"tooltip": [
			{ "field": "activityType", "title": "Activity" },
			{ "field": "dayOfWeek", "title": "Day" },
			{ "aggregate": "mean", "field": "distance", "title": "Mean miles" }
		]
	  },
	  "width": 220,
	  "height": 280
	};

	// Render first (raw) chart
	let showingAggregate = false;
	vegaEmbed('#distanceVis', specRaw, {actions:false})
		.catch(err => console.error("Error embedding distanceVis:", err));

	const btn = document.getElementById('aggregate');
	if (btn) {
		btn.addEventListener('click', () => {
			showingAggregate = !showingAggregate;
			if (showingAggregate) {
				vegaEmbed('#distanceVisAggregated', specAgg, {actions:false});
				document.getElementById('distanceVis').style.display = 'none';
				document.getElementById('distanceVisAggregated').style.display = 'block';
				btn.innerText = 'Show raw distances';
			} else {
				vegaEmbed('#distanceVis', specRaw, {actions:false});
				document.getElementById('distanceVisAggregated').style.display = 'none';
				document.getElementById('distanceVis').style.display = 'block';
				btn.innerText = 'Show means';
			}
		});
	}

	// Compute longest/shortest averages
	const isWeekend = d => d === 'Sat' || d === 'Sun';
	const avg = arr => arr.reduce((a,b)=>a+b,0) / Math.max(1,arr.length);
	const grouped = {};
	completed.forEach(t => {
		if(!grouped[t.activityType]) grouped[t.activityType] = [];
		grouped[t.activityType].push(t.distance);
	});
	const averages = Object.entries(grouped)
		.map(([act, arr]) => ({act, mean: avg(arr)}))
		.sort((a,b)=>b.mean - a.mean);

	if (document.getElementById('longestActivityType'))  document.getElementById('longestActivityType').innerText  = averages[0]?.act ?? '';
	if (document.getElementById('shortestActivityType')) document.getElementById('shortestActivityType').innerText = averages.at(-1)?.act ?? '';

	const weekendAvg = avg(completed.filter(t => isWeekend(t.dayOfWeek)).map(t => t.distance));
	const weekdayAvg = avg(completed.filter(t => !isWeekend(t.dayOfWeek)).map(t => t.distance));
	if (document.getElementById('weekdayOrWeekendLonger')) {
		document.getElementById('weekdayOrWeekendLonger').innerText = weekendAvg > weekdayAvg ? 'weekends' : 'weekdays';
	}
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});