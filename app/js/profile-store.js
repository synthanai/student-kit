/* ═══════════════════════════════════════
   ProfileStore — IndexedDB Local Storage
   Zero server contact. All data on device.
   ═══════════════════════════════════════ */

const ProfileStore = (() => {
    const DB_NAME = 'arivar-profiles';
    const DB_VERSION = 1;
    let db = null;

    function open() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains('profiles')) {
                    database.createObjectStore('profiles', { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains('conversations')) {
                    database.createObjectStore('conversations', { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains('settings')) {
                    database.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async function put(storeName, data) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).put(data);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function get(storeName, id) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function getAll(storeName) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async function remove(storeName, id) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function clearAll() {
        const database = await open();
        return new Promise((resolve, reject) => {
            const storeNames = ['profiles', 'conversations', 'settings'];
            const tx = database.transaction(storeNames, 'readwrite');
            storeNames.forEach(name => tx.objectStore(name).clear());
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // Profile-specific helpers
    async function saveProfile(phase, profileData) {
        const existing = await get('profiles', 'main') || {
            id: 'main',
            core: null,
            personal: null,
            social: null,
            professional: null,
            direction: null,
            voice: null,
            stage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        existing[phase] = profileData;
        existing.updated_at = new Date().toISOString();

        // Update stage
        let stage = 0;
        if (existing.core) stage = 1;
        if (existing.personal) stage = 2;
        if (existing.social) stage = 3;
        if (existing.professional) stage = 4;
        existing.stage = stage;

        await put('profiles', existing);
        return existing;
    }

    async function getProfile() {
        return await get('profiles', 'main');
    }

    async function saveConversation(phase, messages) {
        await put('conversations', {
            id: phase,
            messages,
            updated_at: new Date().toISOString()
        });
    }

    async function getConversation(phase) {
        return await get('conversations', phase);
    }

    async function getSetting(key, defaultValue) {
        const result = await get('settings', key);
        return result ? result.value : defaultValue;
    }

    async function setSetting(key, value) {
        await put('settings', { key, value });
    }

    // Export profile as .arivar JSON
    async function exportProfile() {
        const profile = await getProfile();
        if (!profile) return null;
        return {
            format: 'arivar-profile',
            version: '1.0',
            exported_at: new Date().toISOString(),
            profile
        };
    }

    return {
        open,
        saveProfile,
        getProfile,
        saveConversation,
        getConversation,
        getSetting,
        setSetting,
        clearAll,
        exportProfile
    };
})();
