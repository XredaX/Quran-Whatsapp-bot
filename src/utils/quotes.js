const inspirationalQuotes = [
    "📖 The Prophet ﷺ said: 'The best among you are those who learn the Quran and teach it.' (Bukhari)",
    "✨ The Prophet ﷺ said: 'Read the Quran, for it will come as an intercessor for its reciters on the Day of Resurrection.' (Muslim)",
    "🌟 The Prophet ﷺ said: 'Whoever reads a letter from the Book of Allah will receive a hasanah (good deed), and every hasanah will be multiplied by ten.' (Tirmidhi)",
    "💫 The Prophet ﷺ said: 'The one who is proficient in the recitation of the Quran will be with the honorable and obedient scribes (angels).' (Bukhari & Muslim)",
    "🤲 Allah says: 'Indeed, this Quran guides to that which is most suitable.' (Quran 17:9)",
    "📿 The Prophet ﷺ said: 'Verily, the one who recites the Quran beautifully will be in the company of the noble and obedient angels.' (Bukhari)",
    "🌙 The Prophet ﷺ said: 'The Quran is an intercessor and it is deservedly believed in.' (Ibn Majah)",
    "⭐ Abdullah ibn Mas'ud reported: The Prophet ﷺ said, 'This Quran is a banquet from Allah, so learn as much as you can from His banquet.' (Hakim)",
    "🕌 The Prophet ﷺ said: 'Whoever recites the Quran and acts upon it, his parents will be given a crown on the Day of Resurrection.' (Abu Dawud)",
    "💎 The Prophet ﷺ said: 'The reciter of the Quran will be told on the Day of Judgment: Read and ascend, and recite as you used to recite in the world.' (Tirmidhi)"
];

function getRandomQuote() {
    return inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
}

module.exports = {
    inspirationalQuotes,
    getRandomQuote
};
