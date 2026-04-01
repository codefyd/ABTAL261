// Admin Page JavaScript

let currentSection = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
    setupNavigation();
});

function initializeAdmin() {
    showLoading();
    loadDashboard();
    loadTeams();
    loadPlayers();
    loadMatchesAdmin();
    loadTeamFilter();
    hideLoading();
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = href.substring(1);
                showSection(section);
            }
        });
    });
}

function showSection(section) {
    currentSection = section;
    
    // Update active class on nav links
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${section}`) {
            link.classList.add('active');
        }
    });
    
    // Show/hide sections
    document.querySelectorAll('.admin-section').forEach(sectionEl => {
        sectionEl.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    // Load section data
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'teams':
            loadTeams();
            break;
        case 'players':
            loadPlayers();
            break;
        case 'matches':
            loadMatchesAdmin();
            break;
    }
}

function loadDashboard() {
    const teams = DataManager.loadData('TEAMS');
    const players = DataManager.loadData('PLAYERS');
    const matches = DataManager.loadData('MATCHES');
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    
    const finishedMatches = matches.filter(m => m.status === 'finished').length;
    const totalGoals = matchEvents.filter(e => e.type === 'goal').length;
    const yellowCards = matchEvents.filter(e => e.type === 'yellow_card').length;
    const redCards = matchEvents.filter(e => e.type === 'red_card').length;
    
    const stats = [
        { icon: 'fa-users', value: teams.length, label: 'الفرق', color: '#007bff' },
        { icon: 'fa-user-friends', value: players.length, label: 'اللاعبون', color: '#28a745' },
        { icon: 'fa-calendar-alt', value: matches.length, label: 'المباريات', color: '#ffc107' },
        { icon: 'fa-check-circle', value: finishedMatches, label: 'مباريات منتهية', color: '#17a2b8' },
        { icon: 'fa-futbol', value: totalGoals, label: 'الأهداف', color: '#dc3545' },
        { icon: 'fa-square', value: yellowCards + redCards, label: 'البطاقات', color: '#fd7e14' }
    ];
    
    const dashboardStats = document.getElementById('dashboardStats');
    dashboardStats.innerHTML = stats.map(stat => `
        <div class="col-md-4 col-lg-3 mb-3">
            <div class="kpi-card" style="border-top: 4px solid ${stat.color}">
                <i class="fas ${stat.icon}" style="color: ${stat.color}"></i>
                <h3>${stat.value}</h3>
                <p>${stat.label}</p>
                <i class="fas ${stat.icon} bg-icon-float"></i>
            </div>
        </div>
    `).join('');
    
    // Load recent matches
    const recentMatches = [...matches].reverse().slice(0, 5);
    const recentMatchesHtml = recentMatches.map(match => {
        const team1 = teams.find(t => t.id === match.team1Id);
        const team2 = teams.find(t => t.id === match.team2Id);
        return `
            <div class="match-card" onclick="editMatch('${match.id}')">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${team1?.name} vs ${team2?.name}</span>
                    <span class="badge ${match.status === 'finished' ? 'bg-success' : 'bg-warning'}">
                        ${match.status === 'finished' ? 'منتهية' : 'قادمة'}
                    </span>
                </div>
                <small>${match.date} - ${match.time}</small>
            </div>
        `;
    }).join('');
    document.getElementById('recentMatches').innerHTML = recentMatchesHtml || '<p>لا توجد مباريات</p>';
    
    // Load top scorers preview
    const players = DataManager.loadData('PLAYERS');
    const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5);
    const topScorersHtml = topScorers.map(player => {
        const team = teams.find(t => t.id === player.teamId);
        return `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${player.name} (${team?.name})</span>
                <span class="badge bg-primary">${player.goals} هدف</span>
            </div>
        `;
    }).join('');
    document.getElementById('topScorersPreview').innerHTML = topScorersHtml || '<p>لا توجد أهداف مسجلة</p>';
}

function loadTeams() {
    const teams = DataManager.loadData('TEAMS');
    const container = document.getElementById('teamsContainer');
    
    container.innerHTML = teams.map(team => `
        <div class="col-md-6 col-lg-4">
            <div class="team-admin-card">
                <div class="d-flex align-items-center">
                    ${team.logo ? `<img src="${team.logo}" style="width: 40px; height: 40px; border-radius: 50%; margin-left: 10px;">` : ''}
                    <div>
                        <h6 class="mb-0">${team.name}</h6>
                        <small class="text-muted">المجموعة ${team.group}</small>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-warning" onclick="editTeam('${team.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTeam('${team.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddTeamModal() {
    document.getElementById('teamModalTitle').textContent = 'إضافة فريق';
    document.getElementById('teamId').value = '';
    document.getElementById('teamName').value = '';
    document.getElementById('teamGroup').value = 'A';
    document.getElementById('teamLogo').value = '';
    document.getElementById('teamColor').value = '#007bff';
    
    const modal = new bootstrap.Modal(document.getElementById('teamModal'));
    modal.show();
}

function editTeam(teamId) {
    const teams = DataManager.loadData('TEAMS');
    const team = teams.find(t => t.id === teamId);
    
    if (team) {
        document.getElementById('teamModalTitle').textContent = 'تعديل فريق';
        document.getElementById('teamId').value = team.id;
        document.getElementById('teamName').value = team.name;
        document.getElementById('teamGroup').value = team.group;
        document.getElementById('teamLogo').value = team.logo || '';
        document.getElementById('teamColor').value = team.color || '#007bff';
        
        const modal = new bootstrap.Modal(document.getElementById('teamModal'));
        modal.show();
    }
}

function saveTeam() {
    const teamId = document.getElementById('teamId').value;
    const teamName = document.getElementById('teamName').value;
    const teamGroup = document.getElementById('teamGroup').value;
    const teamLogo = document.getElementById('teamLogo').value;
    const teamColor = document.getElementById('teamColor').value;
    
    if (!teamName) {
        showToast('يرجى إدخال اسم الفريق', 'error');
        return;
    }
    
    const teams = DataManager.loadData('TEAMS');
    
    if (teamId) {
        // Update existing team
        const index = teams.findIndex(t => t.id === teamId);
        if (index !== -1) {
            teams[index] = {
                ...teams[index],
                name: teamName,
                group: teamGroup,
                logo: teamLogo,
                color: teamColor
            };
            DataManager.saveData('TEAMS', teams);
            showToast('تم تحديث الفريق بنجاح');
        }
    } else {
        // Add new team
        const newTeam = {
            id: `team_${Date.now()}`,
            name: teamName,
            group: teamGroup,
            logo: teamLogo,
            color: teamColor,
            stats: {
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0
            }
        };
        teams.push(newTeam);
        DataManager.saveData('TEAMS', teams);
        showToast('تم إضافة الفريق بنجاح');
    }
    
    bootstrap.Modal.getInstance(document.getElementById('teamModal')).hide();
    loadTeams();
    loadDashboard();
    loadTeamFilter();
}

function deleteTeam(teamId) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذا الفريق؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            let teams = DataManager.loadData('TEAMS');
            teams = teams.filter(t => t.id !== teamId);
            DataManager.saveData('TEAMS', teams);
            
            // Also remove players from this team
            let players = DataManager.loadData('PLAYERS');
            players = players.filter(p => p.teamId !== teamId);
            DataManager.saveData('PLAYERS', players);
            
            showToast('تم حذف الفريق بنجاح');
            loadTeams();
            loadDashboard();
            loadTeamFilter();
        }
    });
}

function loadTeamFilter() {
    const teams = DataManager.loadData('TEAMS');
    const teamFilter = document.getElementById('teamFilter');
    if (teamFilter) {
        teamFilter.innerHTML = '<option value="all">جميع الفرق</option>' +
            teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
    }
}

function loadPlayers() {
    const teamFilter = document.getElementById('teamFilter')?.value || 'all';
    let players = DataManager.loadData('PLAYERS');
    const teams = DataManager.loadData('TEAMS');
    
    if (teamFilter !== 'all') {
        players = players.filter(p => p.teamId === teamFilter);
    }
    
    const container = document.getElementById('playersContainer');
    container.innerHTML = players.map(player => {
        const team = teams.find(t => t.id === player.teamId);
        return `
            <div class="col-md-6 col-lg-4">
                <div class="player-card">
                    <div class="player-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${team?.name || ''}</div>
                    <div class="player-goals">${player.goals} أهداف</div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-warning" onclick="editPlayer('${player.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deletePlayer('${player.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAddPlayerModal() {
    document.getElementById('playerModalTitle').textContent = 'إضافة لاعب';
    document.getElementById('playerId').value = '';
    document.getElementById('playerName').value = '';
    document.getElementById('playerPosition').value = 'مهاجم';
    document.getElementById('playerNumber').value = '';
    
    loadTeamsToSelect();
    
    const modal = new bootstrap.Modal(document.getElementById('playerModal'));
    modal.show();
}

function loadTeamsToSelect() {
    const teams = DataManager.loadData('TEAMS');
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = teams.map(team => 
        `<option value="${team.id}">${team.name}</option>`
    ).join('');
}

function editPlayer(playerId) {
    const players = DataManager.loadData('PLAYERS');
    const player = players.find(p => p.id === playerId);
    
    if (player) {
        document.getElementById('playerModalTitle').textContent = 'تعديل لاعب';
        document.getElementById('playerId').value = player.id;
        document.getElementById('playerName').value = player.name;
        document.getElementById('playerPosition').value = player.position;
        document.getElementById('playerNumber').value = player.number;
        
        loadTeamsToSelect();
        document.getElementById('playerTeam').value = player.teamId;
        
        const modal = new bootstrap.Modal(document.getElementById('playerModal'));
        modal.show();
    }
}

function savePlayer() {
    const playerId = document.getElementById('playerId').value;
    const playerName = document.getElementById('playerName').value;
    const playerTeam = document.getElementById('playerTeam').value;
    const playerPosition = document.getElementById('playerPosition').value;
    const playerNumber = document.getElementById('playerNumber').value;
    
    if (!playerName || !playerTeam) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const players = DataManager.loadData('PLAYERS');
    
    if (playerId) {
        // Update existing player
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            players[index] = {
                ...players[index],
                name: playerName,
                teamId: playerTeam,
                position: playerPosition,
                number: parseInt(playerNumber) || players[index].number
            };
            DataManager.saveData('PLAYERS', players);
            showToast('تم تحديث اللاعب بنجاح');
        }
    } else {
        // Add new player
        const newPlayer = {
            id: `player_${Date.now()}`,
            name: playerName,
            teamId: playerTeam,
            position: playerPosition,
            number: parseInt(playerNumber) || 0,
            goals: 0,
            manOfMatch: 0
        };
        players.push(newPlayer);
        DataManager.saveData('PLAYERS', players);
        showToast('تم إضافة اللاعب بنجاح');
    }
    
    bootstrap.Modal.getInstance(document.getElementById('playerModal')).hide();
    loadPlayers();
    loadDashboard();
}

function deletePlayer(playerId) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذا اللاعب؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            let players = DataManager.loadData('PLAYERS');
            players = players.filter(p => p.id !== playerId);
            DataManager.saveData('PLAYERS', players);
            showToast('تم حذف اللاعب بنجاح');
            loadPlayers();
            loadDashboard();
        }
    });
}

function loadMatchesAdmin() {
    const matches = DataManager.loadData('MATCHES');
    const teams = DataManager.loadData('TEAMS');
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    
    const container = document.getElementById('matchesAdminContainer');
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد مباريات. قم بإنشاء جدول المباريات أولاً.</div>';
        return;
    }
    
    container.innerHTML = matches.map(match => {
        const team1 = teams.find(t => t.id === match.team1Id);
        const team2 = teams.find(t => t.id === match.team2Id);
        const events = matchEvents.filter(e => e.matchId === match.id);
        const goals1 = events.filter(e => e.type === 'goal' && e.teamId === match.team1Id).length;
        const goals2 = events.filter(e => e.type === 'goal' && e.teamId === match.team2Id).length;
        
        return `
            <div class="match-card mb-3">
                <div class="match-info">
                    <div class="match-teams">
                        <div class="team">
                            ${team1?.logo ? `<img src="${team1.logo}" alt="${team1.name}">` : ''}
                            <div class="team-name-small">${team1?.name}</div>
                        </div>
                        <div class="match-score">
                            ${match.status === 'finished' ? `${goals1} - ${goals2}` : 'vs'}
                        </div>
                        <div class="team">
                            ${team2?.logo ? `<img src="${team2.logo}" alt="${team2.name}">` : ''}
                            <div class="team-name-small">${team2?.name}</div>
                        </div>
                    </div>
                    <div class="match-details">
                        <div><i class="fas fa-calendar"></i> ${match.date}</div>
                        <div><i class="fas fa-clock"></i> ${match.time}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${match.stadium}</div>
                        <div><i class="fas fa-chart-line"></i> ${getStageName(match.stage)}</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-primary" onclick="editMatch('${match.id}')">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-sm btn-success" onclick="enterMatchResult('${match.id}')">
                            <i class="fas fa-futbol"></i> نتيجة
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMatch('${match.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateGroupMatches() {
    const teams = DataManager.loadData('TEAMS');
    const groupA = teams.filter(t => t.group === 'A');
    const groupB = teams.filter(t => t.group === 'B');
    
    let matches = [];
    const startDate = new Date();
    
    // Generate matches for group A
    matches.push(...generateMatchesForGroup(groupA, 'A', startDate));
    
    // Generate matches for group B
    matches.push(...generateMatchesForGroup(groupB, 'B', new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)));
    
    // Save matches
    DataManager.saveData('MATCHES', matches);
    showToast('تم توليد مباريات المجموعات بنجاح');
    loadMatchesAdmin();
    loadMatches();
}

function generateMatchesForGroup(teams, group, startDate) {
    const matches = [];
    let matchIndex = 0;
    
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const matchDate = new Date(startDate);
            matchDate.setDate(startDate.getDate() + matchIndex);
            
            matches.push({
                id: `match_${group}_${i}_${j}_${Date.now()}_${matchIndex}`,
                team1Id: teams[i].id,
                team1Name: teams[i].name,
                team2Id: teams[j].id,
                team2Name: teams[j].name,
                date: matchDate.toLocaleDateString('ar-SA'),
                time: '20:00',
                stadium: `ملعب ${group}`,
                stage: 'groups',
                status: 'upcoming',
                notes: ''
            });
            matchIndex++;
        }
    }
    
    return matches;
}

function generateKnockoutMatches() {
    const qualified = DataManager.getQualifiedTeams();
    
    if (!qualified.firstA || !qualified.secondA || !qualified.firstB || !qualified.secondB) {
        showToast('لا يمكن توليد مباريات خروج المغلوب. تأكد من اكتمال دور المجموعات.', 'error');
        return;
    }
    
    const matches = DataManager.loadData('MATCHES');
    
    // Semi-final 1: First A vs Second B
    const semi1 = {
        id: `semi_1_${Date.now()}`,
        team1Id: qualified.firstA.id,
        team1Name: qualified.firstA.name,
        team2Id: qualified.secondB.id,
        team2Name: qualified.secondB.name,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
        time: '20:00',
        stadium: 'الملعب الرئيسي',
        stage: 'semi',
        status: 'upcoming',
        notes: ''
    };
    
    // Semi-final 2: First B vs Second A
    const semi2 = {
        id: `semi_2_${Date.now()}`,
        team1Id: qualified.firstB.id,
        team1Name: qualified.firstB.name,
        team2Id: qualified.secondA.id,
        team2Name: qualified.secondA.name,
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
        time: '20:00',
        stadium: 'الملعب الرئيسي',
        stage: 'semi',
        status: 'upcoming',
        notes: ''
    };
    
    matches.push(semi1, semi2);
    DataManager.saveData('MATCHES', matches);
    showToast('تم توليد مباريات نصف النهائي بنجاح');
    loadMatchesAdmin();
    loadMatches();
}

function editMatch(matchId) {
    // Implementation for editing match details
    showToast('سيتم إضافة هذه الميزة قريباً', 'info');
}

function enterMatchResult(matchId) {
    const matches = DataManager.loadData('MATCHES');
    const match = matches.find(m => m.id === matchId);
    const teams = DataManager.loadData('TEAMS');
    const players = DataManager.loadData('PLAYERS');
    
    if (!match) return;
    
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    const team1Players = players.filter(p => p.teamId === match.team1Id);
    const team2Players = players.filter(p => p.teamId === match.team2Id);
    
    const modalBody = document.getElementById('matchResultBody');
    modalBody.innerHTML = `
        <form id="matchResultForm">
            <input type="hidden" id="resultMatchId" value="${match.id}">
            <div class="row">
                <div class="col-md-6">
                    <h5>${team1?.name}</h5>
                    <div class="mb-3">
                        <label class="form-label">عدد الأهداف</label>
                        <input type="number" class="form-control" id="goals1" min="0" value="0">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">الهدافون</label>
                        <div id="scorers1"></div>
                        <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addScorer('1')">
                            <i class="fas fa-plus"></i> إضافة هداف
                        </button>
                    </div>
                </div>
                <div class="col-md-6">
                    <h5>${team2?.name}</h5>
                    <div class="mb-3">
                        <label class="form-label">عدد الأهداف</label>
                        <input type="number" class="form-control" id="goals2" min="0" value="0">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">الهدافون</label>
                        <div id="scorers2"></div>
                        <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addScorer('2')">
                            <i class="fas fa-plus"></i> إضافة هداف
                        </button>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">أفضل لاعب في المباراة</label>
                <select class="form-select" id="manOfMatch">
                    <option value="">اختر لاعب</option>
                    ${[...team1Players, ...team2Players].map(p => `<option value="${p.id}">${p.name} (${p.teamId === match.team1Id ? team1?.name : team2?.name})</option>`).join('')}
                </select>
            </div>
            ${match.stage !== 'groups' ? `
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="hasPenalties">
                        <label class="form-check-label">ركلات ترجيح</label>
                    </div>
                    <div id="penaltiesSection" style="display: none;">
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <label>ركلات ترجيح ${team1?.name}</label>
                                <input type="number" class="form-control" id="penalties1" min="0">
                            </div>
                            <div class="col-md-6">
                                <label>ركلات ترجيح ${team2?.name}</label>
                                <input type="number" class="form-control" id="penalties2" min="0">
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
        </form>
    `;
    
    // Add penalty checkbox listener
    const hasPenaltiesCheckbox = document.getElementById('hasPenalties');
    if (hasPenaltiesCheckbox) {
        hasPenaltiesCheckbox.addEventListener('change', (e) => {
            const penaltiesSection = document.getElementById('penaltiesSection');
            penaltiesSection.style.display = e.target.checked ? 'block' : 'none';
        });
    }
    
    // Store players data for scorer selection
    window.currentScorerData = {
        team1Players,
        team2Players,
        team1,
        team2
    };
    
    const modal = new bootstrap.Modal(document.getElementById('matchResultModal'));
    modal.show();
}

function addScorer(teamNumber) {
    const players = teamNumber === '1' ? window.currentScorerData.team1Players : window.currentScorerData.team2Players;
    const team = teamNumber === '1' ? window.currentScorerData.team1 : window.currentScorerData.team2;
    const containerId = `scorers${teamNumber}`;
    const container = document.getElementById(containerId);
    
    const scorerDiv = document.createElement('div');
    scorerDiv.className = 'scorer-item mb-2';
    scorerDiv.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <select class="form-select scorer-player" data-team="${teamNumber}">
                    <option value="">اختر لاعب</option>
                    ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control scorer-minute" placeholder="الدقيقة">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(scorerDiv);
}

function saveMatchResult() {
    const matchId = document.getElementById('resultMatchId').value;
    const goals1 = parseInt(document.getElementById('goals1')?.value) || 0;
    const goals2 = parseInt(document.getElementById('goals2')?.value) || 0;
    const manOfMatch = document.getElementById('manOfMatch')?.value;
    const hasPenalties = document.getElementById('hasPenalties')?.checked || false;
    const penalties1 = parseInt(document.getElementById('penalties1')?.value) || 0;
    const penalties2 = parseInt(document.getElementById('penalties2')?.value) || 0;
    
    // Collect scorers
    const scorers = [];
    document.querySelectorAll('.scorer-item').forEach(item => {
        const playerId = item.querySelector('.scorer-player')?.value;
        const minute = parseInt(item.querySelector('.scorer-minute')?.value);
        const team = item.querySelector('.scorer-player')?.dataset.team;
        if (playerId && minute) {
            scorers.push({ playerId, minute, team });
        }
    });
    
    // Update match status
    const matches = DataManager.loadData('MATCHES');
    const matchIndex = matches.findIndex(m => m.id === matchId);
    
    if (matchIndex !== -1) {
        matches[matchIndex].status = 'finished';
        if (hasPenalties) {
            matches[matchIndex].penaltyWinner = penalties1 > penalties2 ? matches[matchIndex].team1Id : matches[matchIndex].team2Id;
        }
        DataManager.saveData('MATCHES', matches);
    }
    
    // Save match events
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    const newEvents = [];
    
    // Add goals
    scorers.forEach(scorer => {
        newEvents.push({
            id: `event_${Date.now()}_${Math.random()}`,
            matchId: matchId,
            type: 'goal',
            playerId: scorer.playerId,
            teamId: scorer.team === '1' ? matches[matchIndex]?.team1Id : matches[matchIndex]?.team2Id,
            minute: scorer.minute
        });
    });
    
    // Add man of match
    if (manOfMatch) {
        newEvents.push({
            id: `event_${Date.now()}_mom`,
            matchId: matchId,
            type: 'man_of_match',
            playerId: manOfMatch,
            minute: 0
        });
    }
    
    matchEvents.push(...newEvents);
    DataManager.saveData('MATCH_EVENTS', matchEvents);
    
    // Update team stats
    const teams = DataManager.loadData('TEAMS');
    const match = matches[matchIndex];
    
    // Determine winner
    let winnerId = null;
    let isDraw = false;
    
    if (hasPenalties) {
        winnerId = penalties1 > penalties2 ? match.team1Id : match.team2Id;
        isDraw = false;
    } else {
        if (goals1 > goals2) {
            winnerId = match.team1Id;
        } else if (goals2 > goals1) {
            winnerId = match.team2Id;
        } else {
            isDraw = true;
        }
    }
    
    // Update stats for team 1
    const team1Stats = {
        goalsFor: goals1,
        goalsAgainst: goals2,
        won: winnerId === match.team1Id,
        drawn: isDraw,
        lost: winnerId === match.team2Id
    };
    DataManager.updateTeamStats(match.team1Id, team1Stats);
    
    // Update stats for team 2
    const team2Stats = {
        goalsFor: goals2,
        goalsAgainst: goals1,
        won: winnerId === match.team2Id,
        drawn: isDraw,
        lost: winnerId === match.team1Id
    };
    DataManager.updateTeamStats(match.team2Id, team2Stats);
    
    // Update player goals
    const players = DataManager.loadData('PLAYERS');
    scorers.forEach(scorer => {
        const playerIndex = players.findIndex(p => p.id === scorer.playerId);
        if (playerIndex !== -1) {
            players[playerIndex].goals++;
            DataManager.saveData('PLAYERS', players);
        }
    });
    
    // Update man of match count
    if (manOfMatch) {
        const playerIndex = players.findIndex(p => p.id === manOfMatch);
        if (playerIndex !== -1) {
            players[playerIndex].manOfMatch++;
            DataManager.saveData('PLAYERS', players);
        }
    }
    
    // Check for knockout stage and generate next matches
    if (match.stage === 'semi') {
        const semiMatches = matches.filter(m => m.stage === 'semi' && m.status === 'finished');
        if (semiMatches.length === 2) {
            // Generate final match
            const winner1 = getWinnerFromMatch(semiMatches[0]);
            const winner2 = getWinnerFromMatch(semiMatches[1]);
            
            if (winner1 && winner2) {
                const finalMatch = {
                    id: `final_${Date.now()}`,
                    team1Id: winner1,
                    team1Name: teams.find(t => t.id === winner1)?.name,
                    team2Id: winner2,
                    team2Name: teams.find(t => t.id === winner2)?.name,
                    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
                    time: '21:00',
                    stadium: 'الملعب الرئيسي',
                    stage: 'final',
                    status: 'upcoming',
                    notes: ''
                };
                matches.push(finalMatch);
                DataManager.saveData('MATCHES', matches);
                showToast('تم توليد مباراة النهائي تلقائياً');
            }
        }
    }
    
    showToast('تم حفظ نتيجة المباراة بنجاح');
    bootstrap.Modal.getInstance(document.getElementById('matchResultModal')).hide();
    loadDashboard();
    loadMatchesAdmin();
    loadMatches();
    loadTopScorers();
}

function getWinnerFromMatch(match) {
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    const events = matchEvents.filter(e => e.matchId === match.id);
    const goals1 = events.filter(e => e.type === 'goal' && e.teamId === match.team1Id).length;
    const goals2 = events.filter(e => e.type === 'goal' && e.teamId === match.team2Id).length;
    
    if (goals1 > goals2) return match.team1Id;
    if (goals2 > goals1) return match.team2Id;
    return match.penaltyWinner || null;
}

function deleteMatch(matchId) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذه المباراة؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            let matches = DataManager.loadData('MATCHES');
            matches = matches.filter(m => m.id !== matchId);
            DataManager.saveData('MATCHES', matches);
            
            // Also delete related events
            let matchEvents = DataManager.loadData('MATCH_EVENTS');
            matchEvents = matchEvents.filter(e => e.matchId !== matchId);
            DataManager.saveData('MATCH_EVENTS', matchEvents);
            
            showToast('تم حذف المباراة بنجاح');
            loadMatchesAdmin();
            loadMatches();
        }
    });
}
