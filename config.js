// Configuration File
const CONFIG = {
    // Tournament Settings
    tournamentName: "بطولة النخبة",
    groups: ["A", "B"],
    
    // Storage Keys
    STORAGE_KEYS: {
        TEAMS: "tournament_teams",
        PLAYERS: "tournament_players",
        MATCHES: "tournament_matches",
        MATCH_EVENTS: "tournament_match_events",
        STATISTICS: "tournament_statistics"
    },
    
    // Initial Data
    initialData: {
        teams: [
            { id: "team1", name: "الهلال", group: "A", logo: "https://via.placeholder.com/50/007bff/ffffff?text=HIL", color: "#007bff", stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 } },
            { id: "team2", name: "النصر", group: "A", logo: "https://via.placeholder.com/50/dc3545/ffffff?text=NSR", color: "#dc3545", stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 } },
            { id: "team3", name: "الاتحاد", group: "B", logo: "https://via.placeholder.com/50/28a745/ffffff?text=ITD", color: "#28a745", stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 } },
            { id: "team4", name: "الأهلي", group: "B", logo: "https://via.placeholder.com/50/ffc107/000000?text=AHL", color: "#ffc107", stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 } }
        ],
        players: [
            { id: "p1", name: "محمد صلاح", teamId: "team1", position: "مهاجم", number: 10, goals: 0, manOfMatch: 0 },
            { id: "p2", name: "عبدالله السديري", teamId: "team1", position: "وسط", number: 7, goals: 0, manOfMatch: 0 },
            { id: "p3", name: "فهد المولد", teamId: "team2", position: "مهاجم", number: 11, goals: 0, manOfMatch: 0 },
            { id: "p4", name: "سلمان الفرج", teamId: "team2", position: "وسط", number: 8, goals: 0, manOfMatch: 0 },
            { id: "p5", name: "عبدالرزاق حمدالله", teamId: "team3", position: "مهاجم", number: 9, goals: 0, manOfMatch: 0 },
            { id: "p6", name: "سالم الدوسري", teamId: "team3", position: "وسط", number: 18, goals: 0, manOfMatch: 0 },
            { id: "p7", name: "عمر السومة", teamId: "team4", position: "مهاجم", number: 15, goals: 0, manOfMatch: 0 },
            { id: "p8", name: "حسين المقهوي", teamId: "team4", position: "وسط", number: 20, goals: 0, manOfMatch: 0 }
        ],
        matches: [],
        matchEvents: []
    }
};

// Data Management Functions
class DataManager {
    static loadData(key) {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS[key]);
        if (data) {
            return JSON.parse(data);
        }
        return CONFIG.initialData[key.toLowerCase()] || [];
    }
    
    static saveData(key, data) {
        localStorage.setItem(CONFIG.STORAGE_KEYS[key], JSON.stringify(data));
    }
    
    static initializeData() {
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.TEAMS)) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TEAMS, JSON.stringify(CONFIG.initialData.teams));
        }
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.PLAYERS)) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.PLAYERS, JSON.stringify(CONFIG.initialData.players));
        }
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.MATCHES)) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.MATCHES, JSON.stringify(CONFIG.initialData.matches));
        }
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.MATCH_EVENTS)) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.MATCH_EVENTS, JSON.stringify(CONFIG.initialData.matchEvents));
        }
    }
    
    static updateTeamStats(teamId, matchResult, isPenaltyWin = false) {
        const teams = DataManager.loadData('TEAMS');
        const teamIndex = teams.findIndex(t => t.id === teamId);
        
        if (teamIndex !== -1) {
            const team = teams[teamIndex];
            team.stats.played++;
            team.stats.goalsFor += matchResult.goalsFor;
            team.stats.goalsAgainst += matchResult.goalsAgainst;
            
            if (matchResult.won) {
                team.stats.won++;
                team.stats.points += 3;
            } else if (matchResult.drawn) {
                team.stats.drawn++;
                team.stats.points += 1;
            } else {
                team.stats.lost++;
            }
            
            teams[teamIndex] = team;
            DataManager.saveData('TEAMS', teams);
        }
    }
    
    static calculateGroupStandings(group) {
        const teams = DataManager.loadData('TEAMS');
        const groupTeams = teams.filter(t => t.group === group);
        
        groupTeams.sort((a, b) => {
            if (a.stats.points !== b.stats.points) {
                return b.stats.points - a.stats.points;
            }
            const aGD = a.stats.goalsFor - a.stats.goalsAgainst;
            const bGD = b.stats.goalsFor - b.stats.goalsAgainst;
            if (aGD !== bGD) {
                return bGD - aGD;
            }
            return b.stats.goalsFor - a.stats.goalsFor;
        });
        
        return groupTeams;
    }
    
    static getQualifiedTeams() {
        const groupA = DataManager.calculateGroupStandings('A');
        const groupB = DataManager.calculateGroupStandings('B');
        
        return {
            firstA: groupA[0],
            secondA: groupA[1],
            firstB: groupB[0],
            secondB: groupB[1]
        };
    }
}

// Initialize Data
DataManager.initializeData();

// Utility Functions
function showLoading() {
    document.getElementById('loadingSpinner').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('show');
}

function showToast(message, type = 'success') {
    Swal.fire({
        title: type === 'success' ? 'نجاح!' : 'خطأ!',
        text: message,
        icon: type,
        timer: 3000,
        showConfirmButton: false
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('ar-SA');
}

function formatTime(time) {
    return time;
}
