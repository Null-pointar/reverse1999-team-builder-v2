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
    //const teamNameInput = document.getElementById('team-name-input');
    //const teamDescInput = document.getElementById('team-desc-input');
    const savedTeamsList = document.getElementById('saved-teams-list');
    const langButtons = document.querySelectorAll('.lang-button');
    const disclaimerTexts = document.querySelectorAll('.disclaimer-text');
    const loadedTeamInfo = document.getElementById('loaded-team-info');
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


    // --- グローバル変数 ---
    let allCharacters = [];
    let allPsychubes = []; 
    let currentView = 'characters';
    let selectedDamageType = null;
    let selectedAttribute = null;
    let currentMode = 'mode1'; // 初期モード
    let currentlyLoadedTeamId = null;
    let currentSort = 'default';
 
    // --- 初期化処理 ---
    // キャラクターと心相の両方のデータを読み込む
    Promise.all([
        fetch('characters.json').then(res => res.json()),
        fetch('psychubes.json').then(res => res.json())
    ])
    .then(([characters, psychubes]) => {
        allCharacters = characters;
        allPsychubes = psychubes;

        // URLにチームデータがあれば読み込む
        const didLoadFromUrl = loadTeamFromUrl();
        if (!didLoadFromUrl) {
            renderTeamSlots();
            updateMiniView();
        }
        createAllFilters();
        applyFilters(); // applyFiltersは内部で表示切替を行うように変更する
    })
    .catch(error => console.error('Data failed to load:', error));

        const sortButtons = document.querySelectorAll('.sort-btn');
        sortButtons.forEach(button => {
            button.addEventListener('click', () => {
                sortButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentSort = button.dataset.sort;
                applyFilters();
            });
        });

    // --- フィルター関連の関数 ---

    // すべてのフィルターを生成
    function createAllFilters() {
        createDamageTypeFilters();
        createAttributeFilters();
        createSpecialtyFilters();
        createTagFilters();
    }
    
    // フィルターを適用してキャラクターリストを更新
    // フィルターを適用して現在のビュー（キャラクター or 心相）を描画
    function applyFilters() {
        if (currentView === 'characters') {
            // --- キャラクターの絞り込みと表示 ---
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
            
            // ソート処理
            let sortedCharacters = [...filteredCharacters];
            // ... (既存のソートのswitch文はここに移動)
            switch (currentSort) {
                case 'rarity-desc': sortedCharacters.sort((a, b) => (b.rarity || 0) - (b.rarity || 0)); break;
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
            // --- 心相の絞り込みと表示 ---
            const searchTerm = searchBar.value.toLowerCase();
            const filteredPsychubes = allPsychubes.filter(p => p.name.toLowerCase().includes(searchTerm));
            
            // 心相のソート
            let sortedPsychubes = [...filteredPsychubes];
            switch (currentSort) {
                case 'id-asc':
                    sortedPsychubes.sort((a, b) => (a.id > b.id) ? 1 : -1); // 昇順
                    break;
                case 'id-desc':
                default:
                    sortedPsychubes.sort((a, b) => (a.id < b.id) ? 1 : -1); // 降順
                    break;
            }
            
            displayPsychubes(filteredPsychubes);
        }
    }

    // 心相一覧を表示する関数
    function displayPsychubes(psychubes) {
        characterListElement.innerHTML = '';
        psychubes.forEach(psychube => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.draggable = true; // Draggableにする
            card.dataset.id = psychube.id; // IDをセット
            card.innerHTML = generatePsychubeCardHTML(psychube);
            
            // dragstartイベントを追加
            card.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', psychube.id);
                e.dataTransfer.setDragImage(e.target, 20, 20); // プレビュー画像をカード自体に設定
            });

            characterListElement.appendChild(card);
        });
    }

    // --- UI表示と生成の関数 ---

    // キャラクターカードのHTMLを生成する共通関数
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

    // キャラクター一覧を表示
    function displayCharacters(characters) {
        characterListElement.innerHTML = ''; 
        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.draggable = true;
            card.dataset.id = character.id;
            card.innerHTML = generateCardHTML(character);
            
            card.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', character.id);
                e.dataTransfer.setDragImage(e.target, 20, 20); // プレビュー画像をカード自体に設定
            });
            characterListElement.appendChild(card);
        });
    }

    // ▼▼▼ 新しい関数を追加 ▼▼▼
    // 心相カードのHTMLを生成する関数
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

    // ダメージタイプフィルターを生成
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
                if(selectedDamageType) btn.classList.add('selected');
                applyFilters();
            });
            damageTypeFiltersContainer.appendChild(btn);
        });
    }

    // 属性フィルターを生成
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
                if(selectedAttribute) btn.classList.add('selected');
                applyFilters();
            });
            attributeFiltersContainer.appendChild(btn);
        });
    }
    
    // 専門分野・タグフィルターを生成する共通関数
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

    // 専門分野フィルターを生成
    function createSpecialtyFilters() {
        createCheckboxFilters(specialtyFiltersContainer, c => c.specialties, 'spec');
    }

    // タグフィルターを生成
    function createTagFilters() {
        createCheckboxFilters(tagFiltersContainer, c => c.tags, 'tag');
    }

    // --- チーム編成とスロット関連の関数 ---

    // チームスロットを現在のモードに合わせて描画
    function renderTeamSlots() {
        teamSlotsContainer.innerHTML = '';

        // ▼▼▼ ミニビューに現在のモードを伝えるクラスを追加 ▼▼▼
        miniTeamView.classList.remove('mode-limbo', 'mode-4parties');
        if (currentMode === 'limbo' || currentMode === '4parties') {
            miniTeamView.classList.add('mode-' + currentMode);
        }

        // ▼▼▼ メインのスロットコンテナにもモードのクラスを追加 ▼▼▼
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

                // キャラとPsychubeをまとめるコンテナ
                const slotUnit = document.createElement('div');
                slotUnit.className = 'slot-unit';

                // キャラクタースロット
                const charSlot = document.createElement('div');
                charSlot.className = 'team-slot';
                charSlot.dataset.slotIndex = slotIndex;
                charSlot.textContent = `Slot ${j + 1}`;
                
                // Psychubeスロット
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
        updateTeamStats();
    }

    // 動的に生成されたスロットにイベントリスナーを設定
    function attachSlotListeners() {
        document.querySelectorAll('.team-slot, .psychube-slot').forEach(slot => {
            slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
            slot.addEventListener('drop', handleDrop);

            // スロットからのドラッグ開始
            slot.addEventListener('dragstart', (event) => {
                const isChar = slot.classList.contains('team-slot');
                const id = isChar ? slot.dataset.characterId : slot.dataset.psychubeId;
                if (!id) {
                    event.preventDefault();
                    return;
                }
                const dragData = JSON.stringify({
                    source: 'slot',
                    type: isChar ? 'character' : 'psychube',
                    id: id,
                    sourceIndex: slot.dataset.slotIndex
                });
                event.dataTransfer.setData('application/json', dragData);
                event.dataTransfer.setDragImage(event.target, 20, 20); // プレビュー画像をスロット自体に設定
                setTimeout(() => slot.classList.add('dragging'), 0);
            });

            // ドラッグ終了
            slot.addEventListener('dragend', () => slot.classList.remove('dragging'));
        });

        // クリックでの削除
        document.querySelectorAll('.team-slot').forEach(slot => {
            slot.addEventListener('click', () => { if (slot.dataset.characterId) clearSlot(slot); });
        });
        document.querySelectorAll('.psychube-slot').forEach(slot => {
            slot.addEventListener('click', () => { if (slot.dataset.psychubeId) clearPsychubeSlot(slot); });
        });
    }

    // ドロップ処理を一元化
    function handleDrop(event) {
        event.preventDefault();
        const targetSlot = event.currentTarget;
        targetSlot.classList.remove('drag-over');

        const slotDataString = event.dataTransfer.getData('application/json');
        const listDataId = event.dataTransfer.getData('text/plain');

        if (slotDataString) {
            // --- スロットからスロットへの移動（入れ替え） ---
            const sourceData = JSON.parse(slotDataString);
            const sourceSlot = document.querySelector(`.${sourceData.type === 'character' ? 'team-slot' : 'psychube-slot'}[data-slot-index="${sourceData.sourceIndex}"]`);
            if (sourceSlot === targetSlot) return; // 同じスロットなら何もしない

            const targetIsCharSlot = targetSlot.classList.contains('team-slot');
            const targetId = targetIsCharSlot ? targetSlot.dataset.characterId : targetSlot.dataset.psychubeId;

            // タイプの違うスロットへのドロップは禁止
            if ((sourceData.type === 'character' && !targetIsCharSlot) || (sourceData.type === 'psychube' && targetIsCharSlot)) {
                return;
            }

            // ターゲットスロットにソースアイテムを配置
            if (sourceData.type === 'character') {
                const sourceChar = allCharacters.find(c => c.id == sourceData.id);
                fillSlot(targetSlot, sourceChar);
            } else {
                const sourcePsychube = allPsychubes.find(p => p.id === sourceData.id);
                fillPsychubeSlot(targetSlot, sourcePsychube);
            }

            // ソーススロットにターゲットアイテムを配置（入れ替え）
            if (targetId) {
                if (sourceData.type === 'character') {
                    const targetChar = allCharacters.find(c => c.id == targetId);
                    fillSlot(sourceSlot, targetChar);
                } else {
                    const targetPsychube = allPsychubes.find(p => p.id === targetId);
                    fillPsychubeSlot(sourceSlot, targetPsychube);
                }
            } else {
                // ターゲットが空ならソースをクリア
                if (sourceData.type === 'character') clearSlot(sourceSlot);
                else clearPsychubeSlot(sourceSlot);
            }

        } else if (listDataId) {
            // --- リストからスロットへの移動 ---
            const isPsychubeDrop = listDataId.startsWith('P');
            if (targetSlot.classList.contains('psychube-slot') && isPsychubeDrop) {
                const psychube = allPsychubes.find(p => p.id === listDataId);
                if (psychube) fillPsychubeSlot(targetSlot, psychube);
            } else if (targetSlot.classList.contains('team-slot') && !isPsychubeDrop) {
                const character = allCharacters.find(c => c.id == listDataId);
                if (character) fillSlot(targetSlot, character);
            }
        }
    }

    // 現在のチーム状態から共有用データを生成
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
        
        return { mode: currentMode, teams: teams };
    }

    // チームデータをUIに反映させる共通関数
    function loadTeamData(teamData) {
        currentMode = teamData.mode;
        modeSelector.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === currentMode);
        });
        renderTeamSlots();
        
        const flatTeamData = teamData.teams.flat();
        
        document.querySelectorAll('.slot-unit').forEach((unit, index) => {
            const data = flatTeamData[index];
            if (!data) return;

            const charSlot = unit.querySelector('.team-slot');
            const psychubeSlot = unit.querySelector('.psychube-slot');

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


    // スロットにキャラクターを配置
    function fillSlot(slot, character) {
        slot.innerHTML = generateCardHTML(character);
        slot.classList.add('slot-filled');
        slot.dataset.characterId = character.id;
        slot.setAttribute('draggable', true);
        updateTeamStats();
        updateMiniView();
    }
    
    // スロットを空にする
    function clearSlot(slot) {
        slot.innerHTML = `Slot ${parseInt(slot.dataset.slotIndex) % 4 + 1}`;
        slot.classList.remove('slot-filled');
        delete slot.dataset.characterId;
        slot.setAttribute('draggable', false);
        updateTeamStats();
        updateMiniView();
    }

    // PsychubeスロットにPsychubeを配置
    function fillPsychubeSlot(slot, psychube) {
        // 小さなカード表示にするため、HTMLを簡略化
        slot.innerHTML = generatePsychubeCardHTML(psychube); 
        slot.classList.add('slot-filled');
        slot.dataset.psychubeId = psychube.id;
        updateMiniView();
    }

    // Psychubeスロットを空にする
    function clearPsychubeSlot(slot) {
        slot.innerHTML = `Psychube`;
        slot.classList.remove('slot-filled');
        delete slot.dataset.psychubeId;
        updateMiniView();
    }
    
    // チーム統計を更新
    function updateTeamStats() {
        // この機能は複雑なので、一旦基本的な動作を優先し、
        // 必要であれば後で詳細に実装します。
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

    // 保存済みチームリストを描画
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
    
    // チーム情報を編集
    function editTeam(teamId) {
        const teams = getSavedTeams();
        const teamData = teams.find(t => t.id === teamId);
        const li = savedTeamsList.querySelector(`li[data-team-id="${teamId}"]`);
        if (!li || li.querySelector('.edit-form')) return; // 既に編集中なら何もしない

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
    
    // チームを読み込む
    function loadTeam(teamId) {
        const teams = getSavedTeams();
        const teamDataToLoad = teams.find(t => t.id === teamId);
        if (!teamDataToLoad) return;
        
        loadTeamData(teamDataToLoad);
        currentlyLoadedTeamId = teamId;
        closeSidePanel();
    }
    
    // チームデータをUIに反映させる共通関数
    function loadTeamData(teamData) {
        currentMode = teamData.mode;
        // モードボタンの表示を更新
        modeSelector.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === currentMode);
        });
        
        renderTeamSlots(); // 新しいモードでスロットを再描画
        
        const allSlots = document.querySelectorAll('.team-slot');
        const flatTeamIds = teamData.teams.flat();

        allSlots.forEach((slot, index) => {
            const charId = flatTeamIds[index];
            if (charId) {
                const character = allCharacters.find(c => c.id == charId);
                if (character) fillSlot(slot, character);
            } else {
                clearSlot(slot);
            }
        });

        // チーム名と説明をUIに反映
        loadedTeamTitle.value  = teamData.name || '';
        loadedTeamDesc.value = teamData.description || '';

        updateMiniView();
    }

    // チームを削除
    function deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team?')) return;
        let teams = getSavedTeams();
        teams = teams.filter(t => t.id !== teamId);
        saveTeamsToStorage(teams);
        renderSavedTeams();
    }
    
    // --- チーム共有（URL/コード/QR）関連 ---

    // 共有モーダルを開く
    function openShareModal(teamId = null) {
        const teamData = teamId 
            ? getSavedTeams().find(t => t.id === teamId)
            : generateCurrentTeamData();

        if (!teamData) {
            alert('The team is empty. Please add characters before sharing.');
            return;
        }
        
        const shareData = {
            m: teamData.mode,
            t: teamData.teams,
            n: teamData.name, // チーム名を追加
            d: teamData.description // 説明を追加
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

    // 現在のチーム状態から共有用データを生成
    function generateCurrentTeamData() {
        const teamIds = Array.from(document.querySelectorAll('.team-slot')).map(slot => slot.dataset.characterId || null);
        if (teamIds.every(id => id === null)) return null;
        
        const teams = [];
        for (let i = 0; i < teamIds.length; i += 4) {
            teams.push(teamIds.slice(i, i + 4));
        }
        
        return {
            mode: currentMode,
            teams: teams
        };
    }
    
    // QRコードを生成
    function generateQrCode(url) {
        qrcodeDisplay.innerHTML = '';
        try {
            const qr = qrcode(0, 'M');
            qr.addData(url);
            qr.make();
            qrcodeDisplay.innerHTML = qr.createImgTag(5, 10);
        } catch (e) {
            console.error("QR Code generation failed:", e);
            qrcodeDisplay.textContent = "QR Code could not be generated.";
        }
    }
    
    // URLハッシュからチームを読み込む
    function loadTeamFromUrl() {
        const hash = window.location.hash.substring(1);
        if (!hash) return false;

        try {
            const jsonString = decodeURIComponent(atob(hash));
            const sharedData = JSON.parse(jsonString);

            if (sharedData.m && sharedData.t) {
                // 読み込んだデータを内部形式に変換
                const teamDataForLoad = {
                    mode: sharedData.m,
                    teams: sharedData.t,
                    name: sharedData.n || 'Loaded from URL',
                    description: sharedData.d || ''
                };
                loadTeamData(teamDataForLoad);
                alert('Team loaded from URL!');
                // URLからハッシュを削除してリロードを防ぐ
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
    
    // チームコードから読み込み
    function loadTeamFromCode() {
        var code = teamCodeInput.value.trim();
        if (!code) {
            alert('Please paste a team code.');
            return;
        }
        // URLがペーストされた場合でも、#以降のコード部分だけを抽出する
        if (code.includes('#')) {
            code = code.split('#').pop();
        }
        try {
            const jsonString = decodeURIComponent(atob(code));
            const teamData = JSON.parse(jsonString);

            const sharedData = JSON.parse(jsonString); // 変数名を sharedData に統一

            if (sharedData.m && sharedData.t) {
                // 読み込んだデータを内部形式に変換
                const teamDataForLoad = {
                    mode: sharedData.m,
                    teams: sharedData.t,
                    name: sharedData.n || 'Loaded from Code',
                    description: sharedData.d || ''
                };
                loadTeamData(teamDataForLoad);
                currentlyLoadedTeamId = null; // 外部データなので保存済みIDは解除
                alert('Team loaded successfully!');
                closeSidePanel();
            } else {
                throw new Error('Invalid data format');
            }
        } catch(e) {
            alert('Invalid or corrupted team code.');
            console.error('Failed to load from team code:', e);
        }
    }

    // --- イベントリスナーの設定 ---

    const viewSwitcher = document.getElementById('view-switcher');
    const characterFilters = document.querySelector('.filter-row'); // 属性とダメージタイプのフィルター
    
    viewSwitcher.addEventListener('click', (event) => {
        if (event.target.matches('.view-btn')) {
            const selectedView = event.target.dataset.view;
            if (selectedView === currentView) return;

            currentView = selectedView;
            
            // ボタンのアクティブ状態を更新
            viewSwitcher.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            // 表示に応じてフィルターの表示/非表示を切り替え
            const isCharacters = currentView === 'characters';
            characterFilters.style.display = isCharacters ? 'flex' : 'none';
            specialtyFiltersContainer.style.display = isCharacters ? 'flex' : 'none';
            tagFiltersContainer.style.display = isCharacters ? 'flex' : 'none';
            sortButtons.forEach(btn => {
                const targetView = btn.dataset.view;
                btn.classList.toggle('hidden', targetView !== currentView && targetView);
            });
            
            // 検索バーのプレースホルダーを更新
            searchBar.placeholder = isCharacters ? 'Search by character name...' : 'Search by psychube name...';

            applyFilters();
        }
    });


    // モード切替
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

    // サイドパネルの開閉
    menuButton.addEventListener('click', openSidePanel);
    closePanelButton.addEventListener('click', closeSidePanel);
    sidePanelOverlay.addEventListener('click', (event) => {
        if (event.target === sidePanelOverlay) closeSidePanel();
    });

    // サイドパネルのタブ切替
    panelNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanelId = `panel-content-${button.dataset.panel}`;
            panelNavButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            panelContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetPanelId).classList.add('active');
        });
    });
    
    // 現在のチームを保存
    saveTeamForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = loadedTeamTitle.value.trim();
        if (!name) { alert('Team Name is required.'); return; }

        const teamData = generateCurrentTeamData();
        if (!teamData) { alert('Cannot save an empty team.'); return; }
        
        const newTeam = {
            id: Date.now().toString(),
            name: name,
            description: loadedTeamDesc.value.trim(),
            mode: teamData.mode,
            teams: teamData.teams
        };
        
        const savedTeams = getSavedTeams();
        savedTeams.push(newTeam);
        saveTeamsToStorage(savedTeams);

        loadedTeamTitle.value = '';
        loadedTeamDesc.value = '';
        renderSavedTeams();
    });

    // 検索バー
    searchBar.addEventListener('input', applyFilters);

    // 言語切替
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
    
    // 共有モーダルのURLコピー
    copyUrlButton.addEventListener('click', () => {
        shareUrlInput.select();
        navigator.clipboard.writeText(shareUrlInput.value)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => alert('Failed to copy link.'));
    });

    // 共有モーダルの閉じるボタン
    closeShareModalButton.addEventListener('click', closeShareModal);
    shareModal.addEventListener('click', (event) => {
        if (event.target === shareModal) closeShareModal();
    });
    
    // チームコード読み込みボタン
    loadTeamFromCodeButton.addEventListener('click', loadTeamFromCode);
    clearInputButton.addEventListener('click', () => teamCodeInput.value = '');

    // チームメモの自動保存
    // 削除した場所に、以下の新しいコードを追加してください
    let saveTimeout;
    function handleAutoSave() {
        if (!currentlyLoadedTeamId) return;
        clearTimeout(saveTimeout);
        saveStatusElement.textContent = 'Saving...';
        saveTimeout = setTimeout(() => {
            let teams = getSavedTeams();
            const teamIndex = teams.findIndex(t => t.id === currentlyLoadedTeamId);
            if (teamIndex > -1) {
                teams[teamIndex].name = loadedTeamTitle.value; // チーム名も保存
                teams[teamIndex].description = loadedTeamDesc.value;
                saveTeamsToStorage(teams);
                saveStatusElement.textContent = 'Saved!';
                setTimeout(() => saveStatusElement.textContent = '', 2000);
            }
        }, 1000);
    }

    loadedTeamTitle.addEventListener('input', handleAutoSave); // チーム名入力欄にリスナー設定
    loadedTeamDesc.addEventListener('input', handleAutoSave);  // 説明入力欄にリスナー設定


    // 1. 監視対象とミニビューの要素を取得
    const teamSection = document.querySelector('.team-section');
    const miniTeamView = document.getElementById('mini-team-view');
    //const teamSlotsContainer = document.getElementById('team-slots-container');

    // 2. ミニビューの中身を更新する関数
    function updateMiniView() {
        // 現在のチームスロットをコピーしてミニビューに入れる
        miniTeamView.innerHTML = ''; // 一旦空にする
        const clonedSlots = teamSlotsContainer.cloneNode(true);
        miniTeamView.appendChild(clonedSlots);
    }

    // 3. チームに変化があるたびにミニビューも更新する
    // モード変更時も更新
    modeSelector.addEventListener('click', (event) => {
        const target = event.target.closest('.mode-btn');
        if (target) {
            currentMode = target.dataset.mode;
            modeSelector.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            renderTeamSlots();
            updateMiniView(); // 末尾に追加
        }
    });


    // 4. Intersection Observerの設定
    const observerOptions = {
        rootMargin: '0px',
        threshold: 0.05 // 5%見えたらトリガー
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // team-sectionが見えている時はミニビューを隠す
                miniTeamView.classList.add('hidden');
            } else {
                // 見えなくなった時にミニビューを表示する
                miniTeamView.classList.remove('hidden');
            }
        });
    }, observerOptions);

    // 5. team-sectionの監視を開始
    observer.observe(teamSection);

    // ▼▼▼ ここからミニビューのドラッグ＆ドロップ機能を追加 ▼▼▼

    // ミニビューの上をドラッグ中の処理
    miniTeamView.addEventListener('dragover', (event) => {
        event.preventDefault(); // ドロップを許可するために必須
        miniTeamView.classList.add('drag-over');

        // ★★★ 変更点 ★★★ キャラとPsychube両方のスロットを対象にする
        const targetSlot = event.target.closest('.team-slot, .psychube-slot');
        document.querySelectorAll('.mini-team-view .team-slot, .mini-team-view .psychube-slot').forEach(slot => {
            slot.classList.toggle('drag-over-slot', slot === targetSlot);
        });
    });

    // ミニビューからドラッグが離れた時の処理
    miniTeamView.addEventListener('dragleave', () => {
        miniTeamView.classList.remove('drag-over');
        // ★★★ 変更点 ★★★ キャラとPsychube両方のスロットを対象にする
        document.querySelectorAll('.mini-team-view .team-slot, .mini-team-view .psychube-slot').forEach(slot => {
            slot.classList.remove('drag-over-slot');
        });
    });

    // ミニビューにドロップされた時の処理
    miniTeamView.addEventListener('drop', (event) => {
        event.preventDefault();
        miniTeamView.classList.remove('drag-over');
        document.querySelectorAll('.mini-team-view .team-slot, .mini-team-view .psychube-slot').forEach(slot => {
            slot.classList.remove('drag-over-slot');
        });

        const id = event.dataTransfer.getData('text/plain');
        const isPsychubeDrop = id.startsWith('P');
        const targetSlot = event.target.closest('.team-slot, .psychube-slot');
        if (!targetSlot) return;

        const slotIndex = targetSlot.dataset.slotIndex;

        if (isPsychubeDrop && targetSlot.classList.contains('psychube-slot')) {
            // PsychubeをPsychubeスロットにドロップ
            const originalSlot = teamSlotsContainer.querySelector(`.psychube-slot[data-slot-index="${slotIndex}"]`);
            const psychube = allPsychubes.find(p => p.id === id);
            if (originalSlot && psychube) fillPsychubeSlot(originalSlot, psychube);

        } else if (!isPsychubeDrop && targetSlot.classList.contains('team-slot')) {
            // キャラをキャラクタースロットにドロップ
            const originalSlot = teamSlotsContainer.querySelector(`.team-slot[data-slot-index="${slotIndex}"]`);
            const character = allCharacters.find(c => c.id == id);
            if (originalSlot && character) fillSlot(originalSlot, character);
        }
    });

    // ▼▼▼ ここからミニビューのキャラ削除機能を追加 ▼▼▼

    miniTeamView.addEventListener('click', (event) => {
        // 1. クリックされたのがキャラクタースロットか確認
        const targetMiniSlot = event.target.closest('.team-slot');

        // スロット以外、または空のスロットがクリックされた場合は何もしない
        if (!targetMiniSlot || !targetMiniSlot.dataset.characterId) {
            return;
        }

        // 2. スロットの番号（インデックス）を取得
        const slotIndex = targetMiniSlot.dataset.slotIndex;

        // 3. メインのチーム編成エリアから、同じ番号の「本物」のスロットを探す
        const originalSlot = teamSlotsContainer.querySelector(`.team-slot[data-slot-index="${slotIndex}"]`);
        
        // 4. 「本物」のスロットを空にする（既存の関数を呼ぶだけ！）
        if (originalSlot) {
            clearSlot(originalSlot);
        }
    });
});

// TODO: Screen Shot
// TODO: QR code 
// TODO: Pcychube
// TODO: Character detail page -> キャラをクリックしたら詳細ページへ
// TODO: Team Stats