import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "interactive-phone";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default Settings & State
const defaultSettings = {
    enabled: true,
    wallpaper: "https://images.unsplash.com/photo-1554147090-e1221a04a0bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
};

let phoneState = {
    bankBalance: "5,000.00 ฿",
    tweets: [],
    messages: [],
    notes: [],
    logs: {
        location: "Unknown",
        date: "Unknown",
        time: "Unknown",
        weather: "Unknown",
        clothes: "Casual",
        event: "None",
        summary: "No data yet."
    }
};

// Regex to capture JSON from AI response
const DATA_REGEX = //i;

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    // Load wallpaper from settings if available
    if(extension_settings[extensionName].wallpaper){
         // Update UI wallpaper logic here if needed initially
    }
}

function createPhoneUI() {
    // Check if UI already exists
    if (document.getElementById('smart-phone-container')) return;
    const html = `
        <div id="smart-phone-container">
            <div id="phone-screen" style="background-image: ${phoneState.wallpaper}">
                <div class="status-bar">
                    <span id="phone-clock">12:00</span>
                    <span><i class="fa-solid fa-wifi"></i> <i class="fa-solid fa-battery-full"></i> 100%</span>
                </div>

                <div class="app-grid">
                    <div class="app-item" onclick="openApp('bank')">
                        <div class="app-icon" style="color: #2ecc71"><i class="fa-solid fa-building-columns"></i></div>
                        <div class="app-label">Bank</div>
                    </div>
                    <div class="app-item" onclick="openApp('twitter')">
                        <div class="app-icon" style="color: #1da1f2"><i class="fa-brands fa-twitter"></i></div>
                        <div class="app-label">Twitter</div>
                    </div>
                    <div class="app-item" onclick="openApp('messages')">
                        <div class="app-icon" style="color: #27ae60"><i class="fa-solid fa-comment"></i></div>
                        <div class="app-label">Message</div>
                    </div>
                    <div class="app-item" onclick="openApp('notes')">
                        <div class="app-icon" style="color: #f1c40f"><i class="fa-solid fa-note-sticky"></i></div>
                        <div class="app-label">Notes</div>
                    </div>
                    <div class="app-item" onclick="openApp('settings')">
                        <div class="app-icon" style="color: #95a5a6"><i class="fa-solid fa-gear"></i></div>
                        <div class="app-label">System Log</div>
                    </div>
                </div>

                <!-- App Windows -->
                <div id="app-bank" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('bank')"></i> Mobile Banking</div>
                    <div class="app-content">
                        <div class="bank-card">
                            <div>Savings Account</div>
                            <h2 id="bank-balance">${phoneState.bankBalance}</h2>
                            <div>**** **** **** 1234</div>
                        </div>
                        <div>Recent Transactions</div>
                        <hr>
                        <div style="margin-top:10px; color:#888; text-align:center;">No recent history</div>
                    </div>
                </div>

                <div id="app-twitter" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('twitter')"></i> Twitter</div>
                    <div class="app-content" id="twitter-feed">
                        <!-- Tweets go here -->
                    </div>
                </div>

                <div id="app-messages" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('messages')"></i> Messages</div>
                    <div class="app-content" id="message-list">
                        <!-- Messages go here -->
                    </div>
                </div>

                <div id="app-notes" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('notes')"></i> Notes</div>
                    <div class="app-content" id="note-list">
                        <!-- Notes go here -->
                    </div>
                </div>

                <div id="app-settings" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('settings')"></i> System Log</div>
                    <div class="app-content">
                        <h3>Current Status</h3>
                        <div class="log-entry"><strong>Location:</strong> <span id="log-loc">Unknown</span></div>
                        <div class="log-entry"><strong>Date:</strong> <span id="log-date">Unknown</span></div>
                        <div class="log-entry"><strong>Time:</strong> <span id="log-time">Unknown</span></div>
                        <div class="log-entry"><strong>Weather:</strong> <span id="log-weather">Unknown</span></div>
                        <div class="log-entry"><strong>Clothes:</strong> <span id="log-clothes">Unknown</span></div>
                        <div class="log-entry"><strong>Event:</strong> <span id="log-event">None</span></div>
                        <hr>
                        <h4>Summary</h4>
                        <p id="log-summary" style="font-size:12px; color:#555;">...</p>
                    </div>
                </div>

                <div class="home-indicator" onclick="closeAllApps()"></div>
            </div>
        </div>
    `;

        $('body').append(html);

    // Bind Events using jQuery for consistency
    window.openApp = (appName) => $(`#app-${appName}`).addClass('open');
    window.closeApp = (appName) => $(`#app-${appName}`).removeClass('open');
    window.closeAllApps = () => $('.app-window').removeClass('open');
    window.togglePhone = () => {
        const p = $('#smart-phone-container');
        if (p.css('display') === 'none') p.show(); else p.hide();
    };
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const clockEl = document.getElementById('phone-clock');
        if(clockEl) clockEl.innerText = timeStr;
    }, 1000);
}

function handleNewMessage(mesId) {
    const context = getContext();
    // Safety check
    if (!context.chat || context.chat.length === 0) return;

    const lastMsg = context.chat[context.chat.length - 1].mes;
    const match = lastMsg.match(DATA_REGEX);

    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            updatePhoneData(data);
        } catch (e) {
            console.error(<q>"[Interactive Phone] Failed to parse JSON"</q>, e);
        }
    }
}

function updatePhoneData(data) {
    if(data.wallpaper) {
        $('#phone-screen').css('background-image', `url('${data.wallpaper}')`);
        // Optional: Save wallpaper to settings so it persists
        extension_settings[extensionName].wallpaper = data.wallpaper;
        saveSettingsDebounced();
    }

    if(data.bank) {
        $('#bank-balance').text(data.bank);
    }

    if(data.twitter_new) {
        const tweetHtml = `

                @User
                ${data.twitter_new}
            `;
        $('#twitter-feed').prepend(tweetHtml);
    }

    if(data.message_new) {
         const msgHtml = `${data.message_new}`;
         $('#message-list').append(msgHtml);
    }

    if(data.note_new) {
         const noteHtml = `${data.note_new}`;
         $('#note-list').prepend(noteHtml);
    }

    if(data.log) {
        if(data.log.location) $('#log-loc').text(data.log.location);
        if(data.log.date) $('#log-date').text(data.log.date);
        if(data.log.time) $('#log-time').text(data.log.time);
        if(data.log.weather) $('#log-weather').text(data.log.weather);
        if(data.log.clothes) $('#log-clothes').text(data.log.clothes);
        if(data.log.event) $('#log-event').text(data.log.event);
        if(data.log.summary) $('#log-summary').text(data.log.summary);
    }
}

// Main Entry Point
jQuery(async () => {
    // Load Settings
    await loadSettings();

    // Create UI
    createPhoneUI();

    // Add Toggle Button to Extension Menu (Example location)
    // Check if button already exists to prevent duplicates
    if ($('#phone-toggle-btn').length === 0) {
        const menuBtn = $('').attr({
            id: 'phone-toggle-btn',
            title: 'Open Phone'
        }).css({
            cursor: 'pointer',
            margin: '0 10px',
            fontSize: '1.2em'
        }).on('click', window.togglePhone);

        // Append to a suitable container, e.g., #extensionsMenu or a specific toolbar
        // For now, let's float it or append to body for visibility if menu not found
        const targetContainer = $('#extensionsMenu');
        if(targetContainer.length) {
            targetContainer.append(menuBtn);
        } else {
            // Fallback: Fixed floating button
            menuBtn.css({
                position: 'fixed',
                top: '10px',
                right: '100px',
                zIndex: 2001,
                color: 'white',
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '50%'
            });
            $('body').append(menuBtn);
        }
    }

    // Start Clock
    startClock();

    // Listen for AI Message
    eventSource.on(event_types.MESSAGE_RECEIVED, handleNewMessage);

    console.log(`${extensionName} loaded successfully.`);
});
