/* global loadSavedRunkeeperTweets, Tweet */

let writtenTweets = []; // store only user-written tweets

function parseTweets(runkeeper_tweets) {
  //Do not proceed if no tweets loaded
  if (runkeeper_tweets === undefined) {
    window.alert('No tweets returned');
    return;
  }

  // TODO: Filter to just the written tweets
  const all = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at)); // <-- Tweet, not tweet_array
  writtenTweets = all.filter(t => t.written);
}

function addEventHandlerForSearch() {
  // TODO: Search the written tweets as text is entered into the search box, and add them to the table
  const input = document.getElementById('textFilter');
  const countSpan = document.getElementById('searchCount');
  const textSpan = document.getElementById('searchText');

  // Prefer a <tbody> inside #tweetTable; fall back if your template names it differently
  const tbody =
    document.querySelector('#tweetTable tbody') ||
    document.getElementById('tweetTableBody') ||
    document.getElementById('tweetTable');

  function update(query) {
    const q = (query || '').trim();
    if (textSpan) textSpan.textContent = q;
    if (tbody) tbody.innerHTML = '';

    if (q === '') {
      if (countSpan) countSpan.textContent = '0';
      return; // clear table when empty string
    }

    const norm = q.toLowerCase();
    // search the user-written portion first; fall back to full text just in case
    const matches = writtenTweets.filter(t => {
      const wt = (t.writtenText || '').toLowerCase();
      const full = (t.text || '').toLowerCase();
      return wt.includes(norm) || full.includes(norm);
    });

    if (countSpan) countSpan.textContent = String(matches.length);

    // Build rows via the helper on Tweet (includes clickable links)
    if (tbody) {
      matches.forEach((t, i) => {
        tbody.insertAdjacentHTML('beforeend', t.getHTMLTableRow(i + 1));
      });
    }
  }

  if (input) {
    input.addEventListener('input', (e) => update(e.target.value));
    // render immediately with whatever is in the box
    update(input.value);
  }
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
  addEventHandlerForSearch();
  loadSavedRunkeeperTweets().then(parseTweets);
});