// ==UserScript==
// @name         Atom ID Field Copier
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Adds a small button to each 'atom' field to copy its numeric ID to the clipboard.
// @author       You
// @match        *://*/*form/item*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // A robust way to add styles that doesn't rely on GM_addStyle
    function addGlobalStyle(css) {
        const head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        const style = document.createElement('style');
        style.innerHTML = css;
        head.appendChild(style);
    }

    // Add styles for the copy button and its container
    addGlobalStyle(`
        /* Make the icon's container a positioning context for the absolute button */
        div[id^="atom"] .field-caption .d-flex {
            position: relative;
        }

        /* Style the button itself */
        .atom-id-copy-btn {
            position: absolute; /* Take the button out of the normal document flow */
            left: -12px; /* Position it 12px to the left of the container */
            top: 50%; /* Center it vertically */
            transform: translateY(-50%); /* Fine-tune vertical centering */
            width: 7px;
            height: 7px;
            border: 1px solid #999;
            background-color: #f0f0f0;
            cursor: pointer;
            padding: 0;
        }
        .atom-id-copy-btn:hover {
            background-color: #cccccc;
        }
        .atom-id-copy-btn.copied {
            background-color: #90ee90; /* lightgreen */
            border-color: #5cb85c;
        }
    `);

    // This function finds the fields and adds the copy buttons
    const addCopyButtons = () => {
        // Select all divs whose ID starts with "atom" and has digits
        const elements = document.querySelectorAll('div[id^="atom"]');

        elements.forEach(element => {
            // Check for correct format (atom<number>) and if button already exists
            if (!/^atom\d+$/.test(element.id) || element.dataset.atomIdCopierAdded) {
                return;
            }

            // Find the icon image inside the field's caption area
            const icon = element.querySelector('.field-caption img.icon16');
            if (!icon) {
                return; // Skip if no icon found
            }

            // Mark element as processed
            element.dataset.atomIdCopierAdded = 'true';

            // Extract the number from the ID
            const numberToCopy = element.id.match(/\d+/)[0];

            // Create the copy button
            const button = document.createElement('button');
            button.className = 'atom-id-copy-btn';
            button.title = `Copy ID: ${numberToCopy}`;

            // Add the click event to copy the ID
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                navigator.clipboard.writeText(numberToCopy).then(() => {
                    // Visual feedback on success
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.classList.remove('copied');
                    }, 1000);
                }).catch(() => {
                    // Fallback for older browsers or insecure contexts
                    GM_setClipboard(numberToCopy);
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.classList.remove('copied');
                    }, 1000);
                });
            });

            // Insert the new button into the icon's parent container
            icon.parentNode.appendChild(button);
        });
    };

    // Use a MutationObserver to handle dynamically loaded content
    const observer = new MutationObserver(() => {
        addCopyButtons();
    });

    // Start observing the entire body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run once on script start, just in case some elements are already there
    setTimeout(addCopyButtons, 500);

})();
