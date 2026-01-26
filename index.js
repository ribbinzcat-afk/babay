// Import function (ตรวจสอบ Path ให้ถูกต้องตามโครงสร้างโฟลเดอร์ของคุณ)
import { extension_settings, getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "interactive-phone";
// ใส่ Regex เพื่อให้รองรับการดึงข้อมูล JSON จากแชท
const DATA_REGEX = /```json\s*({[\s\S]*?})\s*```/i;

let phoneState = {
    bankBalance: "5,000.00 ฿",
    tweets: [],
    messages: [],
    notes: [],
    wallpaper: "https://images.unsplash.com/photo-1557683311-eac922347aa1" // เพิ่มรูปพื้นหลังเริ่มต้น
};

const phoneStyles = `
    /* ... (CSS เดิมของคุณ) ... */
    #smart-phone-container {
        position: fixed; bottom: 20px; right: 20px; width: 300px; height: 600px;
        background-color: #000; border-radius: 30px; border: 8px solid #333;
        overflow: hidden; z-index: 2000; display: none;
        font-family: 'Segoe UI', sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    #phone-screen { width: 100%; height: 100%; background-size: cover; background-position: center; position: relative; color: white; }
    .status-bar { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 12px; background: rgba(0,0,0,0.3); }
    .app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 20px; }
    .app-icon { width: 50px; height: 50px; border-radius: 12px; background: #fff; display: flex; justify-content: center; align-items: center; font-size: 24px; color: #333; cursor: pointer; }
    .app-window { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; color: #333; transform: translateY(100%); transition: 0.3s; z-index: 100; }
    .app-window.open { transform: translateY(0); }
    .home-indicator { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 100px; height: 4px; background: #aaa; border-radius: 2px; cursor: pointer; }
`;

function injectStyles() {
    // โหลด FontAwesome ถ้ายังไม่มี (สำคัญมากเพื่อให้ไอคอนขึ้น)
    if ($('link[href*="font-awesome"]').length === 0) {
        $('head').append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">');
    }
    // แก้ไข: ต้องใส่ <style> ในวงเล็บ
    if ($('#interactive-phone-styles').length === 0) {
        $('<style>')
            .attr('id', 'interactive-phone-styles')
            .text(phoneStyles)
            .appendTo('head');
    }
}

function createPhoneUI() {
    if ($('#smart-phone-container').length) return;
    
    // สร้างโครงสร้าง HTML (ตามที่คุณเขียนไว้)
    const html = `
        <div id="smart-phone-container">
            <div id="phone-screen" style="background-image: url('${phoneState.wallpaper}')">
                <div class="status-bar">
                    <span id="phone-clock">00:00</span>
                    <span><i class="fa-solid fa-wifi"></i> <i class="fa-solid fa-battery-full"></i></span>
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
                </div>
                <div id="app-bank" class="app-window">
                    <div style="padding:20px;">
                        <i class="fa-solid fa-chevron-left" onclick="closeApp('bank')"></i> 
                        <h2 id="bank-balance">${phoneState.bankBalance}</h2>
                    </div>
                </div>
                <div id="app-twitter" class="app-window">
                   <div style="padding:20px;"><i class="fa-solid fa-chevron-left" onclick="closeApp('twitter')"></i> Twitter Feed</div>
                   <div id="twitter-feed" style="padding:10px;"></div>
                </div>
                <div class="home-indicator" onclick="closeAllApps()"></div>
            </div>
        </div>
    `;
    $('body').append(html);

    // Bind ฟังก์ชันเข้ากับ Window เพื่อให้ onclick ใน HTML หาเจอ
    window.openApp = (name) => $(`#app-${name}`).addClass('open');
    window.closeApp = (name) => $(`#app-${name}`).removeClass('open');
    window.closeAllApps = () => $('.app-window').removeClass('open');
    window.togglePhone = () => {
        $('#smart-phone-container').fadeToggle(200);
    };
}

// ... (ฟังก์ชัน startClock, handleNewMessage คงเดิม) ...

jQuery(async () => {
    injectStyles();
    createPhoneUI();

    if ($('#phone-toggle-btn').length === 0) {
        // แก้ไข: ต้องใส่ <i> ในวงเล็บ
        const menuBtn = $('<i>').attr({
            id: 'phone-toggle-btn',
            title: 'Open Phone'
        }).addClass('fa-solid fa-mobile-screen-button').css({
            cursor: 'pointer', margin: '0 10px', fontSize: '1.2em',
            color: 'var(--smart-theme-body-color, #ccc)'
        }).on('click', window.togglePhone);

        const targetContainer = $('#extensions_settings');
        if(targetContainer.length) {
            targetContainer.append(menuBtn);
        } else {
            // ถ้าไม่เจอเมนูตั้งค่า ให้แปะปุ่มลอยไว้ที่ขอบจอ
            menuBtn.css({
                position:'fixed', top:'20px', right:'20px', 
                zIndex:3000, background:'#333', padding:'10px', borderRadius:'50%', color: '#fff'
            });
            $('body').append(menuBtn);
        }
    }
    
    console.log("Interactive Phone Loaded!");
});
