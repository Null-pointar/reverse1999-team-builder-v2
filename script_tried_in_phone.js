document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の選択 ---
    const characterListElement = document.getElementById('character-list');
    const searchBar = document.getElementById('search-bar');
    const damageTypeFiltersContainer = document.getElementById('damage-type-filters');
    const attributeFiltersContainer = document.getElementById('attribute-filters');
    const specialtyFiltersContainer = document.getElementById('specialty-filters');
    const tagFiltersContainer = document.getElementById('tag-filters');
    const menuButton = document.getElementById('menu-button');
    const sidePanelOverlay = document.getElementById('side-panel-overlay');
    const closePanelButton = document.getElementById('close-panel-button');
    const saveTeamForm = document.getElementById('save-team-form');
    const savedTeamsList = document.getElementById('saved-teams-list');
    const langButtons = document.querySelectorAll('.lang-button');
    const disclaimerTexts = document.querySelectorAll('.disclaimer-text');
    const loadedTeamTitle = document.getElementById('loaded-team-title');
    const loadedTeamDesc = document.getElementById('loaded-team-desc');
    const saveStatusElement = document.getElementById('save-status');
    const teamStatsContainer = document.getElementById('team-stats-container');
    const modeSelector = document.getElementById('mode-selector');
    const teamSlotsContainer = document.getElementById('team-slots-container');
    const panelNavButtons = document.querySelectorAll('.panel-nav-button');
    const panelContents = document.querySelectorAll('.panel-content');
    const shareModal = document.getElementById('share-modal');
    const closeShareModalButton = document.getElementById('close-modal-button');
    const shareUrlInput = document.getElementById('share-url-input');
    const copyUrlButton = document.getElementById('copy-url-button');
    const qrcodeDisplay = document.getElementById('qrcode-display');
    const loadTeamFromCodeButton = document.getElementById('load-team-from-code-button');
    const teamCodeInput = document.getElementById('team-code-input');
    const clearInputButton = document.getElementById('clear-input-button');
    const resetFiltersButton = document.getElementById('reset-filters-button');
    const clearTeamButton = document.getElementById('clear-team-button');
    const sortButtons = document.querySelectorAll('.sort-btn');
    const characterDetailModal = document.getElementById('character-detail-modal');
    const closeDetailModalButton = document.getElementById('close-detail-modal-button');
    const modalCharacterContent = document.getElementById('modal-character-content');
    const miniTeamView = document.getElementById('mini-team-view');

    // --- グローバル変数 ---
    let allCharacters = [];
    let allPsychubes = [];
    let currentView = 'characters';
    let selectedDamageType = null;
    let selectedAttribute = null;
    let currentMode = 'mode1';
    let currentlyLoadedTeamId = null;
    let currentSort = 'default';
    let autoSaveTimeout;

    // --- 初期化処理 ---
    Promise.all([
        fetch('characters.json').then(res => res.json()),
        fetch('psychubes.json').then(res => res.json())
    ])
    .then(([characters, psychubes]) => {
        allCharacters = characters;
        allPsychubes = psychubes;
        const didLoadFromUrl = loadTeamFromUrl();
        if (!didLoadFromUrl) {
            const didLoadFromAutoSave = loadAutoSavedTeam();
            if (!didLoadFromAutoSave) {
                renderTeamSlots();
                updateMiniView();
            }
        }
        createAllFilters();
        applyFilters();
    })
    .catch(error => console.error('Data failed to load:', error));

    function loadAutoSavedTeam() {
        try {
            const autoSavedData = localStorage.getItem('reverse1999_autosave_team');
            if (autoSavedData) {
                const teamData = JSON.parse(autoSavedData);
                loadTeamData(teamData);
                console.log('Restored auto-saved team draft.');
                return true;
            }
        } catch (e) {
            console.error('Failed to load auto-saved team:', e);
            localStorage.removeItem('reverse1999_autosave_team');
        }
        return false;
    }

    // --- フィルター関連の関数 ---
    function createAllFilters() {
        createDamageTypeFilters();
        createAttributeFilters();
        createSpecialtyFilters();
        createTagFilters();
    }

    function applyFilters() {
        if (currentView === 'characters') {
            const searchTerm = searchBar.value.toLowerCase();
            const selectedTags = Array.from(tagFiltersContainer.querySelectorAll('input:checked')).map(input => input.value);
            const selectedSpecialties = Array.from(specialtyFiltersContainer.querySelectorAll('input:checked')).map(input => input.value);
            const filteredCharacters = allCharacters.filter(character => {
                const nameMatch = character.name.toLowerCase().includes(searchTerm);
                const attributeMatch = !selectedAttribute || character.attribute === selectedAttribute;
                const damageTypeMatch = !selectedDamageType || character.damageType === selectedDamageType;
                const tagMatch = selectedTags.every(tag => character.tags.includes(tag));
                const specialtyMatch = selectedSpecialties.every(spec => character.specialties.includes(spec));
                return nameMatch && attributeMatch && damageTypeMatch && tagMatch && specialtyMatch;
            });
            let sortedCharacters = [...filteredCharacters];
            switch (currentSort) {
                case 'rarity-desc': sortedCharacters.sort((a, b) => (b.rarity || 0) - (a.rarity || 0)); break;
                case 'rarity-asc': sortedCharacters.sort((a, b) => (a.rarity || 0) - (b.rarity || 0)); break;
                case 'version-desc':
                    sortedCharacters.sort((a, b) => {
                        const vA = a.version ? parseFloat(a.version) : 0;
                        const vB = b.version ? parseFloat(b.version) : 0;
                        if (vB !== vA) return vB - vA;
                        return b.id - a.id;
                    });
                    break;
                case 'version-asc':
                    sortedCharacters.sort((a, b) => {
                        const vA = a.version ? parseFloat(a.version) : 0;
                        const vB = b.version ? parseFloat(b.version) : 0;
                        if (vA !== vB) return vA - vB;
                        return b.id - a.id;
                    });
                    break;
                default: sortedCharacters.sort((a, b) => b.id - a.id); break;
            }
            displayCharacters(sortedCharacters);
        } else if (currentView === 'psychubes') {
            const searchTerm = searchBar.value.toLowerCase();
            const filteredPsychubes = allPsychubes.filter(p => p.name.toLowerCase().includes(searchTerm));
            let sortedPsychubes = [...filteredPsychubes];
            switch (currentSort) {
                case 'id-asc': sortedPsychubes.sort((a, b) => (a.id > b.id) ? 1 : -1); break;
                case 'id-desc':
                default: sortedPsychubes.sort((a, b) => (a.id < b.id) ? 1 : -1); break;
            }
            displayPsychubes(sortedPsychubes);
        }
    }

    // --- UI表示と生成の関数 ---
    function generateCardHTML(character) {
        const rarityStars = '★'.repeat(character.rarity || 0);
        const attributeClass = `attr-${character.attribute.toLowerCase()}`;
        const damageTypeClass = `type-${character.damageType.toLowerCase()}`;
        return `
            <img src="images/characters/${character.id}.png" alt="${character.name}" class="character-portrait" loading="lazy" onerror="this.style.display='none'">
            <div class="card-info-overlay">
                <div class="card-header">
                    <div class="attribute ${attributeClass}">${character.attribute}</div>
                    <div class="damage-type ${damageTypeClass}">${character.damageType}</div>
                </div>
                <div class="card-footer">
                    <div class="rarity">${rarityStars}</div>
                    <div class="name">${character.name}</div>
                    <div class="tags">${character.tags.join(' / ')}</div>
                </div>
            </div>
        `;
    }

    function generatePsychubeCardHTML(psychube) {
        const rarityStars = '★'.repeat(psychube.rarity || 0);
        return `
            <img src="images/psychubes/${psychube.id}.png" alt="${psychube.name}" class="character-portrait" loading="lazy" onerror="this.style.display='none'">
            <div class="card-info-overlay">
                <div class="card-header"></div>
                <div class="card-footer">
                    <div class="rarity">${rarityStars}</div>
                    <div class="name">${psychube.name}</div>
                </div>
            </div>
        `;
    }

    function displayCharacters(characters) {
        characterListElement.innerHTML = '';
        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.id = character.id;
            card.innerHTML = generateCardHTML(character);
            card.addEventListener('click', () => openDetailModal(character.id));
            characterListElement.appendChild(card);
        });
        // ▼▼▼ SortableJSの初期化 ▼▼▼
        initSortableForList();
    }

    function displayPsychubes(psychubes) {
        characterListElement.innerHTML = '';
        psychubes.forEach(psychube => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.id = psychube.id;
            card.innerHTML = generatePsychubeCardHTML(psychube);
            characterListElement.appendChild(card);
        });
        // ▼▼▼ SortableJSの初期化 ▼▼▼
        initSortableForList();
    }
    
    // ▼▼▼ SortableJSの初期化関数を新設 ▼▼▼
    function initSortableForList() {
        new Sortable(characterListElement, {
            group: {
                name: currentView, // 'characters' or 'psychubes'
                pull: 'clone',
                put: false
            },
            sort: false,
            animation: 150,
        });
    }

    function createDamageTypeFilters() {
        const damageTypes = ["Reality", "Mental"];
        damageTypes.forEach(type => {
            const btn = document.createElement('button');
            btn.className = `damage-type-filter type-${type.toLowerCase()}`;
            btn.textContent = type;
            btn.addEventListener('click', () => {
                selectedDamageType = (selectedDamageType === type) ? null : type;
                damageTypeFiltersContainer.classList.toggle('filter-active', !!selectedDamageType);
                document.querySelectorAll('.damage-type-filter').forEach(b => b.classList.remove('selected'));
                if (selectedDamageType) btn.classList.add('selected');
                applyFilters();
            });
            damageTypeFiltersContainer.appendChild(btn);
        });
    }

    function createAttributeFilters() {
        const attributes = ["Beast", "Plant", "Star", "Mineral", "Spirit", "Intellect"];
        attributes.forEach(attr => {
            const btn = document.createElement('button');
            btn.className = `attribute-filter attr-${attr.toLowerCase()}`;
            btn.textContent = attr;
            btn.addEventListener('click', () => {
                selectedAttribute = (selectedAttribute === attr) ? null : attr;
                attributeFiltersContainer.classList.toggle('filter-active', !!selectedAttribute);
                document.querySelectorAll('.attribute-filter').forEach(b => b.classList.remove('selected'));
                if (selectedAttribute) btn.classList.add('selected');
                applyFilters();
            });
            attributeFiltersContainer.appendChild(btn);
        });
    }

    function createCheckboxFilters(container, sourceFunction, prefix) {
        const allItems = [...new Set(allCharacters.flatMap(sourceFunction))].sort();
        container.innerHTML = '';
        allItems.forEach(item => {
            const itemElement = document.createElement('label');
            itemElement.className = 'tag-filter';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${prefix}-${item}`;
            checkbox.value = item;
            checkbox.addEventListener('change', () => {
                itemElement.classList.toggle('checked', checkbox.checked);
                applyFilters();
            });
            const text = document.createTextNode(item);
            itemElement.appendChild(checkbox);
            itemElement.appendChild(text);
            container.appendChild(itemElement);
        });
    }

    function createSpecialtyFilters() {
        createCheckboxFilters(specialtyFiltersContainer, c => c.specialties, 'spec');
    }

    function createTagFilters() {
        createCheckboxFilters(tagFiltersContainer, c => c.tags, 'tag');
    }

    function resetAllFilters() {
        searchBar.value = '';
        selectedDamageType = null;
        damageTypeFiltersContainer.classList.remove('filter-active');
        document.querySelectorAll('.damage-type-filter').forEach(b => b.classList.remove('selected'));
        selectedAttribute = null;
        attributeFiltersContainer.classList.remove('filter-active');
        document.querySelectorAll('.attribute-filter').forEach(b => b.classList.remove('selected'));
        const allCheckboxes = document.querySelectorAll('#specialty-filters input[type="checkbox"], #tag-filters input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                checkbox.parentElement.classList.remove('checked');
            }
        });
        applyFilters();
    }

    // --- チーム編成とスロット関連の関数 ---
    function renderTeamSlots() {
        teamSlotsContainer.innerHTML = '';
        miniTeamView.classList.remove('mode-limbo', 'mode-4parties');
        if (currentMode === 'limbo' || currentMode === '4parties') {
            miniTeamView.classList.add('mode-' + currentMode);
        }
        teamSlotsContainer.classList.remove('mode-limbo', 'mode-4parties');
        if (currentMode === 'limbo' || currentMode === '4parties') {
            teamSlotsContainer.classList.add('mode-' + currentMode);
        }
        let partyCount = 0;
        let partyLabels = [];
        switch (currentMode) {
            case 'limbo':
                partyCount = 2; partyLabels = ['Party A', 'Party B']; break;
            case '4parties':
                partyCount = 4; partyLabels = ['Party 1', 'Party 2', 'Party 3', 'Party 4']; break;
            default:
                partyCount = 1; partyLabels = ['']; break;
        }
        for (let i = 0; i < partyCount; i++) {
            const partyRow = document.createElement('div');
            partyRow.className = 'party-row';
            if (partyLabels[i]) {
                const label = document.createElement('div');
                label.className = 'party-label';
                label.textContent = partyLabels[i];
                partyRow.appendChild(label);
            }
            const slotsDiv = document.createElement('div');
            slotsDiv.className = 'team-slots';
            for (let j = 0; j < 4; j++) {
                const slotIndex = i * 4 + j;
                const slotUnit = document.createElement('div');
                slotUnit.className = 'slot-unit';
                const charSlot = document.createElement('div');
                charSlot.className = 'team-slot';
                charSlot.dataset.slotIndex = slotIndex;
                charSlot.textContent = `Slot ${j + 1}`;
                const psychubeSlot = document.createElement('div');
                psychubeSlot.className = 'psychube-slot';
                psychubeSlot.dataset.slotIndex = slotIndex;
                psychubeSlot.textContent = `Psychube`;
                slotUnit.appendChild(charSlot);
                slotUnit.appendChild(psychubeSlot);
                slotsDiv.appendChild(slotUnit);
            }
            partyRow.appendChild(slotsDiv);
            teamSlotsContainer.appendChild(partyRow);
        }
        attachSlotListeners();
    }
    
    // ▼▼▼ SortableJS用にスロットのリスナーを全面的に書き換え ▼▼▼
    function attachSlotListeners() {
        const allTeamSlots = document.querySelectorAll('.team-slot');
        const allPsychubeSlots = document.querySelectorAll('.psychube-slot');

        allTeamSlots.forEach(slot => {
            new Sortable(slot, {
                group: 'characters',
                animation: 150,
                onAdd: function (evt) {
                    const droppedItem = evt.item;
                    const characterId = droppedItem.dataset.id;
                    const character = allCharacters.find(c => c.id == characterId);
                    if (character) {
                        fillSlot(evt.to, character);
                    }
                    // 元のリストからクローンされた要素を削除
                    droppedItem.parentElement.removeChild(droppedItem);
                }
            });

            slot.addEventListener('click', (event) => {
                const charId = slot.dataset.characterId;
                if (event.target.classList.contains('remove-button')) {
                    clearSlot(slot);
                    const psychubeSlot = slot.parentElement.querySelector('.psychube-slot');
                    if (psychubeSlot) {
                        clearPsychubeSlot(psychubeSlot);
                    }
                    return;
                }
                if (charId) {
                    openDetailModal(charId);
                }
            });
        });

        allPsychubeSlots.forEach(slot => {
            new Sortable(slot, {
                group: 'psychubes',
                animation: 150,
                onAdd: function (evt) {
                    const droppedItem = evt.item;
                    const psychubeId = droppedItem.dataset.id;
                    const psychube = allPsychubes.find(p => p.id === psychubeId);
                    if (psychube) {
                        fillPsychubeSlot(evt.to, psychube);
                    }
                    droppedItem.parentElement.removeChild(droppedItem);
                }
            });

            slot.addEventListener('click', (event) => {
                if (event.target.classList.contains('remove-button')) {
                    clearPsychubeSlot(slot);
                }
            });
        });
    }

    miniTeamView.addEventListener('click', (event) => {
        // 削除ボタン以外がクリックされた場合は何もしない
        const removeButton = event.target.closest('.remove-button');
        if (!removeButton) return;

        const targetMiniSlot = event.target.closest('.team-slot, .psychube-slot');
        if (!targetMiniSlot) return;

        const slotIndex = targetMiniSlot.dataset.slotIndex;
        const isCharSlot = targetMiniSlot.classList.contains('team-slot');

        // 元のスロットを見つけてクリアする
        if (isCharSlot) {
            const originalSlot = teamSlotsContainer.querySelector(`.team-slot[data-slot-index="${slotIndex}"]`);
            if (originalSlot) clearSlot(originalSlot);
        } else {
            const originalSlot = teamSlotsContainer.querySelector(`.psychube-slot[data-slot-index="${slotIndex}"]`);
            if (originalSlot) clearPsychubeSlot(originalSlot);
        }
    });

    function generateCurrentTeamData() {
        const slots = document.querySelectorAll('.slot-unit');
        const teamData = [];
        let isEmpty = true;
        slots.forEach(unit => {
            const charSlot = unit.querySelector('.team-slot');
            const psychubeSlot = unit.querySelector('.psychube-slot');
            const charId = charSlot.dataset.characterId || null;
            const psychubeId = psychubeSlot.dataset.psychubeId || null;
            if (charId || psychubeId) isEmpty = false;
            teamData.push({ c: charId, p: psychubeId });
        });
        if (isEmpty) return null;
        const teams = [];
        for (let i = 0; i < teamData.length; i += 4) {
            teams.push(teamData.slice(i, i + 4));
        }
        return {
            mode: currentMode,
            teams: teams,
            name: loadedTeamTitle.value.trim(),
            description: loadedTeamDesc.value.trim()
        };
    }

    function loadTeamData(teamData) {
        currentMode = teamData.mode;
        modeSelector.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === currentMode);
        });
        renderTeamSlots();
        const flatTeamData = teamData.teams.flat();
        document.querySelectorAll('.slot-unit').forEach((unit, index) => {
            const data = flatTeamData[index];
            const charSlot = unit.querySelector('.team-slot');
            const psychubeSlot = unit.querySelector('.psychube-slot');
            clearSlot(charSlot);
            clearPsychubeSlot(psychubeSlot);
            if (!data) return;
            if (data.c) {
                const character = allCharacters.find(c => c.id == data.c);
                if (character) fillSlot(charSlot, character);
            }
            if (data.p) {
                const psychube = allPsychubes.find(p => p.id === data.p);
                if (psychube) fillPsychubeSlot(psychubeSlot, psychube);
            }
        });
        loadedTeamTitle.value = teamData.name || '';
        loadedTeamDesc.value = teamData.description || '';
        updateMiniView();
    }

    function fillSlot(slot, character) {
        slot.innerHTML = generateCardHTML(character) + `<button class="remove-button">×</button>`;
        slot.classList.add('slot-filled');
        slot.dataset.characterId = character.id;
        updateMiniView();
        scheduleAutoSave();
    }

    function clearSlot(slot) {
        const slotIndex = slot.dataset.slotIndex;
        slot.innerHTML = `Slot ${parseInt(slotIndex) % 4 + 1}`;
        // 変更点: classNameの直接上書きをやめ、classList.removeを使用
        slot.classList.remove('slot-filled');
        delete slot.dataset.characterId;
        updateMiniView();
        scheduleAutoSave();
    }

    function fillPsychubeSlot(slot, psychube) {
        slot.innerHTML = generatePsychubeCardHTML(psychube) + `<button class="remove-button">×</button>`;
        slot.classList.add('slot-filled');
        slot.dataset.psychubeId = psychube.id;
        updateMiniView();
        scheduleAutoSave();
    }

    function clearPsychubeSlot(slot) {
        slot.innerHTML = `Psychube`;
        // 変更点: classNameの直接上書きをやめ、classList.removeを使用
        slot.classList.remove('slot-filled');
        delete slot.dataset.psychubeId;
        updateMiniView();
        scheduleAutoSave();
    }

    function clearCurrentTeam() {
        if (!confirm('Are you sure you want to clear the entire team? This cannot be undone.')) {
            return;
        }
        document.querySelectorAll('.team-slot').forEach(slot => clearSlot(slot));
        document.querySelectorAll('.psychube-slot').forEach(slot => clearPsychubeSlot(slot));
        loadedTeamTitle.value = '';
        loadedTeamDesc.value = '';
        currentlyLoadedTeamId = null;
        saveStatusElement.textContent = 'Team Cleared.';
        setTimeout(() => saveStatusElement.textContent = '', 2000);
        scheduleAutoSave();
    }

    // --- サイドパネルとチームデータ管理 ---
    function openSidePanel() {
        sidePanelOverlay.classList.remove('hidden');
        renderSavedTeams();
    }

    function closeSidePanel() {
        sidePanelOverlay.classList.add('hidden');
    }

    function getSavedTeams() {
        try {
            return JSON.parse(localStorage.getItem('reverse1999_saved_teams')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveTeamsToStorage(teams) {
        localStorage.setItem('reverse1999_saved_teams', JSON.stringify(teams));
    }

    function renderSavedTeams() {
        const teams = getSavedTeams();
        savedTeamsList.innerHTML = '';
        if (teams.length === 0) {
            savedTeamsList.innerHTML = '<li>No teams saved yet.</li>';
            return;
        }
        teams.forEach(teamData => {
            const li = document.createElement('li');
            li.dataset.teamId = teamData.id;
            li.innerHTML = `
                <div class="team-info">
                    <strong>${teamData.name}</strong>
                    <p>${teamData.description || ''}</p>
                </div>
                <div class="team-actions">
                    <button class="load-btn">Load</button>
                    <button class="edit-btn">Edit</button>
                    <button class="share-btn">Share</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            li.querySelector('.load-btn').addEventListener('click', () => loadTeam(teamData.id));
            li.querySelector('.edit-btn').addEventListener('click', () => editTeam(teamData.id));
            li.querySelector('.share-btn').addEventListener('click', () => openShareModal(teamData.id));
            li.querySelector('.delete-btn').addEventListener('click', () => deleteTeam(teamData.id));
            savedTeamsList.appendChild(li);
        });
    }

    function editTeam(teamId) {
        const teams = getSavedTeams();
        const teamData = teams.find(t => t.id === teamId);
        const li = savedTeamsList.querySelector(`li[data-team-id="${teamId}"]`);
        if (!li || li.querySelector('.edit-form')) return;
        li.innerHTML = `
            <form class="edit-form">
                <input type="text" value="${teamData.name}" required>
                <textarea>${teamData.description || ''}</textarea>
                <div class="edit-form-actions">
                    <button type="submit">Save</button>
                    <button type="button" class="cancel-btn">Cancel</button>
                </div>
            </form>`;
        li.querySelector('.cancel-btn').addEventListener('click', () => renderSavedTeams());
        li.querySelector('.edit-form').addEventListener('submit', (event) => {
            event.preventDefault();
            const newName = li.querySelector('input').value.trim();
            const newDesc = li.querySelector('textarea').value.trim();
            if (!newName) { alert('Team Name is required.'); return; }
            const teamIndex = teams.findIndex(t => t.id === teamId);
            if (teamIndex > -1) {
                teams[teamIndex].name = newName;
                teams[teamIndex].description = newDesc;
                saveTeamsToStorage(teams);
                renderSavedTeams();
            }
        });
    }

    function loadTeam(teamId) {
        const teams = getSavedTeams();
        const teamDataToLoad = teams.find(t => t.id === teamId);
        if (!teamDataToLoad) return;
        localStorage.removeItem('reverse1999_autosave_team');
        loadTeamData(teamDataToLoad);
        currentlyLoadedTeamId = teamId;
        closeSidePanel();
    }

    function deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team?')) return;
        let teams = getSavedTeams();
        teams = teams.filter(t => t.id !== teamId);
        saveTeamsToStorage(teams);
        renderSavedTeams();
    }

    // --- チーム共有 ---
    function openShareModal(teamId = null) {
        const teamData = teamId ? getSavedTeams().find(t => t.id === teamId) : generateCurrentTeamData();
        if (!teamData) {
            alert('The team is empty. Please add characters before sharing.');
            return;
        }
        const shareData = {
            m: teamData.mode,
            t: teamData.teams,
            n: teamData.name,
            d: teamData.description
        };
        const jsonString = JSON.stringify(shareData);
        const encodedString = btoa(encodeURIComponent(jsonString));
        const shareUrl = `${window.location.origin}${window.location.pathname}#${encodedString}`;
        shareUrlInput.value = shareUrl;
        generateQrCode(shareUrl);
        shareModal.classList.remove('hidden');
    }

    function closeShareModal() {
        shareModal.classList.add('hidden');
    }

    function generateQrCode(url) {
        qrcodeDisplay.innerHTML = '';
        try {
            const qr = qrcode(0, 'M');
            qr.addData(url);
            qr.make();
            qrcodeDisplay.innerHTML = qr.createImgTag(4, 8);
        } catch (e) {
            console.error("QR Code generation failed:", e);
            qrcodeDisplay.textContent = "QR Code could not be generated.";
        }
    }

    function loadTeamFromUrl() {
        const hash = window.location.hash.substring(1);
        if (!hash) return false;
        try {
            const jsonString = decodeURIComponent(atob(hash));
            const sharedData = JSON.parse(jsonString);
            if (sharedData.m && sharedData.t) {
                const teamDataForLoad = {
                    mode: sharedData.m,
                    teams: sharedData.t,
                    name: sharedData.n || 'Loaded from URL',
                    description: sharedData.d || ''
                };
                loadTeamData(teamDataForLoad);
                alert('Team loaded from URL!');
                history.pushState("", document.title, window.location.pathname + window.location.search);
                return true;
            }
        } catch (e) {
            console.error("Failed to load team from URL:", e);
            alert("Could not load team from the provided link.");
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        return false;
    }

    let saveTimeout;
    function scheduleAutoSave() {
        clearTimeout(saveTimeout);
        saveStatusElement.textContent = 'Saving...';
        saveTimeout = setTimeout(() => {
            if (currentlyLoadedTeamId) {
                let teams = getSavedTeams();
                const teamIndex = teams.findIndex(t => t.id === currentlyLoadedTeamId);
                if (teamIndex > -1) {
                    const teamData = generateCurrentTeamData();
                    teams[teamIndex].name = loadedTeamTitle.value;
                    teams[teamIndex].description = loadedTeamDesc.value;
                    teams[teamIndex].mode = teamData.mode;
                    teams[teamIndex].teams = teamData.teams;
                    saveTeamsToStorage(teams);
                    saveStatusElement.textContent = 'Saved!';
                    setTimeout(() => saveStatusElement.textContent = '', 2000);
                }
            } else {
                const teamData = generateCurrentTeamData();
                if (teamData) {
                    localStorage.setItem('reverse1999_autosave_team', JSON.stringify(teamData));
                    saveStatusElement.textContent = 'Draft saved.';
                } else {
                    localStorage.removeItem('reverse1999_autosave_team');
                    saveStatusElement.textContent = '';
                }
            }
        }, 1500);
    }

    function loadTeamFromCode() {
        var code = teamCodeInput.value.trim();
        if (!code) {
            alert('Please paste a team code.');
            return;
        }
        if (code.includes('#')) {
            code = code.split('#').pop();
        }
        try {
            const jsonString = decodeURIComponent(atob(code));
            const sharedData = JSON.parse(jsonString);
            if (sharedData.m && sharedData.t) {
                const teamDataForLoad = {
                    mode: sharedData.m,
                    teams: sharedData.t,
                    name: sharedData.n || 'Loaded from Code',
                    description: sharedData.d || ''
                };
                loadTeamData(teamDataForLoad);
                currentlyLoadedTeamId = null;
                alert('Team loaded successfully!');
                closeSidePanel();
            } else {
                throw new Error('Invalid data format');
            }
        } catch (e) {
            alert('Invalid or corrupted team code.');
            console.error('Failed to load from team code:', e);
        }
    }

    // --- イベントリスナーの設定 ---
    loadedTeamTitle.addEventListener('input', scheduleAutoSave);
    loadedTeamDesc.addEventListener('input', scheduleAutoSave);

    const viewSwitcher = document.getElementById('view-switcher');
    const characterFilters = document.querySelector('.filter-row');
    viewSwitcher.addEventListener('click', (event) => {
        if (event.target.matches('.view-btn')) {
            const selectedView = event.target.dataset.view;
            if (selectedView === currentView) return;
            currentView = selectedView;
            viewSwitcher.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            const isCharacters = currentView === 'characters';
            characterFilters.style.display = isCharacters ? 'flex' : 'none';
            specialtyFiltersContainer.style.display = isCharacters ? 'flex' : 'none';
            tagFiltersContainer.style.display = isCharacters ? 'flex' : 'none';
            sortButtons.forEach(btn => {
                const targetView = btn.dataset.view;
                btn.classList.toggle('hidden', targetView !== currentView && targetView);
            });
            searchBar.placeholder = isCharacters ? 'Search by character name...' : 'Search by psychube name...';
            applyFilters();
        }
    });

    modeSelector.addEventListener('click', (event) => {
        const target = event.target.closest('.mode-btn');
        if (target) {
            currentMode = target.dataset.mode;
            modeSelector.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            renderTeamSlots();
            updateMiniView();
        }
    });

    menuButton.addEventListener('click', openSidePanel);
    closePanelButton.addEventListener('click', closeSidePanel);
    sidePanelOverlay.addEventListener('click', (event) => {
        if (event.target === sidePanelOverlay) closeSidePanel();
    });

    panelNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanelId = `panel-content-${button.dataset.panel}`;
            panelNavButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            panelContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetPanelId).classList.add('active');
        });
    });

    saveTeamForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = loadedTeamTitle.value.trim();
        if (!name) { alert('Team Name is required.'); return; }
        const teamData = generateCurrentTeamData();
        if (!teamData) { alert('Cannot save an empty team.'); return; }
        const newTeam = {
            id: Date.now().toString(),
            name: name,
            description: teamData.description,
            mode: teamData.mode,
            teams: teamData.teams
        };
        const savedTeams = getSavedTeams();
        savedTeams.push(newTeam);
        saveTeamsToStorage(savedTeams);
        localStorage.removeItem('reverse1999_autosave_team');
        currentlyLoadedTeamId = newTeam.id;
        saveStatusElement.textContent = 'New Team Saved!';
        setTimeout(() => saveStatusElement.textContent = '', 2000);
        renderSavedTeams();
    });

    searchBar.addEventListener('input', applyFilters);
    resetFiltersButton.addEventListener('click', resetAllFilters);
    clearTeamButton.addEventListener('click', clearCurrentTeam);

    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedLang = button.dataset.lang;
            langButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            disclaimerTexts.forEach(text => {
                text.classList.toggle('hidden', !text.classList.contains(`lang-${selectedLang}`));
            });
        });
    });

    copyUrlButton.addEventListener('click', () => {
        shareUrlInput.select();
        navigator.clipboard.writeText(shareUrlInput.value)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => alert('Failed to copy link.'));
    });

    closeShareModalButton.addEventListener('click', closeShareModal);
    shareModal.addEventListener('click', (event) => {
        if (event.target === shareModal) closeShareModal();
    });

    loadTeamFromCodeButton.addEventListener('click', loadTeamFromCode);
    clearInputButton.addEventListener('click', () => teamCodeInput.value = '');

    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('active')) return;
            currentSort = button.dataset.sort;
            sortButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyFilters();
        });
    });

    // --- ミニビューと表示監視 ---
    const teamSection = document.querySelector('.team-section');
    function updateMiniView() {
        miniTeamView.innerHTML = '';
        const clonedSlots = teamSlotsContainer.cloneNode(true);
        miniTeamView.appendChild(clonedSlots);
    }
    
    // ▼▼▼ ミニビューはクリックでの削除のみ対応（D&Dは複雑化するため除外）▼▼▼
    function updateMiniView() {
        miniTeamView.innerHTML = ''; // 既存の中身をクリア
        const clonedSlotsContainer = teamSlotsContainer.cloneNode(true);
        miniTeamView.appendChild(clonedSlotsContainer);

        // ミニビュー内のキャラクタースロットにSortableJSを設定
        miniTeamView.querySelectorAll('.team-slot').forEach(slot => {
            new Sortable(slot, {
                group: 'characters', // キャラクターグループからのドロップを受け入れる
                onAdd: function (evt) {
                    const characterId = evt.item.dataset.id;
                    const originalSlot = teamSlotsContainer.querySelector(`.team-slot[data-slot-index="${evt.to.dataset.slotIndex}"]`);
                    const character = allCharacters.find(c => c.id == characterId);
                    
                    if (originalSlot && character) {
                        fillSlot(originalSlot, character); // 元のスロットを更新
                    }
                    // ドロップされた要素（クローン）は即座に削除
                    evt.item.parentElement.removeChild(evt.item);
                }
            });
        });

        // ミニビュー内のPsychubeスロットにSortableJSを設定
        miniTeamView.querySelectorAll('.psychube-slot').forEach(slot => {
            new Sortable(slot, {
                group: 'psychubes', // Psychubeグループからのドロップを受け入れる
                onAdd: function (evt) {
                    const psychubeId = evt.item.dataset.id;
                    const originalSlot = teamSlotsContainer.querySelector(`.psychube-slot[data-slot-index="${evt.to.dataset.slotIndex}"]`);
                    const psychube = allPsychubes.find(p => p.id === psychubeId);
                    
                    if (originalSlot && psychube) {
                        fillPsychubeSlot(originalSlot, psychube); // 元のスロットを更新
                    }
                    evt.item.parentElement.removeChild(evt.item);
                }
            });
        });
    }


    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            miniTeamView.classList.toggle('hidden', entry.isIntersecting);
        });
    }, { rootMargin: '0px', threshold: 0.05 });
    observer.observe(teamSection);

    // --- キャラクター詳細モーダル ---
    function openDetailModal(characterId) {
        const character = allCharacters.find(c => c.id == characterId);
        if (!character) return;
        const rarityStars = '★'.repeat(character.rarity || 0);
        const attributeClass = `attr-${character.attribute.toLowerCase()}`;
        const damageTypeClass = `type-${character.damageType.toLowerCase()}`;
        const contentHTML = `
            <img src="images/characters/${character.id}.png" alt="${character.name}">
            <div>
                <h3 style="margin-bottom: 5px;">${character.name}</h3>
                <p style="color: #f9ca24; font-size: 20px; margin: 0 0 10px 0;">${rarityStars}</p>
                <p><strong>Attribute:</strong> <span class="${attributeClass}" style="padding: 3px 8px; border-radius: 12px; color: white;">${character.attribute}</span></p>
                <p><strong>Damage Type:</strong> <span class="${damageTypeClass}" style="padding: 3px 8px; border-radius: 12px; color: white;">${character.damageType}</span></p>
                <div class="tags-container">
                    <strong>Specialties:</strong> 
                    ${character.specialties.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="tags-container">
                    <strong>Tags:</strong> 
                    ${character.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        modalCharacterContent.innerHTML = contentHTML;
        characterDetailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
        characterDetailModal.classList.add('hidden');
        modalCharacterContent.innerHTML = '';
    }

    closeDetailModalButton.addEventListener('click', closeDetailModal);
    characterDetailModal.addEventListener('click', (event) => {
        if (event.target === characterDetailModal) {
            closeDetailModal();
        }
    });

});