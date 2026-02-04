require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

function dedupeProviders(providers = []) {
    const map = new Map();
    providers.forEach(p => {
        if (!p || !p.name) return;
        if (!map.has(p.name)) {
            map.set(p.name, p);
        }
    });
    return Array.from(map.values());
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[CLEANUP] Connected to MongoDB');

    const invalidQuery = {
        $or: [
            { title: { $exists: false } },
            { title: null },
            { title: '' }
        ]
    };

    const invalidCount = await Movie.countDocuments(invalidQuery);
    console.log(`[CLEANUP] Invalid movies found: ${invalidCount}`);

    if (invalidCount > 0) {
        const result = await Movie.deleteMany(invalidQuery);
        console.log(`[CLEANUP] Deleted invalid movies: ${result.deletedCount}`);
    }

    const cursor = Movie.find({ watchProviders: { $exists: true, $ne: [] } }).cursor();
    let updated = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        const deduped = dedupeProviders(doc.watchProviders);
        if (deduped.length !== doc.watchProviders.length) {
            doc.watchProviders = deduped;
            await doc.save();
            updated += 1;
        }
    }

    console.log(`[CLEANUP] Deduped watchProviders on ${updated} movies`);
    await mongoose.disconnect();
    console.log('[CLEANUP] Done');
}

run().catch(err => {
    console.error('[CLEANUP] Error:', err.message);
    process.exit(1);
});
