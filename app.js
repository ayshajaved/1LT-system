/**
 * 1LT Systems - Demand Orchestration SPA
 * FINAL EXECUTION - Investor Presentation Prototype
 * State Sync + One-Way B1 Flow + Flex Centering
 */

const state = {
    currentScreen: 'A1',
    cartItems: [],
    subtotal: 0,
    itemCount: 0,
    batchStage: 0, // 0: 6 orders, 1: 5 orders, 2: 3 orders
    clusterImpactScore: 0,
    popupShown: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false },
    b1Timeout: null
};

const screens = {
    'A1': 'A1.html',
    'A3': 'A3.html',
    'A4': 'A4.html',
    'A5': 'A5.html',
    'B1': 'B1_1.html',
    'B1_2': 'B1_2.html',
    'B1_3': 'B1_3.html',
    'B3': 'B3.html',
    'B5': 'B5.html'
};

const popupContent = {
    1: { title: "Start with live local demand", body: "The experience begins by detecting live order activity around the customer’s location. This is not a normal one-off ordering flow. The platform is already measuring nearby participation before the order is placed." },
    2: { title: "The batch is forming", body: "As the customer browses and adds items, the system tracks nearby participation in real time. The order is not isolated. It is entering a live cluster that can unlock better pricing and better delivery timing." },
    3: { title: "Demand is getting stronger", body: "The cluster threshold is tightening because more nearby orders are joining the batch. This is where the platform begins creating an efficiency advantage over individual delivery." },
    4: { title: "The order is nearing unlock", body: "The customer is now close to the point where the batch becomes meaningfully more efficient. As the threshold tightens, the system improves both discount potential and dispatch timing." },
    5: { title: "The customer benefit is now visible", body: "Once enough nearby orders join, the group-buy discount unlocks and the batch can move earlier. The customer now sees the reward directly: lower cost and faster delivery created by shared local demand." },
    6: { title: "The transaction logic is now clear", body: "This screen makes the economics visible. The customer sees the subtotal, the group-buy discount, the platform fee, the final total, and how value is divided between the restaurant and the platform." },
    7: { title: "Now move from customer view to system view", body: "You have just seen how the customer experiences the platform. The next screens show what is happening behind that experience: orchestration, cluster management, settlement, and the intelligence layer that creates the moat." },
    8: { title: "This is where the moat becomes investable", body: "The platform is not only improving delivery flow. It is also structuring how money moves, how settlement works, how fees are captured, and how operational intelligence compounds into a defensible advantage over new entrants." },
    9: { title: "The model is now complete", body: "You have now seen the full system logic: live local demand, cluster formation, group-buy activation, optimized checkout, orchestration, settlement, and compounding intelligence. This is the foundation of the 1LT operating model.", buttonLabel: "End Experience" }
};

const menuPricing = {
    "Rasta Pasta": 14.00,
    "¼ Rotisserie Chicken dinner": 12.50,
    "Argentinian Steak Sandwich": 16.95
};

/**
 * POPUP MANAGER
 */
function showPopup(num) {
    if (state.popupShown[num]) return;
    const root = document.getElementById('popup-root');
    const data = popupContent[num];
    const btnLabel = data.buttonLabel || 'Continue';
    root.innerHTML = `<div class="popup-modal"><h2 class="popup-title">${data.title}</h2><p class="popup-body">${data.body}</p><button class="popup-button">${btnLabel}</button></div>`;
    root.classList.add('active');
    state.popupShown[num] = true;
    root.querySelector('button').addEventListener('click', () => { root.classList.remove('active'); root.innerHTML = ''; });
}

// GLOBAL STATE & DEFAULTS
const defaultTailwindConfig = window.tailwind ? { ...window.tailwind.config } : {};

/**
 * SCREEN LOADER
 */
async function showScreen(screenId) {
    const mount = document.getElementById('screen-mount');
    const body = document.getElementById('app-body');
    
    try {
        const isIframeTarget = screenId.startsWith('B');
        const existingIframe = mount.querySelector('iframe');
        
        // OPTIMIZED SUB-STATE TRANSITION (B1_1 -> B1_2) - WITH SMOOTH FADE
        if (isIframeTarget && existingIframe && state.currentScreen.substring(0,2) === screenId.substring(0,2)) {
            state.currentScreen = screenId;
            mount.style.opacity = '0';
            setTimeout(() => {
                existingIframe.src = screens[screenId];
                // Opacity will be restored by the iFrame onload or a direct toggle
                setTimeout(() => { mount.style.opacity = '1'; }, 100);
            }, 200);
            return;
        }

        mount.classList.remove('visible');
        state.currentScreen = screenId;

        // MOBILE (A-SERIES) - ABSOLUTE NATIVE FIDELITY
        if (screenId.startsWith('A')) {
            const res = await fetch(screens[screenId]);
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            if (window.tailwind) window.tailwind.config = { ...defaultTailwindConfig };
            body.className = "bg-[#000000] " + doc.body.className + " flex items-center justify-center min-h-screen overflow-hidden";
            
            const oldStyles = document.querySelectorAll('.screen-style');
            oldStyles.forEach(s => s.remove());
            doc.head.querySelectorAll('style').forEach(s => {
                let css = s.innerHTML;
                css = css.replace(/body\s*\{/g, '.design-body {');
                const newStyle = document.createElement('style');
                newStyle.innerHTML = css;
                newStyle.classList.add('screen-style');
                document.head.appendChild(newStyle);
            });

            setTimeout(() => {
                mount.innerHTML = '';
                const wrapper = document.createElement('div');
                wrapper.className = doc.body.className + " design-body transition-colors duration-300";
                wrapper.style.cssText = doc.body.style.cssText;
                wrapper.style.width = '100dvw';
                wrapper.style.maxWidth = '393px';
                wrapper.style.minHeight = '100dvh';
                
                Array.from(doc.body.childNodes).forEach(node => {
                    wrapper.appendChild(node.cloneNode(true));
                });
                
                mount.appendChild(wrapper);

                // SCALE RESET (Mobile Isolation)
                mount.style.transform = 'none';
                mount.style.width = '100dvw';
                mount.style.height = '100dvh';
                mount.style.justifyContent = 'flex-start';

                syncStateToUI();
                rebindEvents();
                triggerTransitions(screenId);
                mount.classList.add('visible');
            }, 300);

        } else {
            // WEB (B-SERIES) - 100% DESIGN LOCK + DYNAMIC VIEWPORT FIT
            setTimeout(() => {
                mount.innerHTML = '';
                const baseW = 1280;
                const baseH = 1024; // Static base for non-B1 screens

                const iframe = document.createElement('iframe');
                iframe.src = screens[screenId];
                iframe.style.width = `${baseW}px`;
                iframe.style.height = `${baseH}px`;
                iframe.style.border = 'none';
                iframe.style.backgroundColor = 'transparent';
                iframe.style.overflow = 'hidden';
                iframe.style.pointerEvents = 'auto';
                iframe.setAttribute('scrolling', 'no');
                
                iframe.onload = () => {
                    try {
                        const iDoc = iframe.contentWindow.document;
                        syncStateToUI(iDoc);
                        
                        // B1-SPECIFIC VIEWPORT FIT ENGINE (Option A Implementation)
                        if (screenId.startsWith('B1')) {
                            // Measure the true design height from the content
                            const trueH = Math.max(iDoc.documentElement.scrollHeight, iDoc.body.scrollHeight, 1024);
                            
                            // Proportional Scale calculation to fit viewport exactly
                            const scaleX = (window.innerWidth * 0.98) / baseW;
                            const scaleY = (window.innerHeight * 0.98) / trueH;
                            const scale = Math.min(scaleX, scaleY, 1);
                            
                            mount.style.transform = `scale(${scale})`;
                            mount.style.transformOrigin = 'center center';
                        } else {
                            // B3 / B5 - Maintain "Good" Native Rendering
                            const scaleX = (window.innerWidth * 0.98) / baseW;
                            const scaleY = (window.innerHeight * 0.98) / baseH;
                            const scale = Math.min(scaleX, scaleY, 1);
                            
                            mount.style.transform = `scale(${scale})`;
                            mount.style.transformOrigin = 'center center';
                        }
                        
                        // Bridge 'Continue' Button
                        const isB5 = state.currentScreen === 'B5';
                        const continueBtn = isB5
                            ? iDoc.querySelector('#b5-continue-footer .cursor-pointer')
                            : iDoc.querySelector('footer div[class*="group"], footer .cursor-pointer');
                        if (continueBtn) {
                            if (state.currentScreen === 'B1_1' || state.currentScreen === 'B1_2') {
                                continueBtn.style.opacity = '0.3';
                                continueBtn.style.pointerEvents = 'none';
                            } else if (state.currentScreen === 'B5') {
                                // Final screen: Continue is fully visible, triggers final popup
                                continueBtn.style.opacity = '1';
                                continueBtn.style.pointerEvents = 'auto';
                                continueBtn.style.cursor = 'pointer';
                                continueBtn.onclick = () => showPopup(9);
                            } else {
                                continueBtn.style.opacity = '1';
                                continueBtn.style.pointerEvents = 'auto';
                                continueBtn.onclick = () => {
                                    if (state.currentScreen === 'B1_3') showScreen('B3');
                                    else if (state.currentScreen === 'B3') showScreen('B5');
                                };
                            }
                        }
                    } catch (e) { console.error("Bridge Error:", e); }
                };

                mount.appendChild(iframe);
                mount.style.justifyContent = 'center';
                mount.style.alignItems = 'center';
                
                triggerTransitions(screenId);
                mount.classList.add('visible');
            }, 300);
        }

    } catch (e) { 
        console.error("Load fail:", screenId, e); 
        mount.classList.add('visible');
    }
}

/**
 * STATE SYNC ENGINE (Source of Truth)
 */
function syncStateToUI(root = document) {
    const mount = root.getElementById('screen-mount') || root.body;
    if (!mount) return;

    // B1 Dashboard Throughput
    const throughputNodes = Array.from(root.querySelectorAll('span'));
    const throughput = throughputNodes.find(s => s.textContent.includes('18,420'));
    if (throughput) {
        throughput.innerHTML = `Orders: <span class="text-primary ml-1">${(18420 + state.itemCount * 12).toLocaleString()}</span>`;
    }
    
    // B5 Settlement Financials (Dynamic Grid Sync)
    const settlementsSent = throughputNodes.find(s => s.textContent.includes('$210,000'));
    if (settlementsSent) {
        settlementsSent.textContent = `$${(210000 + state.subtotal).toLocaleString()}`;
    }
    
    const grossProcessed = throughputNodes.find(s => s.textContent.includes('$284,500'));
    if (grossProcessed) {
        grossProcessed.textContent = `$${(284500 + state.subtotal).toLocaleString()}`;
    }

    // A3 Batch Stages
    if (state.currentScreen === 'A3') {
        const bannerP = mount.querySelector('section div p');
        const stages = ["6", "5", "3"];
        if (bannerP) {
            bannerP.innerHTML = `Batch forming: <span class="font-semibold">${stages[state.batchStage]}</span> more orders needed to unlock your group discount`;
        }
        const footerSpan = mount.querySelector('footer span');
        if (footerSpan) footerSpan.textContent = `${state.itemCount} items · $${state.subtotal.toFixed(2)}`;
    }

    // B3 Cluster Orchestration
    if (state.currentScreen === 'B3') {
        const northOrders = Array.from(mount.querySelectorAll('span')).find(s => s.textContent.includes('Orders: 18/25'));
        if (northOrders) northOrders.textContent = `Orders: ${18 + state.itemCount}/25`;
        const logs = mount.querySelector('.space-y-10');
        if (logs) {
            const impact = state.itemCount === 0 ? "None" : (state.itemCount === 1 ? "Light" : "Medium");
            const newLog = document.createElement('div');
            newLog.className = "text-[11px] leading-relaxed tracking-wide border-l border-[#C8A96B] pl-4 py-1";
            newLog.innerHTML = `<span class="text-[#C8A96B] block mb-1">SYSTEM FEEDBACK — <span class="uppercase tracking-widest font-bold">USER CONTRIBUTION</span></span>
                                <span class="text-platinum">User influence: +${state.itemCount} items. Cluster B impact: ${impact}. Window synchronized.</span>`;
            logs.prepend(newLog);
        }
    }
}

/**
 * B1 ONE-WAY JOURNEY
 */
function startB1Journey() {
    if (state.b1Timeout) return;
    state.b1Timeout = setTimeout(() => {
        showScreen('B1_2');
        state.b1Timeout = setTimeout(() => {
            showScreen('B1_3');
            state.b1Timeout = null;
        }, 2500);
    }, 2500);
}

/**
 * EVENT SYSTEM
 */
function rebindEvents() {
    const mount = document.getElementById('screen-mount');
    if (!mount) return;
    const buttons = Array.from(mount.querySelectorAll('button'));

    // A1 Location
    if (state.currentScreen === 'A1') {
        const input = mount.querySelector('input');
        const cont = buttons.find(b => b.innerText.includes('Continue'));
        const cur = buttons.find(b => b.innerText.toLowerCase().includes('current location'));
        const demandCard = mount.querySelector('#demand-card');
        const demandCount = mount.querySelector('#demand-count');

        function getLiveCount() {
            return Math.floor(Math.random() * 8) + 12;
        }
        function revealDemandCard() {
            if (!demandCard || demandCard.classList.contains('visible')) return;
            if (demandCount) demandCount.textContent = getLiveCount();
            demandCard.classList.add('visible');
        }

        if (cont) {
            cont.style.opacity = '0.5'; cont.style.pointerEvents = 'none';
            cont.onclick = () => showScreen('A3');
        }
        const act = () => { if (cont) { cont.style.opacity = '1'; cont.style.pointerEvents = 'auto'; } };
        if (input) {
            const h = () => {
                if (input.value.length >= 1) {
                    act();
                    revealDemandCard();
                }
            };
            input.oninput = h; input.onkeyup = h; input.onchange = h;
        }
        if (cur) cur.onclick = (e) => {
            e.preventDefault();
            if (input) input.value = "Current Location";
            act();
            revealDemandCard();
        };
    }

    // A3 Interaction
    if (state.currentScreen === 'A3') {
        const adds = buttons.filter(b => b.innerText.trim().toLowerCase() === 'add');
        adds.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                if (btn.dataset.added) return;
                const node = btn.closest('.flex').querySelector('.text-\\[15px\\]');
                if (!node) return;
                const name = node.textContent.trim();
                state.cartItems.push(name);
                state.subtotal += (menuPricing[name] || 0);
                state.itemCount++;
                btn.textContent = 'Added'; btn.dataset.added = true;
                if (state.itemCount === 1) { state.batchStage = 1; showPopup(3); }
                else if (state.itemCount === 2) { state.batchStage = 2; showPopup(4); }
                syncStateToUI();
            };
        });
        const view = buttons.find(b => b.innerText.toUpperCase().includes('VIEW CART'));
        if (view) view.onclick = () => { if (state.itemCount >= 2) showScreen('A4'); else alert("Add 2 items to form batch."); };
    }

    // Navigations
    if (state.currentScreen === 'A4') {
        const cont = buttons.find(b => b.innerText.includes('Continue'));
        if (cont) cont.onclick = () => showScreen('A5');
    }
    if (state.currentScreen === 'A5') {
        const pay = buttons.find(b => b.innerText.includes('Confirm'));
        if (pay) pay.onclick = () => showScreen('B1');
    }

    // B1 Continue Rule
    if (state.currentScreen.startsWith('B1')) {
        const cont = mount.querySelector('.cursor-pointer');
        if (cont) {
            if (state.currentScreen === 'B1_3') {
                cont.style.opacity = '1'; cont.style.pointerEvents = 'auto';
                cont.onclick = () => { if (state.b1Timeout) clearTimeout(state.b1Timeout); showScreen('B3'); };
            } else {
                cont.style.opacity = '0.4'; cont.style.pointerEvents = 'none';
            }
        }
    }

    if (state.currentScreen === 'B3') {
        const cont = mount.querySelector('.cursor-pointer');
        if (cont) cont.onclick = () => showScreen('B5');
    }
}

function triggerTransitions(id) {
    if (id === 'A1') showPopup(1);
    else if (id === 'A3') showPopup(2);
    else if (id === 'A4') showPopup(5);
    else if (id === 'A5') showPopup(6);
    else if (id === 'B1') { showPopup(7); startB1Journey(); }
    else if (id === 'B5') showPopup(8);
}

window.addEventListener('resize', () => {
    if (state.currentScreen && state.currentScreen.startsWith('B')) {
        const mount = document.getElementById('screen-mount');
        const wrapper = mount.querySelector('.design-body');
        if (mount && wrapper) {
            let baseW = 1280;
            let baseH = 800;
            // Balanced Tactical Base (1440 x 1050)
            baseW = 1440; 
            baseH = 1050;

            const scaleX = (window.innerWidth * 0.96) / baseW;
            const scaleY = (window.innerHeight * 0.96) / baseH;
            const scale = Math.min(scaleX, scaleY, 1);
            mount.style.transform = `scale(${scale})`;
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    showScreen('A1');
});
