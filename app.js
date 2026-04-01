// Public Page JavaScript

// Load all data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllPublicData();
});

async function loadAllPublicData() {
    showLoading();
    
    try {
        await Promise.all([
            loadHeroStats(),
            loadGroups(),
            loadGeneralStats(),
            loadMatches(),
            loadTopScorers(),
            loadBestPlayers()
        ]);
        
        checkAndShowChampion();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('حدث خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

async function loadHeroStats() {
    const teams = DataManager.loadData('TEAMS');
    const matches = DataManager.loadData('MATCHES');
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    
    const totalGoals = matchEvents.filter(e => e.type === 'goal').length;
    const finishedMatches = matches.filter(m => m.status === 'finished').length;
    
    document.getElementById('totalTeams').textContent = teams.length;
    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('totalMatches').textContent = matches.length;
    document.getElementById('finishedMatches').textContent = finishedMatches;
}

async function loadGroups() {
    const groupsContainer = document.getElementById('groupsContainer');
    groupsContainer.innerHTML = '';
    
    for (const group of CONFIG.groups) {
        const standings = DataManager.calculateGroupStandings(group);
        const groupCard = createGroupCard(group, standings);
        groupsContainer.appendChild(groupCard);
    }
}

function createGroupCard(group, standings) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 mb-4';
    
    let tableHtml = `
        <div class="group-card">
            <div class="group-header">
                <h3>المجموعة ${group}</h3>
            </div>
            <div class="table-responsive">
                <table class="table table-group">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الفريق</th>
                            <th>لعب</th>
                            <th>ف</th>
                            <th>ت</th>
                            <th>خ</th>
                            <th>له</th>
                            <th>عليه</th>
                            <th>فارق</th>
                            <th>نقاط</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    standings.forEach((team, index) => {
        const gd = team.stats.goalsFor - team.stats.goalsAgainst;
        tableHtml += `
            <tr>
                <td class="team-rank">${index + 1}</td>
                <td class="team-name">
                    ${team.logo ? `<img src="${team.logo}" class="team-logo" alt="${team.name}">` : ''}
                    ${team.name}
                </td>
                <td>${team.stats.played}</td>
                <td>${team.stats.won}</td>
                <td>${team.stats.drawn}</td>
                <td>${team.stats.lost}</td>
                <td>${team.stats.goalsFor}</td>
                <td>${team.stats.goalsAgainst}</td>
                <td>${gd}</td>
                <td><strong>${team.stats.points}</strong></td>
            </tr>
        `;
    });
    
    tableHtml += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    col.innerHTML = tableHtml;
    return col;
}

async function loadGeneralStats() {
    const statsContainer = document.getElementById('generalStats');
    const teams = DataManager.loadData('TEAMS');
    const matches = DataManager.loadData('MATCHES');
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    
    const totalGoals = matchEvents.filter(e => e.type === 'goal').length;
    const yellowCards = matchEvents.filter(e => e.type === 'yellow_card').length;
    const redCards = matchEvents.filter(e => e.type === 'red_card').length;
    
    let bestAttack = { name: '', goals: 0 };
    let bestDefense = { name: '', goals: 999 };
    
    teams.forEach(team => {
        if (team.stats.goalsFor > bestAttack.goals) {
            bestAttack = { name: team.name, goals: team.stats.goalsFor };
        }
        if (team.stats.goalsAgainst < bestDefense.goals) {
            bestDefense = { name: team.name, goals: team.stats.goalsAgainst };
        }
    });
    
    const stats = [
        { icon: 'fa-users', value: teams.length, label: 'الفرق' },
        { icon: 'fa-calendar-alt', value: matches.length, label: 'المباريات' },
        { icon: 'fa-futbol', value: totalGoals, label: 'الأهداف' },
        { icon: 'fa-square', value: yellowCards, label: 'بطاقات صفراء' },
        { icon: 'fa-square', value: redCards, label: 'بطاقات حمراء' },
        { icon: 'fa-chart-line', value: bestAttack.goals, label: `أفضل هجوم: ${bestAttack.name}` },
        { icon: 'fa-shield-alt', value: bestDefense.goals, label: `أفضل دفاع: ${bestDefense.name}` }
    ];
    
    statsContainer.innerHTML = stats.map(stat => `
        <div class="col-md-3 col-sm-6">
            <div class="kpi-card">
                <i class="fas ${stat.icon}"></i>
                <h3>${stat.value}</h3>
                <p>${stat.label}</p>
                <i class="fas ${stat.icon} bg-icon-float"></i>
            </div>
        </div>
    `).join('');
}

async function loadMatches() {
    const matches = DataManager.loadData('MATCHES');
    const teams = DataManager.loadData('TEAMS');
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    const stageFilter = document.getElementById('stageFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const teamSearch = document.getElementById('teamSearch')?.value || '';
    
    let filteredMatches = matches;
    
    if (stageFilter !== 'all') {
        filteredMatches = filteredMatches.filter(m => m.stage === stageFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredMatches = filteredMatches.filter(m => m.status === statusFilter);
    }
    
    if (teamSearch) {
        filteredMatches = filteredMatches.filter(m => 
            m.team1Name.includes(teamSearch) || 
            m.team2Name.includes(teamSearch)
        );
    }
    
    const matchesContainer = document.getElementById('matchesContainer');
    
    if (filteredMatches.length === 0) {
        matchesContainer.innerHTML = '<div class="text-center"><p>لا توجد مباريات</p></div>';
        return;
    }
    
    matchesContainer.innerHTML = filteredMatches.map(match => {
        const team1 = teams.find(t => t.id === match.team1Id);
        const team2 = teams.find(t => t.id === match.team2Id);
        const events = matchEvents.filter(e => e.matchId === match.id);
        const goals1 = events.filter(e => e.type === 'goal' && e.teamId === match.team1Id).length;
        const goals2 = events.filter(e => e.type === 'goal' && e.teamId === match.team2Id).length;
        
        let statusClass = '';
        let statusText = '';
        
        if (match.status === 'upcoming') {
            statusClass = 'status-upcoming';
            statusText = 'قادمة';
        } else if (match.status === 'finished') {
            statusClass = 'status-finished';
            statusText = 'انتهت';
        } else if (match.status === 'live') {
            statusClass = 'status-live';
            statusText = 'مباشر';
        }
        
        return `
            <div class="match-card" onclick="showMatchDetails('${match.id}')">
                <div class="match-info">
                    <div class="match-teams">
                        <div class="team">
                            ${team1?.logo ? `<img src="${team1.logo}" alt="${team1.name}">` : ''}
                            <div class="team-name-small">${team1?.name || match.team1Name}</div>
                        </div>
                        <div class="match-score">
                            ${match.status === 'finished' ? `${goals1} - ${goals2}` : 'vs'}
                        </div>
                        <div class="team">
                            ${team2?.logo ? `<img src="${team2.logo}" alt="${team2.name}">` : ''}
                            <div class="team-name-small">${team2?.name || match.team2Name}</div>
                        </div>
                    </div>
                    <div class="match-details">
                        <div><i class="fas fa-calendar"></i> ${match.date}</div>
                        <div><i class="fas fa-clock"></i> ${match.time}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${match.stadium}</div>
                        <span class="match-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add filter listeners
    if (document.getElementById('stageFilter')) {
        document.getElementById('stageFilter').addEventListener('change', loadMatches);
        document.getElementById('statusFilter').addEventListener('change', loadMatches);
        document.getElementById('teamSearch').addEventListener('input', loadMatches);
    }
}

async function showMatchDetails(matchId) {
    const matches = DataManager.loadData('MATCHES');
    const teams = DataManager.loadData('TEAMS');
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    const players = DataManager.loadData('PLAYERS');
    
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    const events = matchEvents.filter(e => e.matchId === matchId);
    
    const goals = events.filter(e => e.type === 'goal');
    const yellowCards = events.filter(e => e.type === 'yellow_card');
    const redCards = events.filter(e => e.type === 'red_card');
    const manOfMatch = events.find(e => e.type === 'man_of_match');
    
    let scorersHtml = '';
    const scorersByTeam = {};
    
    goals.forEach(goal => {
        if (!scorersByTeam[goal.teamId]) scorersByTeam[goal.teamId] = [];
        const player = players.find(p => p.id === goal.playerId);
        scorersByTeam[goal.teamId].push({ player: player?.name || 'لاعب', minute: goal.minute });
    });
    
    for (const teamId in scorersByTeam) {
        const team = teams.find(t => t.id === teamId);
        scorersHtml += `
            <div class="mb-2">
                <strong>${team?.name}:</strong>
                ${scorersByTeam[teamId].map(s => `${s.player} (${s.minute}')`).join(', ')}
            </div>
        `;
    }
    
    const modalBody = document.getElementById('matchModalBody');
    modalBody.innerHTML = `
        <div class="match-detail-card">
            <div class="match-detail-teams">
                <div class="match-detail-team">
                    ${team1?.logo ? `<img src="${team1.logo}" alt="${team1.name}">` : ''}
                    <h4>${team1?.name}</h4>
                </div>
                <div class="match-detail-score">
                    ${match.status === 'finished' ? 
                        `${events.filter(e => e.type === 'goal' && e.teamId === match.team1Id).length} - ${events.filter(e => e.type === 'goal' && e.teamId === match.team2Id).length}` : 
                        'vs'}
                </div>
                <div class="match-detail-team">
                    ${team2?.logo ? `<img src="${team2.logo}" alt="${team2.name}">` : ''}
                    <h4>${team2?.name}</h4>
                </div>
            </div>
            
            <div class="match-detail-info">
                <div class="row">
                    <div class="col-md-6">
                        <p><i class="fas fa-calendar"></i> <strong>التاريخ:</strong> ${match.date}</p>
                        <p><i class="fas fa-clock"></i> <strong>الوقت:</strong> ${match.time}</p>
                    </div>
                    <div class="col-md-6">
                        <p><i class="fas fa-map-marker-alt"></i> <strong>الملعب:</strong> ${match.stadium}</p>
                        <p><i class="fas fa-chart-line"></i> <strong>المرحلة:</strong> ${getStageName(match.stage)}</p>
                    </div>
                </div>
            </div>
            
            ${goals.length > 0 ? `
                <div class="match-detail-section">
                    <h5><i class="fas fa-futbol"></i> الهدافون</h5>
                    ${scorersHtml}
                </div>
            ` : ''}
            
            ${yellowCards.length > 0 ? `
                <div class="match-detail-section">
                    <h5><i class="fas fa-square" style="color: #ffc107;"></i> البطاقات الصفراء</h5>
                    ${yellowCards.map(card => {
                        const player = players.find(p => p.id === card.playerId);
                        const team = teams.find(t => t.id === card.teamId);
                        return `<div>${player?.name} (${team?.name}) - الدقيقة ${card.minute}</div>`;
                    }).join('')}
                </div>
            ` : ''}
            
            ${redCards.length > 0 ? `
                <div class="match-detail-section">
                    <h5><i class="fas fa-square" style="color: #dc3545;"></i> البطاقات الحمراء</h5>
                    ${redCards.map(card => {
                        const player = players.find(p => p.id === card.playerId);
                        const team = teams.find(t => t.id === card.teamId);
                        return `<div>${player?.name} (${team?.name}) - الدقيقة ${card.minute}</div>`;
                    }).join('')}
                </div>
            ` : ''}
            
            ${manOfMatch ? `
                <div class="match-detail-section">
                    <h5><i class="fas fa-star" style="color: gold;"></i> أفضل لاعب في المباراة</h5>
                    <div class="alert alert-info">
                        ${players.find(p => p.id === manOfMatch.playerId)?.name || 'لاعب'}
                    </div>
                </div>
            ` : ''}
            
            ${match.notes ? `
                <div class="match-detail-section">
                    <h5><i class="fas fa-sticky-note"></i> ملاحظات</h5>
                    <p>${match.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    // Store current match ID for printing
    window.currentMatchForPrint = match;
    
    const modal = new bootstrap.Modal(document.getElementById('matchModal'));
    modal.show();
}

function getStageName(stage) {
    const stages = {
        'groups': 'دور المجموعات',
        'semi': 'نصف النهائي',
        'final': 'النهائي'
    };
    return stages[stage] || stage;
}

function printMatchCard() {
    if (!window.currentMatchForPrint) return;
    
    const match = window.currentMatchForPrint;
    const teams = DataManager.loadData('TEAMS');
    const matchEvents = DataManager.loadData('MATCH_EVENTS');
    
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    const events = matchEvents.filter(e => e.matchId === match.id);
    const goals1 = events.filter(e => e.type === 'goal' && e.teamId === match.team1Id).length;
    const goals2 = events.filter(e => e.type === 'goal' && e.teamId === match.team2Id).length;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>بطاقة مباراة - ${team1?.name} vs ${team2?.name}</title>
            <style>
                body {
                    font-family: 'Tajawal', sans-serif;
                    padding: 20px;
                    background: white;
                }
                .match-card-print {
                    border: 2px solid #e31b23;
                    border-radius: 15px;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #e31b23;
                    margin: 0;
                }
                .teams {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 30px 0;
                }
                .team {
                    text-align: center;
                    flex: 1;
                }
                .team img {
                    width: 80px;
                    height: 80px;
                }
                .score {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #e31b23;
                }
                .info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 0.9rem;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="match-card-print">
                <div class="header">
                    <h1>${CONFIG.tournamentName}</h1>
                    <p>${getStageName(match.stage)}</p>
                </div>
                <div class="teams">
                    <div class="team">
                        ${team1?.logo ? `<img src="${team1.logo}" alt="${team1.name}">` : ''}
                        <h3>${team1?.name}</h3>
                    </div>
                    <div class="score">${match.status === 'finished' ? `${goals1} - ${goals2}` : 'vs'}</div>
                    <div class="team">
                        ${team2?.logo ? `<img src="${team2.logo}" alt="${team2.name}">` : ''}
                        <h3>${team2?.name}</h3>
                    </div>
                </div>
                <div class="info">
                    <p><strong>التاريخ:</strong> ${match.date}</p>
                    <p><strong>الوقت:</strong> ${match.time}</p>
                    <p><strong>الملعب:</strong> ${match.stadium}</p>
                </div>
                <div class="footer">
                    <p>تم إنشاء هذه البطاقة بواسطة نظام إدارة بطولة النخبة</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

async function loadTopScorers() {
    const players = DataManager.loadData('PLAYERS');
    const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 10);
    const teams = DataManager.loadData('TEAMS');
    
    const container = document.getElementById('topScorersContainer');
    container.innerHTML = topScorers.map(player => {
        const team = teams.find(t => t.id === player.teamId);
        return `
            <div class="col-md-4 col-lg-3">
                <div class="player-card">
                    <div class="player-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${team?.name || ''}</div>
                    <div class="player-goals">${player.goals} أهداف</div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadBestPlayers() {
    const players = DataManager.loadData('PLAYERS');
    const bestPlayers = [...players].sort((a, b) => b.manOfMatch - a.manOfMatch).slice(0, 10);
    const teams = DataManager.loadData('TEAMS');
    
    const container = document.getElementById('bestPlayersContainer');
    container.innerHTML = bestPlayers.map(player => {
        const team = teams.find(t => t.id === player.teamId);
        return `
            <div class="col-md-4 col-lg-3">
                <div class="player-card">
                    <div class="player-avatar">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${team?.name || ''}</div>
                    <div class="player-goals">${player.manOfMatch} مرة أفضل لاعب</div>
                </div>
            </div>
        `;
    }).join('');
}

function checkAndShowChampion() {
    const matches = DataManager.loadData('MATCHES');
    const finalMatch = matches.find(m => m.stage === 'final' && m.status === 'finished');
    
    if (finalMatch) {
        const matchEvents = DataManager.loadData('MATCH_EVENTS');
        const events = matchEvents.filter(e => e.matchId === finalMatch.id);
        const goals1 = events.filter(e => e.type === 'goal' && e.teamId === finalMatch.team1Id).length;
        const goals2 = events.filter(e => e.type === 'goal' && e.teamId === finalMatch.team2Id).length;
        
        let championId;
        if (goals1 > goals2) {
            championId = finalMatch.team1Id;
        } else if (goals2 > goals1) {
            championId = finalMatch.team2Id;
        } else if (finalMatch.penaltyWinner) {
            championId = finalMatch.penaltyWinner;
        }
        
        if (championId) {
            const teams = DataManager.loadData('TEAMS');
            const champion = teams.find(t => t.id === championId);
            
            if (champion && !localStorage.getItem('champion_shown')) {
                setTimeout(() => {
                    document.getElementById('championName').textContent = champion.name;
                    const modal = new bootstrap.Modal(document.getElementById('championModal'));
                    modal.show();
                    localStorage.setItem('champion_shown', 'true');
                }, 2000);
            }
        }
    }
}

// Event Listeners for print button
document.getElementById('printMatchCardBtn')?.addEventListener('click', printMatchCard);
