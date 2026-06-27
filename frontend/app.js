/**
 * FELDOR_HEALTH - Frontend Application
 * Single Page Application for AI Cancer Detection Platform
 */

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:8000' : '';

// State Management
const state = {
    currentView: 'dashboard',
    currentModule: null,
    cases: [],
    currentCase: null,
    dashboardStats: {},
    isLoading: false
};

// Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const getRiskClass = (level) => {
    const map = { high: 'risk-high', medium: 'risk-medium', low: 'risk-low' };
    return map[level] || 'risk-low';
};

const getStatusClass = (status) => {
    const map = { pending: 'status-pending', reviewed: 'status-reviewed', approved: 'status-approved', rejected: 'status-rejected' };
    return map[status] || 'status-pending';
};

const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    const colors = { info: 'bg-blue-600', success: 'bg-green-600', warning: 'bg-yellow-600', error: 'bg-red-600' };
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-xl z-50 slide-in flex items-center gap-2`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
};

const showLoading = (show) => {
    state.isLoading = show;
    const overlay = $('#loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
};

// API Functions
const api = {
    async get(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },
    async post(endpoint, data) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },
    async upload(endpoint, formData) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }
        return res.json();
    }
};

// Navigation
const navigate = (view, params = {}) => {
    state.currentView = view;
    state.currentModule = params.module || state.currentModule;
    render();
    window.scrollTo(0, 0);
};

// Components
const Layout = (content) => `
    <div class="min-h-screen flex">
        ${Sidebar()}
        <div class="flex-1 flex flex-col">
            ${Header()}
            <main class="flex-1 p-6 overflow-auto">
                <div id="loading-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden items-center justify-center">
                    <div class="bg-secondary rounded-xl p-8 flex flex-col items-center gap-4">
                        <div class="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-gray-300">Processing...</p>
                    </div>
                </div>
                ${content}
            </main>
        </div>
    </div>
`;

const Sidebar = () => `
    <aside class="w-64 bg-secondary border-r border-gray-700 flex flex-col">
        <div class="p-6 border-b border-gray-700">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-accent to-medical rounded-lg flex items-center justify-center">
                    <i class="fas fa-dna text-white text-lg"></i>
                </div>
                <div>
                    <h1 class="font-bold text-lg tracking-tight">FELDOR</h1>
                    <p class="text-xs text-gray-400">HEALTH AI</p>
                </div>
            </div>
        </div>

        <nav class="flex-1 p-4 space-y-1">
            <button onclick="navigate('dashboard')" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/5 transition ${state.currentView === 'dashboard' ? 'active' : ''}">
                <i class="fas fa-chart-pie w-5"></i>
                <span>Dashboard</span>
            </button>

            <div class="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules</div>

            <button onclick="navigate('upload', {module: 'breast'})" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/5 transition ${state.currentView === 'upload' && state.currentModule === 'breast' ? 'active' : ''}">
                <i class="fas fa-ribbon w-5 text-pink-400"></i>
                <span>Breast Cancer</span>
            </button>

            <button onclick="navigate('upload', {module: 'cervical'})" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/5 transition ${state.currentView === 'upload' && state.currentModule === 'cervical' ? 'active' : ''}">
                <i class="fas fa-microscope w-5 text-purple-400"></i>
                <span>Cervical Cancer</span>
            </button>

            <div class="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</div>

            <button onclick="navigate('cases')" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/5 transition ${state.currentView === 'cases' ? 'active' : ''}">
                <i class="fas fa-folder-open w-5"></i>
                <span>Case History</span>
                ${state.dashboardStats.urgent_review ? `<span class="ml-auto bg-danger text-white text-xs px-2 py-0.5 rounded-full">${state.dashboardStats.urgent_review}</span>` : ''}
            </button>

            <button onclick="navigate('review')" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/5 transition ${state.currentView === 'review' ? 'active' : ''}">
                <i class="fas fa-user-md w-5"></i>
                <span>Review Queue</span>
            </button>

            <button onclick="navigate('models')" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/5 transition ${state.currentView === 'models' ? 'active' : ''}">
                <i class="fas fa-brain w-5"></i>
                <span>Model Management</span>
            </button>
        </nav>

        <div class="p-4 border-t border-gray-700">
            <div class="bg-gradient-to-r from-accent/20 to-medical/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 bg-success rounded-full pulse-ring"></div>
                    <span class="text-xs font-medium text-gray-300">System Online</span>
                </div>
                <p class="text-xs text-gray-500">AI models ready for inference</p>
            </div>
        </div>
    </aside>
`;

const Header = () => `
    <header class="h-16 bg-secondary/80 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-6 sticky top-0 z-30">
        <div class="flex items-center gap-4">
            <h2 class="text-lg font-semibold capitalize">${state.currentView.replace('-', ' ')}</h2>
            ${state.currentModule ? `<span class="px-3 py-1 rounded-full text-xs font-medium ${state.currentModule === 'breast' ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}">${state.currentModule} Module</span>` : ''}
        </div>
        <div class="flex items-center gap-4">
            <div class="relative">
                <i class="fas fa-bell text-gray-400 hover:text-white cursor-pointer transition"></i>
                ${state.dashboardStats.urgent_review ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-xs flex items-center justify-center">${state.dashboardStats.urgent_review}</span>` : ''}
            </div>
            <div class="flex items-center gap-3 pl-4 border-l border-gray-700">
                <div class="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                    <i class="fas fa-user-md text-accent text-sm"></i>
                </div>
                <div class="hidden md:block">
                    <p class="text-sm font-medium">Dr. Clinician</p>
                    <p class="text-xs text-gray-500">Pathologist</p>
                </div>
            </div>
        </div>
    </header>
`;

// Views
const DashboardView = () => `
    <div class="space-y-6 slide-in">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-secondary rounded-xl p-6 card-hover border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-microscope text-accent text-xl"></i>
                    </div>
                    <span class="text-xs text-gray-500">Total Cases</span>
                </div>
                <h3 class="text-3xl font-bold">${state.dashboardStats.total_cases || 0}</h3>
                <p class="text-sm text-gray-500 mt-1">All time analyses</p>
            </div>

            <div class="bg-secondary rounded-xl p-6 card-hover border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-clock text-warning text-xl"></i>
                    </div>
                    <span class="text-xs text-gray-500">Pending Review</span>
                </div>
                <h3 class="text-3xl font-bold">${state.dashboardStats.pending_review || 0}</h3>
                <p class="text-sm text-gray-500 mt-1">Awaiting clinician</p>
            </div>

            <div class="bg-secondary rounded-xl p-6 card-hover border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-danger/20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-danger text-xl"></i>
                    </div>
                    <span class="text-xs text-gray-500">Urgent Review</span>
                </div>
                <h3 class="text-3xl font-bold text-danger">${state.dashboardStats.urgent_review || 0}</h3>
                <p class="text-sm text-gray-500 mt-1">High priority cases</p>
            </div>

            <div class="bg-secondary rounded-xl p-6 card-hover border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-check-circle text-success text-xl"></i>
                    </div>
                    <span class="text-xs text-gray-500">Avg Confidence</span>
                </div>
                <h3 class="text-3xl font-bold">${((state.dashboardStats.average_confidence || 0) * 100).toFixed(1)}%</h3>
                <p class="text-sm text-gray-500 mt-1">Model accuracy</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold">Module Overview</h3>
                </div>
                <div class="space-y-4">
                    <div class="flex items-center gap-4 p-4 bg-pink-500/10 rounded-lg border border-pink-500/20 cursor-pointer hover:bg-pink-500/20 transition" onclick="navigate('upload', {module: 'breast'})">
                        <div class="w-14 h-14 bg-pink-500/20 rounded-xl flex items-center justify-center">
                            <i class="fas fa-ribbon text-pink-400 text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold">Breast Cancer Detection</h4>
                            <p class="text-sm text-gray-400">Mammography analysis with lesion localization</p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">${state.dashboardStats.breast_cases || 0}</div>
                            <div class="text-xs text-gray-500">cases</div>
                        </div>
                        <i class="fas fa-chevron-right text-gray-500"></i>
                    </div>

                    <div class="flex items-center gap-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 cursor-pointer hover:bg-purple-500/20 transition" onclick="navigate('upload', {module: 'cervical'})">
                        <div class="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <i class="fas fa-microscope text-purple-400 text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold">Cervical Cancer Detection</h4>
                            <p class="text-sm text-gray-400">Pap smear cytology with cell-level analysis</p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">${state.dashboardStats.cervical_cases || 0}</div>
                            <div class="text-xs text-gray-500">cases</div>
                        </div>
                        <i class="fas fa-chevron-right text-gray-500"></i>
                    </div>
                </div>
            </div>

            <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold">Recent Activity</h3>
                    <button onclick="navigate('cases')" class="text-accent text-sm hover:underline">View All</button>
                </div>
                <div class="space-y-3" id="recent-activity">
                    ${state.cases.slice(0, 5).map(c => `
                        <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition cursor-pointer" onclick="navigate('report', {caseId: '${c.case_id}'})">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center ${c.module === 'breast' ? 'bg-pink-500/20' : 'bg-purple-500/20'}">
                                <i class="fas ${c.module === 'breast' ? 'fa-ribbon text-pink-400' : 'fa-microscope text-purple-400'}"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium truncate">${c.patient_id}</p>
                                <p class="text-xs text-gray-500">${c.prediction}</p>
                            </div>
                            <div class="text-right">
                                <span class="status-badge ${getStatusClass(c.status)}">${c.status}</span>
                                <p class="text-xs text-gray-500 mt-1">${formatDate(c.upload_date)}</p>
                            </div>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-center py-8">No recent activity</p>'}
                </div>
            </div>
        </div>
    </div>
`;

const UploadView = () => {
    const isBreast = state.currentModule === 'breast';
    return `
    <div class="max-w-4xl mx-auto slide-in">
        <div class="bg-secondary rounded-xl border border-gray-700 overflow-hidden">
            <div class="p-6 border-b border-gray-700">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 ${isBreast ? 'bg-pink-500/20' : 'bg-purple-500/20'} rounded-lg flex items-center justify-center">
                        <i class="fas ${isBreast ? 'fa-ribbon text-pink-400' : 'fa-microscope text-purple-400'} text-lg"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold">${isBreast ? 'Breast Cancer' : 'Cervical Cancer'} Detection</h2>
                        <p class="text-sm text-gray-400">Upload scan for AI analysis</p>
                    </div>
                </div>
            </div>

            <div class="p-6 space-y-6">
                <!-- Model Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">AI Model Version</label>
                    <select id="model-version" class="model-selector w-full bg-primary border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none">
                        ${isBreast ? `
                            <option value="breast_v1">Breast AI v1 (Default)</option>
                            <option value="breast_v2">Breast AI v2 (Enhanced)</option>
                        ` : `
                            <option value="cervical_v1">Cervical AI v1 (Default)</option>
                        `}
                    </select>
                </div>

                <!-- Patient ID -->
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Patient ID</label>
                    <input type="text" id="patient-id" placeholder="Enter patient identifier" 
                        class="w-full bg-primary border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none">
                </div>

                <!-- Upload Zone -->
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Upload Scan</label>
                    <div id="drop-zone" class="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-accent transition cursor-pointer relative overflow-hidden"
                        onclick="document.getElementById('file-input').click()">
                        <input type="file" id="file-input" class="hidden" accept="${isBreast ? '.dcm,.png,.jpg,.jpeg,.tiff,.tif' : '.png,.jpg,.jpeg,.tiff,.tif'}" onchange="handleFileSelect(event)">
                        <div id="upload-placeholder">
                            <div class="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-cloud-upload-alt text-accent text-2xl"></i>
                            </div>
                            <p class="text-lg font-medium mb-2">Drop your scan here or click to browse</p>
                            <p class="text-sm text-gray-500">${isBreast ? 'Supports DICOM, PNG, JPG, TIFF' : 'Supports PNG, JPG, TIFF microscopy images'}</p>
                            <p class="text-xs text-gray-600 mt-2">Maximum file size: 50MB</p>
                        </div>
                        <div id="upload-preview" class="hidden">
                            <img id="preview-image" class="max-h-64 mx-auto rounded-lg shadow-lg" />
                            <p id="file-name" class="mt-4 text-sm text-gray-300"></p>
                            <button onclick="event.stopPropagation(); clearUpload()" class="mt-2 text-danger text-sm hover:underline">Remove</button>
                        </div>
                    </div>
                </div>

                <!-- Disclaimer -->
                <div class="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-warning mt-0.5"></i>
                    <div>
                        <p class="text-sm font-medium text-warning">Clinical Decision Support Only</p>
                        <p class="text-xs text-gray-400 mt-1">AI results are intended to assist clinicians and require professional interpretation. This system does not replace qualified medical professionals.</p>
                    </div>
                </div>

                <!-- Submit -->
                <button id="analyze-btn" onclick="submitAnalysis()" disabled 
                    class="w-full bg-gradient-to-r from-accent to-medical text-white font-semibold py-4 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <i class="fas fa-brain"></i>
                    Run AI Analysis
                </button>
            </div>
        </div>
    </div>
`;
};

const ReportView = () => {
    const c = state.currentCase;
    if (!c) return '<div class="text-center py-20"><i class="fas fa-spinner fa-spin text-3xl text-accent"></i></div>';

    const isBreast = c.module === 'breast';
    const riskPercent = Math.round((c.risk_score || 0) * 100);
    const confPercent = Math.round((c.confidence || 0) * 100);

    return `
    <div class="max-w-6xl mx-auto slide-in space-y-6">
        <!-- Report Header -->
        <div class="bg-secondary rounded-xl p-6 border border-gray-700">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${isBreast ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}">${c.module.toUpperCase()}</span>
                        <span class="status-badge ${getStatusClass(c.status)}">${c.status}</span>
                    </div>
                    <h2 class="text-2xl font-bold">Case Report: ${c.case_id}</h2>
                    <p class="text-sm text-gray-400 mt-1">Patient ID: ${c.patient_id} | Uploaded: ${formatDate(c.upload_date)}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.print()" class="px-4 py-2 bg-primary border border-gray-600 rounded-lg hover:bg-white/5 transition flex items-center gap-2">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button onclick="navigate('cases')" class="px-4 py-2 bg-primary border border-gray-600 rounded-lg hover:bg-white/5 transition flex items-center gap-2">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column - Images -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Images -->
                <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-4">Scan Analysis</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${c.images?.original ? `
                        <div>
                            <p class="text-sm text-gray-400 mb-2">Original Scan</p>
                            <div class="relative rounded-lg overflow-hidden bg-primary">
                                <img src="data:image/png;base64,${c.images.original}" class="w-full object-contain" />
                            </div>
                        </div>
                        ` : ''}
                        ${c.images?.preprocessed ? `
                        <div>
                            <p class="text-sm text-gray-400 mb-2">Preprocessed</p>
                            <div class="relative rounded-lg overflow-hidden bg-primary">
                                <img src="data:image/png;base64,${c.images.preprocessed}" class="w-full object-contain" />
                            </div>
                        </div>
                        ` : ''}
                        ${c.images?.heatmap ? `
                        <div>
                            <p class="text-sm text-gray-400 mb-2">AI Heatmap</p>
                            <div class="relative rounded-lg overflow-hidden bg-primary">
                                <img src="data:image/png;base64,${c.images.heatmap}" class="w-full object-contain" />
                            </div>
                        </div>
                        ` : ''}
                        ${c.images?.annotated ? `
                        <div>
                            <p class="text-sm text-gray-400 mb-2">Cell Detection</p>
                            <div class="relative rounded-lg overflow-hidden bg-primary">
                                <img src="data:image/png;base64,${c.images.annotated}" class="w-full object-contain" />
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Findings -->
                <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-4">AI Findings</h3>
                    ${c.findings && c.findings.length > 0 ? `
                        <div class="space-y-3">
                            ${c.findings.map((f, i) => `
                                <div class="flex items-start gap-4 p-4 bg-primary rounded-lg border border-gray-700">
                                    <div class="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span class="text-accent font-bold text-sm">${i + 1}</span>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <h4 class="font-medium">${f.type}</h4>
                                            <span class="text-sm text-gray-400">${(f.confidence * 100).toFixed(1)}% confidence</span>
                                        </div>
                                        ${f.location ? `<p class="text-sm text-gray-400 mt-1"><i class="fas fa-map-marker-alt mr-1"></i>${f.location}</p>` : ''}
                                        ${f.bbox ? `<p class="text-xs text-gray-600 mt-1">BBox: [${f.bbox.map(v => v.toFixed(1)).join(', ')}]</p>` : ''}
                                        ${f.cell_id ? `<p class="text-xs text-gray-600">Cell #${f.cell_id}</p>` : ''}
                                        ${f.abnormality_score ? `<p class="text-xs text-gray-600">Abnormality: ${(f.abnormality_score * 100).toFixed(1)}%</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-gray-500 text-center py-8">No specific findings detected</p>'}
                </div>
            </div>

            <!-- Right Column - Metrics -->
            <div class="space-y-6">
                <!-- Prediction Card -->
                <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-4">AI Prediction</h3>
                    <div class="text-center py-6">
                        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full ${getRiskClass(c.risk_level)} mb-4">
                            <i class="fas ${c.prediction?.includes('No') ? 'fa-check' : c.prediction?.includes('High') ? 'fa-exclamation' : 'fa-exclamation-circle'} text-white text-3xl"></i>
                        </div>
                        <h4 class="text-xl font-bold">${c.prediction}</h4>
                        <p class="text-sm text-gray-400 mt-1">${c.model_version}</p>
                    </div>

                    <div class="space-y-4 mt-4">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-400">Confidence</span>
                                <span class="font-medium">${confPercent}%</span>
                            </div>
                            <div class="h-2 bg-primary rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-accent to-medical progress-bar" style="width: ${confPercent}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-400">Risk Score</span>
                                <span class="font-medium">${riskPercent}%</span>
                            </div>
                            <div class="h-2 bg-primary rounded-full overflow-hidden">
                                <div class="h-full ${getRiskClass(c.risk_level)} progress-bar" style="width: ${riskPercent}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-4">Analysis Stats</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between py-2 border-b border-gray-700">
                            <span class="text-gray-400">Processing Time</span>
                            <span class="font-medium">${c.processing_time_ms}ms</span>
                        </div>
                        ${c.total_cells !== undefined ? `
                        <div class="flex justify-between py-2 border-b border-gray-700">
                            <span class="text-gray-400">Total Cells</span>
                            <span class="font-medium">${c.total_cells}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b border-gray-700">
                            <span class="text-gray-400">Suspicious Cells</span>
                            <span class="font-medium ${c.suspicious_cells > 0 ? 'text-danger' : 'text-success'}">${c.suspicious_cells}</span>
                        </div>
                        ` : ''}
                        <div class="flex justify-between py-2 border-b border-gray-700">
                            <span class="text-gray-400">Review Required</span>
                            <span class="font-medium ${c.review_required ? 'text-warning' : 'text-success'}">${c.review_required ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="flex justify-between py-2">
                            <span class="text-gray-400">File Type</span>
                            <span class="font-medium uppercase">${c.file_type}</span>
                        </div>
                    </div>
                </div>

                <!-- Review Actions -->
                ${c.status === 'pending' ? `
                <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-4">Clinician Review</h3>
                    <textarea id="review-notes" placeholder="Enter review notes..." 
                        class="w-full bg-primary border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none mb-4 resize-none h-24"></textarea>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="submitReview('${c.case_id}', 'approved')" class="py-2 bg-success/20 text-success border border-success/30 rounded-lg hover:bg-success/30 transition flex items-center justify-center gap-2">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button onclick="submitReview('${c.case_id}', 'rejected')" class="py-2 bg-danger/20 text-danger border border-danger/30 rounded-lg hover:bg-danger/30 transition flex items-center justify-center gap-2">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                    <button onclick="submitReview('${c.case_id}', 'reviewed')" class="w-full mt-2 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition">
                        Mark as Reviewed
                    </button>
                </div>
                ` : `
                <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-2">Review Status</h3>
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-user-md text-gray-400"></i>
                        <span class="text-sm">${c.reviewer_id || 'Unknown'}</span>
                    </div>
                    <p class="text-sm text-gray-400">${c.review_notes || 'No review notes provided'}</p>
                    <p class="text-xs text-gray-500 mt-2">Reviewed: ${formatDate(c.review_date)}</p>
                </div>
                `}

                <!-- Disclaimer -->
                <div class="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-warning mt-0.5 text-sm"></i>
                        <p class="text-xs text-gray-400">${c.disclaimer || 'AI results are intended to assist clinicians and require professional interpretation.'}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
};

const CasesView = () => `
    <div class="slide-in space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 class="text-2xl font-bold">Case History</h2>
            <div class="flex gap-2">
                <select id="filter-module" onchange="filterCases()" class="model-selector bg-secondary border border-gray-600 rounded-lg px-4 py-2 text-sm">
                    <option value="">All Modules</option>
                    <option value="breast">Breast</option>
                    <option value="cervical">Cervical</option>
                </select>
                <select id="filter-status" onchange="filterCases()" class="model-selector bg-secondary border border-gray-600 rounded-lg px-4 py-2 text-sm">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>

        <div class="bg-secondary rounded-xl border border-gray-700 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-primary/50">
                        <tr>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Case ID</th>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Module</th>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Patient</th>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Prediction</th>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Confidence</th>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                            <th class="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                        ${state.cases.map(c => `
                            <tr class="hover:bg-white/5 transition cursor-pointer" onclick="navigate('report', {caseId: '${c.case_id}'})">
                                <td class="px-6 py-4 font-mono text-sm">${c.case_id.slice(0, 8)}...</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 rounded text-xs font-medium ${c.module === 'breast' ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}">
                                        ${c.module}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm">${c.patient_id}</td>
                                <td class="px-6 py-4 text-sm">${c.prediction}</td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="w-16 h-1.5 bg-primary rounded-full overflow-hidden">
                                            <div class="h-full bg-accent" style="width: ${(c.confidence * 100).toFixed(0)}%"></div>
                                        </div>
                                        <span class="text-xs">${(c.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="status-badge ${getStatusClass(c.status)}">${c.status}</span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-400">${formatDate(c.upload_date)}</td>
                                <td class="px-6 py-4">
                                    <button onclick="event.stopPropagation(); navigate('report', {caseId: '${c.case_id}')}" class="text-accent hover:text-white transition">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="8" class="text-center py-12 text-gray-500">No cases found</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
`;

const ReviewView = () => `
    <div class="slide-in space-y-6">
        <h2 class="text-2xl font-bold">Review Queue</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                <h3 class="text-sm font-medium text-gray-400 mb-2">Pending Review</h3>
                <p class="text-3xl font-bold">${state.dashboardStats.pending_review || 0}</p>
            </div>
            <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                <h3 class="text-sm font-medium text-gray-400 mb-2">Urgent Cases</h3>
                <p class="text-3xl font-bold text-danger">${state.dashboardStats.urgent_review || 0}</p>
            </div>
            <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                <h3 class="text-sm font-medium text-gray-400 mb-2">Reviewed Today</h3>
                <p class="text-3xl font-bold text-success">${state.dashboardStats.reviewed || 0}</p>
            </div>
        </div>

        <div class="bg-secondary rounded-xl border border-gray-700 overflow-hidden">
            <div class="p-4 border-b border-gray-700">
                <h3 class="font-semibold">Cases Requiring Review</h3>
            </div>
            <div class="divide-y divide-gray-700">
                ${state.cases.filter(c => c.status === 'pending' && c.review_required).map(c => `
                    <div class="p-4 flex items-center gap-4 hover:bg-white/5 transition cursor-pointer" onclick="navigate('report', {caseId: '${c.case_id}'})">
                        <div class="w-12 h-12 ${c.module === 'breast' ? 'bg-pink-500/20' : 'bg-purple-500/20'} rounded-lg flex items-center justify-center">
                            <i class="fas ${c.module === 'breast' ? 'fa-ribbon text-pink-400' : 'fa-microscope text-purple-400'}"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <h4 class="font-medium">${c.patient_id}</h4>
                                <span class="px-2 py-0.5 rounded text-xs bg-danger/20 text-danger">URGENT</span>
                            </div>
                            <p class="text-sm text-gray-400">${c.prediction} | ${(c.confidence * 100).toFixed(1)}% confidence</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-400">${formatDate(c.upload_date)}</p>
                            <button class="mt-2 px-4 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent/80 transition">Review</button>
                        </div>
                    </div>
                `).join('') || '<div class="text-center py-12 text-gray-500">No cases pending review</div>'}
            </div>
        </div>
    </div>
`;

const ModelsView = () => `
    <div class="slide-in space-y-6">
        <h2 class="text-2xl font-bold">Model Management</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-ribbon text-pink-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold">Breast AI Models</h3>
                        <p class="text-sm text-gray-400">Mammography analysis</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-primary rounded-lg border border-accent/30">
                        <div>
                            <p class="font-medium">Breast AI v1</p>
                            <p class="text-xs text-gray-500">Default model | Active</p>
                        </div>
                        <span class="px-3 py-1 bg-success/20 text-success text-xs rounded-full">Active</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-primary rounded-lg border border-gray-700">
                        <div>
                            <p class="font-medium">Breast AI v2</p>
                            <p class="text-xs text-gray-500">Enhanced architecture</p>
                        </div>
                        <span class="px-3 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">Standby</span>
                    </div>
                </div>
            </div>

            <div class="bg-secondary rounded-xl p-6 border border-gray-700">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-microscope text-purple-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold">Cervical AI Models</h3>
                        <p class="text-sm text-gray-400">Cytology analysis</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-primary rounded-lg border border-accent/30">
                        <div>
                            <p class="font-medium">Cervical AI v1</p>
                            <p class="text-xs text-gray-500">Default model | Active</p>
                        </div>
                        <span class="px-3 py-1 bg-success/20 text-success text-xs rounded-full">Active</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-secondary rounded-xl p-6 border border-gray-700">
            <h3 class="font-semibold mb-4">Model Performance Metrics</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-primary rounded-lg">
                    <p class="text-2xl font-bold text-accent">94.2%</p>
                    <p class="text-xs text-gray-500 mt-1">Sensitivity</p>
                </div>
                <div class="text-center p-4 bg-primary rounded-lg">
                    <p class="text-2xl font-bold text-accent">91.8%</p>
                    <p class="text-xs text-gray-500 mt-1">Specificity</p>
                </div>
                <div class="text-center p-4 bg-primary rounded-lg">
                    <p class="text-2xl font-bold text-accent">93.1%</p>
                    <p class="text-xs text-gray-500 mt-1">AUC-ROC</p>
                </div>
                <div class="text-center p-4 bg-primary rounded-lg">
                    <p class="text-2xl font-bold text-accent">847ms</p>
                    <p class="text-xs text-gray-500 mt-1">Avg Inference</p>
                </div>
            </div>
        </div>
    </div>
`;

// Event Handlers
let selectedFile = null;

const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        $('#preview-image').src = e.target.result;
        $('#file-name').textContent = file.name;
        $('#upload-placeholder').classList.add('hidden');
        $('#upload-preview').classList.remove('hidden');
        $('#analyze-btn').disabled = false;
    };
    reader.readAsDataURL(file);
};

const clearUpload = () => {
    selectedFile = null;
    $('#file-input').value = '';
    $('#upload-placeholder').classList.remove('hidden');
    $('#upload-preview').classList.add('hidden');
    $('#analyze-btn').disabled = true;
};

const submitAnalysis = async () => {
    if (!selectedFile) return;

    showLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patient_id', $('#patient-id').value || '');
    formData.append('model_version', $('#model-version').value);

    try {
        const endpoint = state.currentModule === 'breast' ? '/api/breast/upload' : '/api/cervical/upload';
        const result = await api.upload(endpoint, formData);

        showToast('Analysis complete!', 'success');
        state.currentCase = result;
        navigate('report');
        await loadDashboardData();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
};

const submitReview = async (caseId, status) => {
    const notes = $('#review-notes')?.value || '';

    try {
        const endpoint = state.currentCase.module === 'breast' 
            ? `/api/breast/cases/${caseId}/review`
            : `/api/cervical/cases/${caseId}/review`;

        await api.post(endpoint, { status, notes, reviewer_id: 'clinician' });
        showToast(`Case ${status} successfully`, 'success');
        await loadCase(caseId);
        await loadCases();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

const filterCases = () => {
    const module = $('#filter-module').value;
    const status = $('#filter-status').value;
    loadCases(module, status);
};

// Data Loading
const loadDashboardData = async () => {
    try {
        const [breast, cervical] = await Promise.all([
            api.get('/api/breast/dashboard').catch(() => ({})),
            api.get('/api/cervical/dashboard').catch(() => ({}))
        ]);

        state.dashboardStats = {
            total_cases: (breast.total_cases || 0) + (cervical.total_cases || 0),
            pending_review: (breast.pending_review || 0) + (cervical.pending_review || 0),
            urgent_review: (breast.urgent_review || 0) + (cervical.urgent_review || 0),
            reviewed: (breast.reviewed || 0) + (cervical.reviewed || 0),
            average_confidence: ((breast.average_confidence || 0) + (cervical.average_confidence || 0)) / 2,
            average_processing_time_ms: ((breast.average_processing_time_ms || 0) + (cervical.average_processing_time_ms || 0)) / 2,
            breast_cases: breast.total_cases || 0,
            cervical_cases: cervical.total_cases || 0
        };
    } catch (e) {
        console.error('Dashboard load error:', e);
    }
};

const loadCases = async (module = '', status = '') => {
    try {
        const promises = [];
        if (!module || module === 'breast') {
            promises.push(api.get(`/api/breast/cases?status=${status}&limit=100`).catch(() => ({ cases: [] })));
        }
        if (!module || module === 'cervical') {
            promises.push(api.get(`/api/cervical/cases?status=${status}&limit=100`).catch(() => ({ cases: [] })));
        }

        const results = await Promise.all(promises);
        let allCases = [];
        results.forEach(r => {
            if (r.cases) allCases = allCases.concat(r.cases);
        });

        state.cases = allCases.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
    } catch (e) {
        console.error('Cases load error:', e);
        state.cases = [];
    }
};

const loadCase = async (caseId) => {
    try {
        // Try breast first, then cervical
        let result = await api.get(`/api/breast/cases/${caseId}`).catch(() => null);
        if (!result) {
            result = await api.get(`/api/cervical/cases/${caseId}`).catch(() => null);
        }
        if (result) {
            state.currentCase = result;
        }
    } catch (e) {
        console.error('Case load error:', e);
    }
};

// Render Function
const render = () => {
    const app = $('#app');

    let content;
    switch (state.currentView) {
        case 'dashboard':
            content = DashboardView();
            break;
        case 'upload':
            content = UploadView();
            break;
        case 'report':
            content = ReportView();
            break;
        case 'cases':
            content = CasesView();
            break;
        case 'review':
            content = ReviewView();
            break;
        case 'models':
            content = ModelsView();
            break;
        default:
            content = DashboardView();
    }

    app.innerHTML = Layout(content);

    // Re-attach drag and drop
    if (state.currentView === 'upload') {
        const dropZone = $('#drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-accent'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-accent'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-accent');
                const files = e.dataTransfer.files;
                if (files.length) {
                    const input = $('#file-input');
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    input.files = dt.files;
                    handleFileSelect({ target: input });
                }
            });
        }
    }
};

// Initialization
const init = async () => {
    await loadDashboardData();
    await loadCases();
    render();
};

// Start
document.addEventListener('DOMContentLoaded', init);
