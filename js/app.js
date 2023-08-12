(function () {
    'use strict';
    const appContainer = document.getElementById('app');
    const targetContainer = document.getElementById('target');
    const extraContainer = document.getElementById('extra');
    const min = document.getElementById('min');
    const max = document.getElementById('max');

    const modes = [
        'syllables',
        'characters',
        'words'
    ];
    let mode = null;
    let undoStack = [];

    let curr = null;
    let data = null;
    let positions = [];
    let dictionary = null;
    let total = 0;

    function weightedRandomChoice() {
        const rando = Math.floor(Math.random() * total);
        // no real need to loop over all of them, but the return ensures we don't do extra work
        for (let i = 0; i < positions.length; i++) {
            if (positions[i].max >= rando) {
                return positions[i].target;
            }
        }
        // can this even happen?
        return positions[positions.length - 1].target;
    }
    function renderDefinition(definition, container) {
        let meaningElement = document.createElement('div');
        meaningElement.className = 'meaning';
        meaningElement.innerText = definition;
        container.appendChild(meaningElement);
    }
    function renderDefinitions() {
        extraContainer.innerHTML = '';
        if (!(curr in dictionary)) {
            return;
        }
        let result = {};
        for (const definition of dictionary[curr]) {
            if (!(definition.pinyin in result)) {
                result[definition.pinyin] = [];
            }
            if (result[definition.pinyin].length > 4) {
                continue;
            }
            result[definition.pinyin].push(definition.en);
        }
        for (const [pronunciation, definitions] of Object.entries(result)) {
            let nextContainer = document.createElement('div');
            nextContainer.className = 'definition';
            renderPronunciation(pronunciation, Object.keys(result).length, nextContainer);
            renderDefinition(definitions.join('; '), nextContainer);
            extraContainer.appendChild(nextContainer);
        }
    }
    function trimNeutralTone(syllable) {
        return syllable[syllable.length - 1] === '5' ? syllable.substring(0, syllable.length - 1) : syllable;
    }
    function renderPronunciation(pronunciation, pronunciationCount, container) {
        let pronunciationsElement = document.createElement('div');
        const syllables = pronunciation.split(' ');
        for (const syllable of syllables) {
            let pronunciationElement = document.createElement('span');
            pronunciationElement.innerText = trimNeutralTone(syllable.replace('u:', 'ü'));
            pronunciationElement.classList.add(`tone${syllable[syllable.length - 1]}`);
            pronunciationsElement.appendChild(pronunciationElement);
            if (pronunciationCount > 1) {
                pronunciationsElement.addEventListener('click', function (event) {
                    event.stopPropagation();
                    document.querySelectorAll('.character').forEach((element, index) => {
                        element.className = `character tone${syllables[index][syllables[index].length - 1]}`;
                    })
                });
            }
        }
        container.appendChild(pronunciationsElement);
    }

    function renderPronunciations() {
        extraContainer.innerHTML = '';
        const pronunciations = [...new Set(dictionary[curr].map(x => x.pinyin.toLowerCase()))];
        for (const pronunciation of pronunciations) {
            renderPronunciation(pronunciation, pronunciations.length, extraContainer);
        }
    }

    function renderCurrentCharacters() {
        const syllables = dictionary[curr][0].pinyin.split(' ');
        for (let i = 0; i < curr.length; i++) {
            let characterElement = document.createElement('span');
            characterElement.innerText = curr[i];
            characterElement.classList.add('character');
            characterElement.classList.add(`tone${syllables[i][syllables[i].length - 1]}`);
            targetContainer.appendChild(characterElement);
        }
    }

    function render() {
        targetContainer.innerHTML = '';
        targetContainer.className = '';
        extraContainer.innerHTML = '';
        // could also make objects with a dictionary property, I guess
        if (mode === 'words') {
            renderCurrentCharacters();
            renderDefinitions();
        } else if (mode === 'characters') {
            renderCurrentCharacters();
            renderPronunciations();
        } else if (mode === 'syllables') {
            targetContainer.className = `tone${curr[curr.length - 1]}`;
            targetContainer.innerText = trimNeutralTone(curr);
        }
    }

    function next() {
        if (curr) {
            undoStack.push(curr);
        }
        curr = weightedRandomChoice();
        render();
    }
    function prev() {
        if (undoStack.length === 0) {
            return;
        }
        curr = undoStack.pop();
        render();
    }
    function findPositions() {
        let last = 0;
        positions = [];
        let freqsDescending = Object.entries(data).sort((a, b) => parseInt(b[1] - a[1]));
        let start = Math.max(0, parseInt(min.value));
        let end = Math.min(parseInt(max.value), freqsDescending.length);
        for (let i = start; i < end; i++) {
            const [key, value] = freqsDescending[i];
            positions.push({ max: last + value, target: key });
            last += value;
        }
        total = last;
    }
    async function getDictionary() {
        let response = await fetch(`./data/dictionary.json`);
        dictionary = await response.json();
    }

    async function switchMode() {
        const nextMode = document.querySelector('input[type=radio]:checked').value;
        // includes O(N), but it's 3 items
        if (nextMode === mode || !modes.includes(nextMode)) {
            return;
        }
        mode = nextMode;
        let response = await fetch(`./data/${mode}.json`);
        data = await response.json();
        if (mode !== 'syllables' && !dictionary) {
            await getDictionary();
        }
        min.value = 0;
        max.value = Object.entries(data).length;
        findPositions();
        curr = null;
        undoStack = [];
        next();
    }
    // add event listeners...
    document.addEventListener('keydown', function (event) {
        // don't react to any input keyboard events
        if (event.target.nodeName.toLowerCase() === 'input') {
            return;
        }
        if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') {
            next();
        } else if (event.key === 'ArrowLeft') {
            prev();
        }
    });
    appContainer.addEventListener('click', function () {
        next();
    });
    document.querySelectorAll('input[type=radio]').forEach(radioButton => {
        radioButton.addEventListener('change', switchMode);
    });
    min.addEventListener('change', function () {
        if (min.value >= max.value) {
            min.value = max.value - 100;
        }
        findPositions();
    });
    max.addEventListener('change', function () {
        if (max.value <= min.value) {
            max.value = min.value + 100;
        }
        findPositions();
    });
    // initial setup...
    switchMode();
})();