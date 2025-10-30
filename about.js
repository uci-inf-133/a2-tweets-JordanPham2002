let tweet_array = [];

function parseTweets(runkeeper_tweets) {
  //Do not proceed if no tweets loaded
  if (runkeeper_tweets === undefined) {
    window.alert('No tweets returned');
    return;
  }

  // Build Tweet objects
  tweet_array = runkeeper_tweets.map(function (tweet) {
    return new Tweet(tweet.text, tweet.created_at);
  });

  //This line modifies the DOM, searching for the tag with the numberTweets ID and updating the text.
  //It works correctly, your task is to update the text of the other tags in the HTML file!
  document.getElementById('numberTweets').innerText = String(tweet_array.length);

  // Dates: earliest & latest
  if (tweet_array.length > 0) {
    const byTime = [...tweet_array].sort((a, b) => a.time - b.time);
    const first = byTime[0].time;
    const last = byTime[byTime.length - 1].time;

    const fmt = (d) =>
      d.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    document.getElementById('firstDate').innerText = fmt(first);
    document.getElementById('lastDate').innerText = fmt(last);
  }

  // Category counts
  const counts = { completed: 0, live: 0, achievement: 0, misc: 0 };
  const normalize = (s) =>
    ({
      completed_event: 'completed',
      live_event: 'live',
      achievement: 'achievement',
      miscellaneous: 'misc',
    }[s] || s);

  tweet_array.forEach((t) => {
    const key = normalize(t.source);
    counts[key] = (counts[key] || 0) + 1;
  });

  // Percent helper (of all tweets)
  const total = tweet_array.length || 1;
  const pct = (n) =>
    (typeof math !== 'undefined'
      ? math.format((n * 100) / total, { notation: 'fixed', precision: 2 })
      : ((n * 100) / total).toFixed(2)) + '%';

  // Helper: set all elements with a class
  const setAll = (cls, val) =>
    document.querySelectorAll('.' + cls).forEach((el) => {
      el.textContent = val;
    });

  // Fill counts + percentages
  setAll('completedEvents', String(counts.completed));
  setAll('completedEventsPct', pct(counts.completed));

  setAll('liveEvents', String(counts.live));
  setAll('liveEventsPct', pct(counts.live));

  setAll('achievements', String(counts.achievement));
  setAll('achievementsPct', pct(counts.achievement));

  setAll('miscellaneous', String(counts.misc));
  setAll('miscellaneousPct', pct(counts.misc));

  // Written among completed
  const completed = tweet_array.filter((t) => normalize(t.source) === 'completed');
  const writtenCompleted = completed.filter((t) => t.written); // <-- removed stray character

  // Count
  setAll('written', String(writtenCompleted.length));

  // Percentage (of completed)
  const writtenPct =
    completed.length === 0
      ? '0.00%'
      : (typeof math !== 'undefined'
          ? math.format((writtenCompleted.length * 100) / completed.length, {
              notation: 'fixed',
              precision: 2,
            })
          : ((writtenCompleted.length * 100) / completed.length).toFixed(2)) + '%';

  setAll('writtenPct', writtenPct);
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
  loadSavedRunkeeperTweets().then(parseTweets);
});