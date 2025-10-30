"use strict";
class Tweet {
    text;
    time;
    constructor(tweet_text, tweet_time) {
        this.text = (tweet_text ?? '').trim();
        this.time = new Date(tweet_time); //, "ddd MMM D HH:mm:ss Z YYYY"
    }
    //returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source() {
        //TODO: identify whether the source is a live event, an achievement, a completed event, or miscellaneous.
        const t = this.text.toLowerCase();
        // Achievement signals
        if (t.includes('achieved a new personal record') ||
            t.includes('personal record') ||
            t.includes('personal best') ||
            t.includes('set a goal')) {
            return 'achievement';
        }
        // Live event signals
        if ((t.includes(' live') && t.includes('@runkeeper')) ||
            t.includes('using @runkeeper live') ||
            (t.includes('watch my') && t.includes('live') && t.includes('@runkeeper'))) {
            return 'live_event';
        }
        // Completed event signals
        if (t.startsWith('just completed') || t.startsWith('just posted')) {
            return 'completed_event';
        }
        // Anything else RunKeeper-related
        if (t.includes('runkeeper') || t.includes('@runkeeper')) {
            return 'miscellaneous';
        }
        return "miscellaneous";
    }
    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written() {
        //TODO: identify whether the tweet is written
        // Remove URL(s), hashtags, and boilerplate to see if any real text remains
        const stripped = this._stripSystemBits();
        // Consider it written if at least two letters or emoji-like chars remain
        return /[A-Za-z]{2,}|[\u{1F300}-\u{1FAFF}]/u.test(stripped);
    }
    get writtenText() {
        if (!this.written) {
            return "";
        }
        //TODO: parse the written text from the tweet
        // Typical user text appears after " - " before any URL/hashtag.
        const txt = this.text;
        const beforeUrl = txt.replace(/https?:\/\/\S+/gi, '').replace(/#\w+/g, '').trim();
        const hyphenIdx = beforeUrl.indexOf(' - ');
        if (hyphenIdx >= 0) {
            let candidate = beforeUrl.slice(hyphenIdx + 3).trim();
            // remove common non-user boilerplate
            candidate = candidate.replace(/\bTomTom MySports Watch\b/gi, '').trim();
            candidate = candidate.replace(/\s{2,}/g, ' ').replace(/^[\s\.,;:!\-–—]+|[\s\.,;:!\-–—]+$/g, '');
            return candidate;
        }
        // Fallback: return the stripped remainder if any
        return this._stripSystemBits();
    }
    get activityType() {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        //TODO: parse the activity type from the text of the tweet
        const t = this.text.toLowerCase();
        // Map of possible mentions -> normalized type
        const map = {
            'running': 'run', 'run': 'run',
            'walking': 'walk', 'walk': 'walk',
            'cycling': 'bike', 'cycle': 'bike', 'biking': 'bike', 'bike': 'bike',
            'hiking': 'hike', 'hike': 'hike',
            'swimming': 'swim', 'swim': 'swim',
            'chair ride': 'chair ride', 'chairride': 'chair ride',
            'spinning': 'spinning', 'spin': 'spinning',
            'elliptical': 'elliptical',
            'rowing': 'row', 'row': 'row',
            'skiing': 'ski', 'ski': 'ski',
            'yoga': 'yoga',
            'barre': 'barre',
            'strength': 'strength',
            'workout': 'workout',
            'sports': 'sports',
            'football': 'football'
        };
        // Try multi-word first (e.g., "chair ride")
        if (t.includes('chair ride'))
            return 'chair ride';
        for (const key of Object.keys(map)) {
            const re = new RegExp(`\\b${key}\\b`, 'i');
            if (re.test(t))
                return map[key];
        }
        return "";
    }
    get distance() {
        if (this.source != 'completed_event') {
            return 0;
        }
        //TODO: prase the distance from the text of the tweet
        // Look for "<number> (mi|miles|km|kilometers)"
        const m = this.text.match(/(\d+(?:\.\d+)?)\s*(mi|miles|km|kilometers?)/i);
        if (!m)
            return 0;
        const value = parseFloat(m[1]);
        const unit = m[2].toLowerCase();
        if (unit === 'mi' || unit === 'miles')
            return value;
        // km -> miles (approx)
        return value / 1.609;
    }
    getHTMLTableRow(rowNumber) {
        //TODO: return a table row which summarizes the tweet with a clickable link to the RunKeeper activity
        const activity = (this.source === 'completed_event') ? (this.activityType || '') : '';
        // Linkify any URLs in the original text
        const linked = this.text.replace(/(https?:\/\/[^\s]+)/gi, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
        return `<tr><td>${rowNumber}</td><td>${activity}</td><td>${linked}</td></tr>`;
    }
    // ---- helper(s) (no TODOs changed below) ----
    _stripSystemBits() {
        let s = this.text;
        // Remove URLs and hashtags
        s = s.replace(/https?:\/\/\S+/gi, ' ').replace(/#\w+/g, ' ').trim();
        // Remove common RK boilerplate phrases
        const boiler = [
            /^just completed[^-]*-/i,
            /^just completed[^!]*!/i,
            /^just completed/i,
            /^just posted[^-]*-/i,
            /^just posted[^!]*!/i,
            /^just posted/i,
            /with @runkeeper/gi,
            /using @runkeeper/gi,
            /on @runkeeper/gi,
            /check it out/gi,
            /view my activity/gi,
            /achieved a new personal record/gi,
            /personal best/gi,
            /personal record/gi,
            /watch my .* with @runkeeper live/gi,
            /\bTomTom MySports Watch\b/gi
        ];
        boiler.forEach(re => { s = s.replace(re, ' ').trim(); });
        // Collapse whitespace and trim punctuation
        s = s.replace(/\s{2,}/g, ' ');
        s = s.replace(/^[\s\.,;:!\-–—]+|[\s\.,;:!\-–—]+$/g, '');
        return s;
    }
    // (handy for charts; safe addition)
    get dayOfWeek() {
        const d = this.time.getDay(); // 0..6
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d];
    }
}
