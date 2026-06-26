/* ==========================================================================
   AETHER FLOW KANBAN WORKSPACE LOGIC - ENTERPRISE GRADE
   ========================================================================== */

// --- GLOBAL APP STATES ---
let projects = [];
let columns = [];
let customTools = JSON.parse(localStorage.getItem('aether_custom_tools') || '[]');
let currentView = 'main'; // 'main' or a project id
let subBoardModalProjectId = null; // tracks if column modal is for a sub-board

// Default sub-board columns template (ids are made unique per project at creation)
const makeDefaultSubColumns = (projId) => [
    { id: `sb-backlog-${projId}`,    name: 'Backlog',      classification: 'pipeline'  },
    { id: `sb-inprogress-${projId}`, name: 'In Progress',  classification: 'technical' },
    { id: `sb-review-${projId}`,     name: 'Review',       classification: 'qa'        },
    { id: `sb-done-${projId}`,       name: 'Done',         classification: 'archive'   }
];
let activeFilters = {
    search: '',
    tool: '',
    priority: ''
};

let showArchivedProjects = false;
let showArchivedTasks    = false;

const _now = new Date();
let mainCalYear  = _now.getFullYear();
let mainCalMonth = _now.getMonth();
let subCalYear   = _now.getFullYear();
let subCalMonth  = _now.getMonth();

// --- DEFAULT SYSTEM STRUCTURES ---
const defaultColumns = [
    { id: 'leads', name: 'Inbox / New Leads', classification: 'pipeline' },
    { id: 'outreach', name: 'Outreach & Emails', classification: 'pipeline' },
    { id: 'development', name: 'AI Development', classification: 'technical' },
    { id: 'testing', name: 'Testing & QA', classification: 'qa' },
    { id: 'done', name: 'Delivered / Done', classification: 'archive' }
];

const generateDefaultProjects = () => {
    const today = new Date();
    const offsetDate = (days) => {
        const target = new Date(today);
        target.setDate(today.getDate() + days);
        return target.toISOString().split('T')[0];
    };

    return [
        {
            id: 'proj-1',
            clientName: 'Acme Logistics Inc.',
            techStack: ['n8n', 'OpenAI API', 'HubSpot'],
            outreachStatus: 'None',
            priority: 'High',
            automationLive: false,
            deadline: offsetDate(1), // Urgent: Due in 24 hours
            nextAction: 'Configure OpenAI prompt for shipping route classifier',
            notes: 'High priority onboarding project. Main goal is to sort incoming client queries and push categorized tickets directly into HubSpot CRM using n8n.',
            columnId: 'leads',
            checklist: [
                { id: 'ch-1', text: 'Configure n8n trigger webhooks', done: true },
                { id: 'ch-2', text: 'Refine OpenAI prompt template', done: false },
                { id: 'ch-3', text: 'Connect HubSpot pipeline nodes', done: false }
            ],
            customFields: [
                { id: 'cf-1', name: 'Webhook URL', value: 'https://n8n.baraa.solutions/webhook/acme-enrichment' },
                { id: 'cf-2', name: 'Contact Email', value: 'support@acmelogistics.com' }
            ]
        },
        {
            id: 'proj-2',
            clientName: 'Apex Financial Services',
            techStack: ['Python', 'Zapier', 'SuiteDash'],
            outreachStatus: 'Email Sent',
            priority: 'Medium',
            automationLive: false,
            deadline: offsetDate(4), // Warning: Due in 4 days
            nextAction: 'Confirm scheduling link for follow-up demo call',
            notes: 'Cold outreach campaign launched on Tuesday. The target is the COO. We proposed an automated client document intake pipeline.',
            columnId: 'outreach',
            checklist: [
                { id: 'ch-4', text: 'Draft outreach sequence templates', done: true },
                { id: 'ch-5', text: 'Configure list filters in HubSpot', done: true },
                { id: 'ch-6', text: 'Follow-up call setup', done: false }
            ],
            customFields: [
                { id: 'cf-3', name: 'Leads Count', value: '1420 leads' },
                { id: 'cf-4', name: 'Target Market', value: 'SME Finance Executives' }
            ]
        },
        {
            id: 'proj-3',
            clientName: 'CyberHealth Care Group',
            techStack: ['n8n', 'OpenAI API', 'Make.com', 'Anthropic API'],
            outreachStatus: 'None',
            priority: 'High',
            automationLive: true,
            deadline: offsetDate(14),
            nextAction: 'Map workflow triggers for patient feedback collection',
            notes: 'Enables real-time sentiment analysis on patient exit reports. Must ensure compliance with HIPAA policies (no sensitive health data passed to models).',
            columnId: 'development',
            checklist: [
                { id: 'ch-7', text: 'HIPAA compliance review', done: true },
                { id: 'ch-8', text: 'Build sentiment mapping module', done: true },
                { id: 'ch-9', text: 'Audit logging script validation', done: false }
            ],
            customFields: [
                { id: 'cf-5', name: 'API Script', value: 'analyze_sentiment.py' },
                { id: 'cf-6', name: 'Webhook URL', value: 'https://make.baraa.solutions/cyberhealth-receiver' }
            ]
        },
        {
            id: 'proj-4',
            clientName: 'Innovate UK Retailers',
            techStack: ['ManyChat', 'HubSpot', 'OpenAI API'],
            outreachStatus: 'None',
            priority: 'Medium',
            automationLive: true,
            deadline: offsetDate(3), // Warning: Due in 3 days
            nextAction: 'Test ManyChat webhook response payload formats',
            notes: 'Chatbot flows configured for Facebook Messenger and Instagram DM. Currently testing the lead hand-off logic to HubSpot live agents.',
            columnId: 'testing',
            checklist: [
                { id: 'ch-10', text: 'Configure ManyChat flows', done: true },
                { id: 'ch-11', text: 'Live testing on staging sandbox', done: false },
                { id: 'ch-12', text: 'Connect agent CRM notifications', done: false }
            ],
            customFields: [
                { id: 'cf-7', name: 'Chatbot Channel', value: 'Instagram DM' },
                { id: 'cf-8', name: 'Webhook URL', value: 'https://manychat.baraa.solutions/incoming-retail' }
            ]
        },
        {
            id: 'proj-5',
            clientName: 'Globex Consulting Ltd.',
            techStack: ['n8n', 'Zapier', 'HubSpot'],
            outreachStatus: 'None',
            priority: 'Low',
            automationLive: true,
            deadline: offsetDate(-2), // Completed
            nextAction: 'Provide handover document and API keys guide',
            notes: 'Successfully implemented lead routing between landing pages and HubSpot core. Completed testing with zero failed runs.',
            columnId: 'done',
            checklist: [
                { id: 'ch-13', text: 'Map leads pipelines', done: true },
                { id: 'ch-14', text: 'Verify field mappings', done: true },
                { id: 'ch-15', text: 'Deliver documentation guides', done: true }
            ],
            customFields: [
                { id: 'cf-9', name: 'Integration Portal', value: 'Globex SuiteDash v4' }
            ]
        }
    ];
};

// --- DATA ACCESS & MIGRATION ENGINE ---
const migrateAndLoadState = () => {
    // 1. Load Columns
    const storedCols = localStorage.getItem('aether_flow_columns');
    if (storedCols) {
        try {
            columns = JSON.parse(storedCols);
        } catch (e) {
            console.error("Error reading columns state, loading defaults", e);
            columns = defaultColumns;
            localStorage.setItem('aether_flow_columns', JSON.stringify(columns));
        }
    } else {
        columns = defaultColumns;
        localStorage.setItem('aether_flow_columns', JSON.stringify(columns));
    }

    // 2. Load Cards & Migrate Old Schema
    const storedProjects = localStorage.getItem('aether_flow_projects');
    if (storedProjects) {
        try {
            const rawProjects = JSON.parse(storedProjects);
            projects = rawProjects.map(proj => {
                const checklist = proj.checklist || [];
                const customFields = proj.customFields || [];
                const id = proj.id || `proj-${Date.now()}-${Math.random().toString(36).substr(2,4)}`;
                return {
                    id,
                    clientName: proj.clientName || 'Unnamed Client',
                    brief: proj.brief || '',
                    techStack: proj.techStack || [],
                    outreachStatus: proj.outreachStatus || 'None',
                    priority: proj.priority || 'Medium',
                    automationLive: proj.automationLive !== undefined ? proj.automationLive : false,
                    deadline: proj.deadline || '',
                    nextAction: proj.nextAction || '',
                    notes: proj.notes || '',
                    columnId: proj.columnId || 'leads',
                    checklist,
                    customFields,
                    // Sub-board fields (migrate existing projects)
                    subBoard: proj.subBoard || { columns: makeDefaultSubColumns(id), tasks: [] },
                    lastActivityAt: proj.lastActivityAt || null,
                    status: proj.status || 'active'
                };
            });
        } catch (e) {
            console.error("Error reading projects state, loading defaults", e);
            projects = generateDefaultProjects();
            saveState();
        }
    } else {
        projects = generateDefaultProjects();
        saveState();
    }

    // Ensure all projects have subBoard field (safety net) + migrate archived flag
    projects = projects.map(proj => {
        const sb = proj.subBoard || { columns: makeDefaultSubColumns(proj.id), tasks: [] };
        // Migrate archived flag onto tasks
        sb.tasks = (sb.tasks || []).map(t => ({ archived: false, ...t }));
        return {
            ...proj,
            brief: proj.brief || '',
            archived: proj.archived || false,
            subBoard: sb,
            lastActivityAt: proj.lastActivityAt || null,
            status: proj.status || 'active'
        };
    });
};

const saveState = () => {
    localStorage.setItem('aether_flow_columns', JSON.stringify(columns));
    localStorage.setItem('aether_flow_projects', JSON.stringify(projects));
};

// --- URGENCY TAG HELPERS ---
const getUrgency = (deadlineStr, classification) => {
    if (classification === 'archive') return 'normal';
    if (!deadlineStr) return 'normal';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) {
        return 'urgent';
    } else if (diffDays <= 7) {
        return 'warning';
    } else {
        return 'normal';
    }
};

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'No Deadline';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- COLUMN SUMMARY DASHBOARD TILES ---
const renderColumnSummary = () => {
    const container = document.getElementById('column-summary-bar');
    if (!container) return;
    container.innerHTML = '';

    columns.forEach(col => {
        const count = projects.filter(p => p.columnId === col.id).length;
        const tile = document.createElement('div');
        tile.classList.add('column-summary-tile', `class-${col.classification}`);
        tile.innerHTML = `
            <div class="tile-dot"></div>
            <span class="tile-name">${col.name}</span>
            <span class="tile-count">${count}</span>
        `;
        container.appendChild(tile);
    });
};

// --- DYNAMIC KPI METRICS PANEL ---
const calculateKPIs = () => {
    const total = projects.length;
    
    // Active Automations: counts how many project cards have "Automation Live" checked
    const automations = projects.filter(p => p.automationLive).length;
    
    // Active Outreach: count of projects in columns classified as "pipeline" where outreach status is set
    const pipelineColumnIds = columns.filter(c => c.classification === 'pipeline').map(c => c.id);
    const outreach = projects.filter(p => pipelineColumnIds.includes(p.columnId) && p.outreachStatus !== 'None').length;
    
    // Completed projects: count of projects in columns classified as "archive"
    const archiveColumnIds = columns.filter(c => c.classification === 'archive').map(c => c.id);
    const completed = projects.filter(p => archiveColumnIds.includes(p.columnId)).length;

    // Set UI displays
    document.getElementById('count-total').innerText = total;
    document.getElementById('count-automations').innerText = automations;
    document.getElementById('count-outreach').innerText = outreach;
    document.getElementById('count-completed').innerText = completed;

    renderColumnSummary();
    renderMainCalendar();
};

// --- COLUMN INTEL PROGRESS INDICATOR FORMULA ---
const calculateColumnProgress = (colId, classification, colCards) => {
    if (colCards.length === 0) return 0;

    switch (classification) {
        case 'pipeline': {
            // Formula: % of cards with an outreachStatus !== 'None' AND a nextAction filled out
            const completeCards = colCards.filter(p => p.outreachStatus !== 'None' && p.nextAction && p.nextAction.trim().length > 0).length;
            return Math.round((completeCards / colCards.length) * 100);
        }
        case 'technical': {
            // Formula: % of cards that have at least 1 custom field or at least 1 tech stack tool tag
            const completeCards = colCards.filter(p => p.customFields.length > 0 || p.techStack.length > 0).length;
            return Math.round((completeCards / colCards.length) * 100);
        }
        case 'qa': {
            // Formula: % of total checklist items completed across all cards in this QA column
            let totalItems = 0;
            let completedItems = 0;
            colCards.forEach(p => {
                totalItems += p.checklist.length;
                completedItems += p.checklist.filter(item => item.done).length;
            });
            return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        }
        case 'archive': {
            // Archive is complete by default
            return 100;
        }
        default:
            return 0;
    }
};

// --- CLIPBOARD WEBHOOK COPY CONTROLLER ---
const showCopyTooltip = (x, y, message) => {
    // Remove old floater tooltip if exists
    const oldTip = document.querySelector('.copy-tooltip');
    if (oldTip) oldTip.remove();

    const tooltip = document.createElement('div');
    tooltip.classList.add('copy-tooltip');
    tooltip.innerText = message;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    document.body.appendChild(tooltip);

    // Render smooth layout animation
    setTimeout(() => tooltip.classList.add('show'), 10);

    // Auto cleanup
    setTimeout(() => {
        tooltip.classList.remove('show');
        setTimeout(() => tooltip.remove(), 150);
    }, 1200);
};

const copyToClipboard = (text, event) => {
    event.stopPropagation(); // Avoid triggering card click edit modal

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + window.scrollX + (rect.width / 2);
    const y = rect.top + window.scrollY;

    // Modern API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showCopyTooltip(x, y, "Copied Webhook!");
            })
            .catch(err => {
                fallbackCopyToClipboard(text, x, y);
            });
    } else {
        fallbackCopyToClipboard(text, x, y);
    }
};

const fallbackCopyToClipboard = (text, x, y) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyTooltip(x, y, "Copied Webhook!");
        } else {
            showCopyTooltip(x, y, "Copy Failed");
        }
    } catch (err) {
        console.error('Fallback copy fail', err);
        showCopyTooltip(x, y, "Access Blocked");
    }

    document.body.removeChild(textArea);
};

// --- DYNAMIC CARD DOM CREATION ---
const createCardDOM = (project, columnClassification) => {
    const card = document.createElement('div');
    card.classList.add('project-card');
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', project.id);

    // Apply priority color label tag
    const priorityClass = `tag-${project.priority.toLowerCase()}`;
    const priorityTagHTML = `<span class="card-priority-tag ${priorityClass}">${project.priority}</span>`;

    // Render Tech tags
    const tagsHTML = project.techStack.map(tool => 
        `<span class="tag-badge" data-tool="${tool}">${tool}</span>`
    ).join('');

    // Generate Custom Parameters (displays top 2 custom fields)
    let customParamsHTML = '';
    if (project.customFields.length > 0) {
        const visibleFields = project.customFields.slice(0, 2);
        const fieldsRows = visibleFields.map(field => {
            const isWebhook = field.name.toLowerCase() === 'webhook url';
            const copyIconHTML = isWebhook 
                ? `<div class="copy-param-btn" title="Copy Webhook Url" onclick="copyToClipboard('${field.value}', event)"><i data-lucide="copy"></i></div>`
                : '';

            return `
                <div class="param-item">
                    <span class="param-label" title="${field.name}">${field.name}:</span>
                    <div class="param-val-wrapper">
                        <span class="param-value" title="${field.value}">${field.value}</span>
                        ${copyIconHTML}
                    </div>
                </div>
            `;
        }).join('');

        customParamsHTML = `<div class="card-custom-params">${fieldsRows}</div>`;
    }

    // Generate QA checklist rate progress bar (shown for QA classification)
    let checklistStatusHTML = '';
    if (project.checklist.length > 0) {
        const totalItems = project.checklist.length;
        // Archive type forces all done in UI, else read active state
        const doneItems = columnClassification === 'archive' 
            ? totalItems 
            : project.checklist.filter(item => item.done).length;
        
        const percentage = Math.round((doneItems / totalItems) * 100);

        checklistStatusHTML = `
            <div class="card-checklist-status">
                <div class="checklist-status-header">
                    <span>Task List Check</span>
                    <span>${doneItems}/${totalItems} (${percentage}%)</span>
                </div>
                <div class="checklist-status-bar-bg">
                    <div class="checklist-status-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    } else if (columnClassification === 'qa') {
        // QA classification requires a checklist display. Render blank placeholder if empty.
        checklistStatusHTML = `
            <div class="card-checklist-status">
                <div class="checklist-status-header">
                    <span>Task List Check</span>
                    <span>0/0 (0%)</span>
                </div>
                <div class="checklist-status-bar-bg">
                    <div class="checklist-status-bar-fill" style="width: 0%"></div>
                </div>
            </div>
        `;
    }

    // Generate Pipeline bubbles: outreach status & next action
    let pipelineBubbleHTML = '';
    const showPipelineDetails = columnClassification === 'pipeline';
    if (showPipelineDetails) {
        const statusText = project.outreachStatus || 'None';
        let statusDotClass = 'none';
        if (statusText === 'Email Sent') statusDotClass = 'sent';
        if (statusText === 'Waiting for Reply') statusDotClass = 'waiting';
        if (statusText === 'Meeting Booked') statusDotClass = 'booked';
        if (statusText === 'Follow-up Sent') statusDotClass = 'followup';

        pipelineBubbleHTML = `
            <div class="card-next-action-bubble">
                <span class="bubble-label">Pipeline: ${statusText}</span>
                <div class="bubble-content" title="${project.nextAction || 'None'}">
                    ${project.nextAction || 'No Next Action Set'}
                </div>
            </div>
        `;
    }

    // Card Footer Metadata (Urgency & Deadline display)
    const urgency = getUrgency(project.deadline, columnClassification);
    let deadlineClass = '';
    if (urgency === 'urgent') deadlineClass = 'deadline-urgent';
    if (urgency === 'warning') deadlineClass = 'deadline-warning';

    const deadlineText = columnClassification === 'archive' 
        ? 'Completed' 
        : formatDateDisplay(project.deadline);
        
    const cardFooterHTML = `
        <div class="card-footer">
            <span class="card-deadline ${deadlineClass}">${deadlineText}</span>
            <div class="user-avatar-small" style="font-size: 8px; width: 16px; height: 16px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; font-weight: 700;">AI</div>
        </div>
    `;

    // Task stats from sub-board
    const sbTasks = project.subBoard?.tasks || [];
    const sbCols  = project.subBoard?.columns || [];
    const doneCols = sbCols.filter(c => c.classification === 'archive').map(c => c.id);
    const ipCols   = sbCols.filter(c => c.classification === 'technical').map(c => c.id);
    const doneCount = sbTasks.filter(t => doneCols.includes(t.columnId)).length;
    const ipCount   = sbTasks.filter(t => ipCols.includes(t.columnId)).length;

    const taskStatsHTML = sbTasks.length > 0
        ? `<div class="card-task-stats">
               <span class="task-stat total"><span>${sbTasks.length}</span> Tasks</span>
               <div class="task-stat-divider"></div>
               <span class="task-stat done"><span>${doneCount}</span> Done</span>
               <div class="task-stat-divider"></div>
               <span class="task-stat inprogress"><span>${ipCount}</span> In&nbsp;Progress</span>
           </div>`
        : `<div class="card-task-stats empty-tasks">No tasks — <a href="#" class="open-board-link" onclick="event.stopPropagation();switchView('${project.id}');return false;">Open board</a></div>`;

    // Activity indicator
    const actStatus = getActivityStatus(project.lastActivityAt);
    const actLabel  = actStatus === 'green' ? 'Active' : actStatus === 'yellow' ? 'Slow' : 'Inactive';
    const actHTML   = `<div class="activity-indicator"><span class="activity-dot ${actStatus}"></span><span class="activity-label">${actLabel}</span></div>`;

    // Brief text (prefer brief, fallback to notes)
    const briefText = project.brief || project.notes || '';

    // Completed project class
    if (project.status === 'completed') card.classList.add('project-completed');

    // Inner card markup
    card.innerHTML = `
        <div class="card-header-row">
            <h4 class="card-title">${project.clientName}</h4>
            <div style="display:flex;align-items:center;gap:5px;">
                ${priorityTagHTML}
                <div class="card-edit-btn" title="Edit project details" onclick="event.stopPropagation();openCardModal('${project.id}')">
                    <i data-lucide="pencil"></i>
                </div>
            </div>
        </div>
        ${briefText ? `<p class="card-description">${briefText}</p>` : ''}
        <div class="card-tags">${tagsHTML}</div>
        ${taskStatsHTML}
        <div class="card-activity-row">
            ${actHTML}
            ${cardFooterHTML.replace('<div class="card-footer">', '').replace('</div>', '')}
        </div>
    `;

    // Click opens sub-board
    card.addEventListener('click', (e) => {
        if (card.classList.contains('dragging')) return;
        if (e.target.closest('.card-edit-btn')) return;
        switchView(project.id);
    });

    // Native Drag Events listeners
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', project.id);
        e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    return card;
};

// --- DYNAMIC BOARD RENDER PIPELINE ---
const renderBoard = () => {
    const canvas = document.getElementById('board-canvas');
    if (!canvas) return;

    canvas.innerHTML = '';

    // Filter projects based on active query
    const filteredProjects = projects.filter(project => {
        // Archive filter
        if (!showArchivedProjects && project.archived) return false;

        const query = activeFilters.search.toLowerCase().trim();
        const matchesSearch = query === '' ||
                             project.clientName.toLowerCase().includes(query) ||
                             project.notes.toLowerCase().includes(query) ||
                             project.nextAction.toLowerCase().includes(query) ||
                             project.customFields.some(f => f.name.toLowerCase().includes(query) || f.value.toLowerCase().includes(query));

        const matchesTool     = activeFilters.tool     === '' || project.techStack.includes(activeFilters.tool);
        const matchesPriority = activeFilters.priority === '' || project.priority === activeFilters.priority;

        return matchesSearch && matchesTool && matchesPriority;
    });

    // Loop through columns
    columns.forEach(col => {
        const colContainer = document.createElement('div');
        colContainer.classList.add('kanban-column', `class-${col.classification}`);
        colContainer.setAttribute('data-column-id', col.id);

        const colCards = filteredProjects.filter(p => p.columnId === col.id);
        const progressVal = calculateColumnProgress(col.id, col.classification, colCards);

        // Dynamic icon based on classification
        let classIcon = 'layers';
        if (col.classification === 'pipeline') classIcon = 'git-pull-request';
        if (col.classification === 'technical') classIcon = 'terminal';
        if (col.classification === 'qa') classIcon = 'shield-alert';
        if (col.classification === 'archive') classIcon = 'package-check';

        // Column markup structure
        colContainer.innerHTML = `
            <div class="column-header">
                <div class="header-top-row">
                    <div class="column-title-group">
                        <i data-lucide="${classIcon}" class="column-class-icon"></i>
                        <h2>${col.name}</h2>
                        <span class="card-count">${colCards.length}</span>
                    </div>
                    <div class="column-header-actions">
                        <button type="button" class="col-settings-btn" title="Edit Column Properties" onclick="openColumnModal('${col.id}', event)">
                            <i data-lucide="sliders"></i>
                        </button>
                        <button type="button" class="col-add-task-btn" title="Add project to this column" onclick="openCardModal(null, '${col.id}', event)">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
                <!-- Micro progress indicators -->
                <div class="column-progress-wrapper" title="Column Task Progress: ${progressVal}%">
                    <div class="column-progress-bar" style="width: ${progressVal}%"></div>
                </div>
            </div>
            <div class="column-body" id="col-body-${col.id}"></div>
        `;

        const colBody = colContainer.querySelector('.column-body');
        
        // Append Cards
        if (colCards.length > 0) {
            colCards.forEach(project => {
                colBody.appendChild(createCardDOM(project, col.classification));
            });
        } else {
            // Render nice minimal empty placeholder
            colBody.innerHTML = `
                <div class="empty-placeholder">
                    <i data-lucide="folder-open"></i>
                    <span>Column is empty</span>
                </div>
            `;
        }

        canvas.appendChild(colContainer);
    });

    // Render "+ Add Column" box at the end
    const colAdderBox = document.createElement('div');
    colAdderBox.classList.add('board-column-adder-box');
    colAdderBox.setAttribute('id', 'board-column-adder-btn');
    colAdderBox.innerHTML = `
        <div class="adder-content">
            <i data-lucide="plus-square"></i>
            <span>Add New Column</span>
        </div>
    `;
    colAdderBox.addEventListener('click', () => openColumnModal(null));
    canvas.appendChild(colAdderBox);

    // Enable dragover and drop handlers on column body layers
    initializeDragAndDropHandlers();

    // Re-initialize Lucide Icons
    lucide.createIcons();
};

// --- DRAG AND DROP CONTROLLER ---
const initializeDragAndDropHandlers = () => {
    const columnBodies = document.querySelectorAll('.column-body');
    
    columnBodies.forEach(body => {
        const column = body.parentElement;
        const colId = column.getAttribute('data-column-id');

        body.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        body.addEventListener('dragenter', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        body.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        body.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            const cardId = e.dataTransfer.getData('text/plain');
            const targetProjIndex = projects.findIndex(p => p.id === cardId);
            
            if (targetProjIndex !== -1 && projects[targetProjIndex].columnId !== colId) {
                const project = projects[targetProjIndex];
                project.columnId = colId;
                
                // Get target column classification rules
                const targetCol = columns.find(c => c.id === colId);
                
                // Rule: Archive/Done Type automatically marks all internal checklists completed
                if (targetCol && targetCol.classification === 'archive') {
                    project.checklist = project.checklist.map(item => ({ ...item, done: true }));
                }

                saveState();
                renderBoard();
                calculateKPIs();
            }
        });
    });
};

// --- CONTROLS EVENT HANDLERS ---
const initializeControls = () => {
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const toolFilter = document.getElementById('tool-filter');
    const priorityFilter = document.getElementById('priority-filter');

    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value;
        searchClearBtn.style.display = activeFilters.search.trim().length > 0 ? 'block' : 'none';
        renderBoard();
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeFilters.search = '';
        searchClearBtn.style.display = 'none';
        renderBoard();
    });

    toolFilter.addEventListener('change', (e) => {
        activeFilters.tool = e.target.value;
        renderBoard();
    });

    priorityFilter.addEventListener('change', (e) => {
        activeFilters.priority = e.target.value;
        renderBoard();
    });
};

// --- DYNAMIC COLUMNS MODAL MANAGEMENT ---
const colModal = document.getElementById('column-modal');
const colForm = document.getElementById('column-form');
const colModalTitle = document.getElementById('column-modal-title');
const colDeleteBtn = document.getElementById('delete-column-btn');

const openColumnModal = (colId = null, event = null) => {
    if (event) event.stopPropagation();

    colForm.reset();

    if (colId) {
        // Edit Mode — look in sub-board columns or main columns
        let col;
        if (subBoardModalProjectId) {
            const proj = projects.find(p => p.id === subBoardModalProjectId);
            col = proj?.subBoard.columns.find(c => c.id === colId);
        } else {
            col = columns.find(c => c.id === colId);
        }
        if (!col) return;

        colModalTitle.innerText = "Edit Column Properties";
        document.getElementById('column-id').value = col.id;
        document.getElementById('column-name').value = col.name;
        document.getElementById('column-classification').value = col.classification;

        // Hide delete for protected default columns
        const isMainDefault = ['leads', 'outreach', 'development', 'testing', 'done'].includes(col.id);
        const isSubDefault  = /^sb-(backlog|inprogress|review|done)-/.test(col.id);
        colDeleteBtn.style.display = (isMainDefault || isSubDefault) ? 'none' : 'inline-flex';
    } else {
        // Create Mode
        colModalTitle.innerText = "Create Dynamic Column";
        document.getElementById('column-id').value = '';
        colDeleteBtn.style.display = 'none';
    }

    colModal.classList.add('active');
};

const closeColumnModal = () => {
    colModal.classList.remove('active');
};

const saveColumnData = () => {
    const id = document.getElementById('column-id').value;
    const name = document.getElementById('column-name').value.trim();
    const classification = document.getElementById('column-classification').value;
    if (!name) return;

    if (subBoardModalProjectId) {
        // Sub-board context
        const project = projects.find(p => p.id === subBoardModalProjectId);
        if (project) {
            if (id) {
                const col = project.subBoard.columns.find(c => c.id === id);
                if (col) { col.name = name; col.classification = classification; }
            } else {
                project.subBoard.columns.push({ id: `sb-${Date.now()}`, name, classification });
            }
            saveState();
            closeColumnModal();
            renderSubBoard(subBoardModalProjectId);
        }
        subBoardModalProjectId = null;
    } else {
        // Main board context
        if (id) {
            const idx = columns.findIndex(c => c.id === id);
            if (idx !== -1) { columns[idx].name = name; columns[idx].classification = classification; }
        } else {
            columns.push({ id: `col-${Date.now()}`, name, classification });
        }
        saveState();
        closeColumnModal();
        renderBoard();
        calculateKPIs();
    }
};

const deleteColumn = () => {
    const id = document.getElementById('column-id').value;
    if (!id) return;

    if (subBoardModalProjectId) {
        const project = projects.find(p => p.id === subBoardModalProjectId);
        if (project && confirm('Delete this column? Tasks in it will move to Backlog.')) {
            const backlog = project.subBoard.columns[0];
            project.subBoard.tasks.forEach(t => { if (t.columnId === id) t.columnId = backlog?.id || id; });
            project.subBoard.columns = project.subBoard.columns.filter(c => c.id !== id);
            saveState();
            closeColumnModal();
            renderSubBoard(subBoardModalProjectId);
        }
        subBoardModalProjectId = null;
    } else {
        if (confirm("Delete this column? Existing projects will be automatically moved to your 'Inbox / New Leads' to protect data.")) {
            projects.forEach(p => { if (p.columnId === id) p.columnId = 'leads'; });
            columns = columns.filter(c => c.id !== id);
            saveState();
            closeColumnModal();
            renderBoard();
            calculateKPIs();
        }
    }
};

const initializeColumnModalListeners = () => {
    document.getElementById('add-column-btn').addEventListener('click', () => openColumnModal(null));
    document.getElementById('column-modal-close-btn').addEventListener('click', closeColumnModal);
    document.getElementById('column-modal-cancel-btn').addEventListener('click', closeColumnModal);
    colDeleteBtn.addEventListener('click', deleteColumn);
    
    colForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveColumnData();
    });

    colModal.addEventListener('click', (e) => {
        if (e.target === colModal) closeColumnModal();
    });
};

// --- ADVANCED TASK DETAIL MODAL CONTROL (CHECKLISTS & CUSTOM FIELDS) ---
const cardModal = document.getElementById('card-modal');
const cardForm = document.getElementById('card-form');
const cardModalTitle = document.getElementById('modal-title');
const cardDeleteBtn = document.getElementById('delete-card-btn');
const cardCloseBtn = document.getElementById('modal-close-btn');
const cardCancelBtn = document.getElementById('modal-cancel-btn');

// Local sub-state for modal checklists and custom fields during edit session
let modalChecklist = [];
let modalCustomFields = [];

// --- CUSTOM TOOL CHIP MANAGEMENT ---
const _createCustomToolChip = (toolName, saveToStorage = true) => {
    if (!toolName || document.querySelector(`.tech-checkbox-chip[data-value="${CSS.escape(toolName)}"]`)) return;

    const grid = document.getElementById('tech-selector');
    const addChip = document.getElementById('add-new-tool-chip');
    const chip = document.createElement('div');
    chip.classList.add('tech-checkbox-chip');
    chip.setAttribute('data-value', toolName);
    chip.textContent = toolName;
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
    grid.insertBefore(chip, addChip);

    // Also add to tool-filter dropdown
    const filterSelect = document.getElementById('tool-filter');
    if (filterSelect && !filterSelect.querySelector(`option[value="${toolName}"]`)) {
        const opt = document.createElement('option');
        opt.value = toolName;
        opt.textContent = toolName;
        filterSelect.appendChild(opt);
    }

    if (saveToStorage && !customTools.includes(toolName)) {
        customTools.push(toolName);
        localStorage.setItem('aether_custom_tools', JSON.stringify(customTools));
    }
};

const initializeAddToolChip = () => {
    // Restore previously saved custom tools
    customTools.forEach(tool => _createCustomToolChip(tool, false));

    const addChip = document.getElementById('add-new-tool-chip');
    const inlineRow = document.getElementById('add-tool-inline');
    const newToolInput = document.getElementById('new-tool-input');

    addChip.addEventListener('click', () => {
        inlineRow.style.display = 'flex';
        addChip.style.display = 'none';
        newToolInput.focus();
    });

    const confirmAdd = () => {
        const name = newToolInput.value.trim();
        if (name) _createCustomToolChip(name, true);
        newToolInput.value = '';
        inlineRow.style.display = 'none';
        addChip.style.display = '';
        lucide.createIcons();
    };

    document.getElementById('confirm-add-tool-btn').addEventListener('click', confirmAdd);
    document.getElementById('cancel-add-tool-btn').addEventListener('click', () => {
        newToolInput.value = '';
        inlineRow.style.display = 'none';
        addChip.style.display = '';
    });

    newToolInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); }
        if (e.key === 'Escape') { document.getElementById('cancel-add-tool-btn').click(); }
    });
};

// Chips multi-select logic
const initializeCardModalChips = () => {
    const chips = document.querySelectorAll('.tech-checkbox-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
        });
    });
};

const getSelectedTechChips = () => {
    const selected = [];
    document.querySelectorAll('.tech-checkbox-chip.selected').forEach(chip => {
        selected.push(chip.getAttribute('data-value'));
    });
    return selected;
};

const setSelectedTechChips = (techList) => {
    // Ensure chips exist for any tool in the tech list (handles custom tools on cards)
    if (techList) {
        techList.forEach(tool => {
            if (!document.querySelector(`.tech-checkbox-chip[data-value="${CSS.escape(tool)}"]`)) {
                _createCustomToolChip(tool, false);
            }
        });
    }

    document.querySelectorAll('.tech-checkbox-chip').forEach(chip => {
        const val = chip.getAttribute('data-value');
        if (techList && techList.includes(val)) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });
};

// Checklist UI Manager
const renderModalChecklist = () => {
    const container = document.getElementById('modal-checklist-container');
    container.innerHTML = '';

    modalChecklist.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('checklist-item-row');
        row.innerHTML = `
            <div class="item-left">
                <input type="checkbox" class="item-checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem('${item.id}')">
                <span class="item-text ${item.done ? 'done' : ''}">${item.text}</span>
            </div>
            <div class="item-delete-btn" title="Remove sub-task" onclick="deleteChecklistItem('${item.id}')">
                <i data-lucide="trash-2"></i>
            </div>
        `;
        container.appendChild(row);
    });

    // Calculate dynamic sub-progress indicators
    const total = modalChecklist.length;
    const done = modalChecklist.filter(i => i.done).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    document.getElementById('modal-checklist-percentage').innerText = `${percent}% Done`;

    lucide.createIcons();
};

window.toggleChecklistItem = (itemId) => {
    const item = modalChecklist.find(i => i.id === itemId);
    if (item) {
        item.done = !item.done;
        renderModalChecklist();
    }
};

window.deleteChecklistItem = (itemId) => {
    modalChecklist = modalChecklist.filter(i => i.id !== itemId);
    renderModalChecklist();
};

const addChecklistItem = () => {
    const input = document.getElementById('new-checklist-input');
    const text = input.value.trim();
    if (!text) return;

    modalChecklist.push({
        id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: text,
        done: false
    });

    input.value = '';
    renderModalChecklist();
};

// Custom Fields UI Manager
const renderModalCustomFields = () => {
    const container = document.getElementById('modal-custom-fields-container');
    container.innerHTML = '';

    modalCustomFields.forEach(field => {
        const row = document.createElement('div');
        row.classList.add('custom-field-row');
        row.innerHTML = `
            <div class="field-meta">
                <span class="field-label-display" title="${field.name}">${field.name}</span>
                <span class="field-value-display" title="${field.value}">${field.value}</span>
            </div>
            <div class="field-delete-btn" title="Remove parameter" onclick="deleteCustomField('${field.id}')">
                <i data-lucide="trash-2"></i>
            </div>
        `;
        container.appendChild(row);
    });

    lucide.createIcons();
};

window.deleteCustomField = (fieldId) => {
    modalCustomFields = modalCustomFields.filter(f => f.id !== fieldId);
    renderModalCustomFields();
};

const addCustomField = () => {
    const nameInput = document.getElementById('new-field-name-input');
    const valueInput = document.getElementById('new-field-value-input');
    const name = nameInput.value.trim();
    const value = valueInput.value.trim();

    if (!name || !value) return;

    modalCustomFields.push({
        id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: name,
        value: value
    });

    nameInput.value = '';
    valueInput.value = '';
    renderModalCustomFields();
};

// Main card modal open
const openCardModal = (cardId = null, defaultColId = null, event = null) => {
    if (event) event.stopPropagation();

    cardForm.reset();
    setSelectedTechChips([]);
    modalChecklist = [];
    modalCustomFields = [];

    // Reset adder fields
    document.getElementById('new-checklist-input').value = '';
    document.getElementById('new-field-name-input').value = '';
    document.getElementById('new-field-value-input').value = '';

    if (cardId) {
        // Edit Mode
        const proj = projects.find(p => p.id === cardId);
        if (!proj) return;

        cardModalTitle.innerText = "Edit Project Settings";
        document.getElementById('card-id').value = proj.id;
        document.getElementById('card-column-id').value = proj.columnId;
        document.getElementById('client-name').value = proj.clientName;
        document.getElementById('outreach-status').value = proj.outreachStatus || 'None';
        document.getElementById('card-priority').value = proj.priority || 'Medium';
        document.getElementById('delivery-deadline').value = proj.deadline || '';
        document.getElementById('next-action').value = proj.nextAction || '';
        document.getElementById('project-notes').value = proj.notes || '';
        document.getElementById('automation-live').checked = proj.automationLive || false;

        setSelectedTechChips(proj.techStack);
        
        // Deep copy sub-arrays
        modalChecklist = JSON.parse(JSON.stringify(proj.checklist || []));
        modalCustomFields = JSON.parse(JSON.stringify(proj.customFields || []));

        cardDeleteBtn.style.display = 'inline-flex';
        const archiveCardBtn = document.getElementById('archive-card-btn');
        archiveCardBtn.style.display = 'inline-flex';
        document.getElementById('archive-card-label').textContent = proj.archived ? 'Unarchive' : 'Archive';
    } else {
        // Create Mode
        cardModalTitle.innerText = "Create New Project";
        document.getElementById('card-id').value = '';
        document.getElementById('card-column-id').value = defaultColId || columns[0].id;
        document.getElementById('automation-live').checked = false;

        cardDeleteBtn.style.display = 'none';
        document.getElementById('archive-card-btn').style.display = 'none';
    }

    renderModalChecklist();
    renderModalCustomFields();
    cardModal.classList.add('active');
};

const closeCardModal = () => {
    cardModal.classList.remove('active');
};

const saveCardData = () => {
    const id = document.getElementById('card-id').value;
    const clientName = document.getElementById('client-name').value.trim();
    const nextAction = document.getElementById('next-action').value.trim();

    if (!clientName || !nextAction) {
        alert("Client Name and Immediate Next Action are required fields.");
        return;
    }

    const outreachStatus = document.getElementById('outreach-status').value;
    const priority = document.getElementById('card-priority').value;
    const deadline = document.getElementById('delivery-deadline').value;
    const notes = document.getElementById('project-notes').value.trim();
    const automationLive = document.getElementById('automation-live').checked;
    const columnId = document.getElementById('card-column-id').value || columns[0].id;
    const techStack = getSelectedTechChips();

    // Check if column classification rules force checklist done state
    const targetCol = columns.find(c => c.id === columnId);
    let finalChecklist = modalChecklist;
    if (targetCol && targetCol.classification === 'archive') {
        finalChecklist = modalChecklist.map(item => ({ ...item, done: true }));
    }

    if (id) {
        // Update existing card
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) {
            projects[idx] = {
                ...projects[idx],
                clientName,
                techStack,
                outreachStatus,
                priority,
                deadline,
                nextAction,
                notes,
                automationLive,
                columnId,
                checklist: finalChecklist,
                customFields: modalCustomFields
            };
        }
    } else {
        // Create new card
        const newProj = {
            id: `proj-${Date.now()}`,
            clientName,
            techStack,
            outreachStatus,
            priority,
            deadline,
            nextAction,
            notes,
            automationLive,
            columnId,
            checklist: finalChecklist,
            customFields: modalCustomFields
        };
        projects.push(newProj);
    }

    saveState();
    closeCardModal();
    renderBoard();
    calculateKPIs();
};

const deleteProjectCard = () => {
    const id = document.getElementById('card-id').value;
    if (!id) return;

    if (confirm("Are you sure you want to delete this project? All associated checklists and custom parameters will be lost.")) {
        projects = projects.filter(p => p.id !== id);
        saveState();
        closeCardModal();
        renderBoard();
        calculateKPIs();
        renderSidebarProjects();
    }
};

const archiveProject = () => {
    const id = document.getElementById('card-id').value;
    if (!id) return;
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    proj.archived = !proj.archived;
    document.getElementById('archive-card-label').textContent = proj.archived ? 'Unarchive' : 'Archive';
    saveState();
    closeCardModal();
    renderBoard();
    calculateKPIs();
    renderSidebarProjects();
};

const initializeCardModalListeners = () => {
    // add-card-btn is now handled by initializeNewProjectModalListeners
    cardCloseBtn.addEventListener('click', closeCardModal);
    cardCancelBtn.addEventListener('click', closeCardModal);
    cardDeleteBtn.addEventListener('click', deleteProjectCard);
    document.getElementById('archive-card-btn').addEventListener('click', archiveProject);

    cardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCardData();
    });

    // Sub-Adder triggers
    document.getElementById('add-checklist-item-btn').addEventListener('click', addChecklistItem);
    document.getElementById('add-custom-field-btn').addEventListener('click', addCustomField);

    // Support pressing enter inside sub-adders without submitting main form
    document.getElementById('new-checklist-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addChecklistItem();
        }
    });

    const addFieldEnterHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomField();
        }
    };
    document.getElementById('new-field-name-input').addEventListener('keydown', addFieldEnterHandler);
    document.getElementById('new-field-value-input').addEventListener('keydown', addFieldEnterHandler);

    cardModal.addEventListener('click', (e) => {
        if (e.target === cardModal) closeCardModal();
    });
};

// --- DATA IMPORT / EXPORT BACKUP ENGINE ---
const exportStateBackup = () => {
    const stateData = {
        version: "1.1.0",
        columns: columns,
        projects: projects
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateData, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aether_flow_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
};

const triggerImportFileInput = () => {
    document.getElementById('import-file-input').click();
};

const importStateBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            
            // Validation
            if (!parsed.columns || !parsed.projects || !Array.isArray(parsed.columns) || !Array.isArray(parsed.projects)) {
                alert("Import failed: JSON file does not contain valid columns or projects arrays.");
                return;
            }

            if (confirm("Importing this backup will overwrite your current Kanban board layout and active projects. Do you want to proceed?")) {
                // Ensure array structures and clean model fields exist (Migration mapping safeguard)
                columns = parsed.columns;
                projects = parsed.projects.map(proj => {
                    return {
                        id: proj.id || `proj-${Date.now()}-${Math.random()}`,
                        clientName: proj.clientName || 'Unnamed Client',
                        techStack: proj.techStack || [],
                        outreachStatus: proj.outreachStatus || 'None',
                        priority: proj.priority || 'Medium',
                        automationLive: proj.automationLive !== undefined ? proj.automationLive : false,
                        deadline: proj.deadline || '',
                        nextAction: proj.nextAction || '',
                        notes: proj.notes || '',
                        columnId: proj.columnId || columns[0].id,
                        checklist: proj.checklist || [],
                        customFields: proj.customFields || []
                    };
                });

                saveState();
                renderBoard();
                calculateKPIs();
                alert("Workspace state restored successfully!");
            }
        } catch (err) {
            console.error("JSON Parse error during backup import", err);
            alert("Import failed: Selected file is not a valid JSON document.");
        }
    };
    reader.readAsText(file);
    // Reset file input value so upload can be triggered on same file if needed
    event.target.value = '';
};

const initializeBackupEngine = () => {
    document.getElementById('export-backup-btn').addEventListener('click', exportStateBackup);
    document.getElementById('import-backup-btn').addEventListener('click', triggerImportFileInput);
    document.getElementById('import-file-input').addEventListener('change', importStateBackup);
};

// --- ACTIVITY & COMPLETION HELPERS ---
const getActivityStatus = (lastActivityAt) => {
    if (!lastActivityAt) return 'red';
    const diffHours = (Date.now() - new Date(lastActivityAt)) / 3600000;
    if (diffHours <= 24) return 'green';
    if (diffHours <= 72) return 'yellow';
    return 'red';
};

const checkProjectCompletion = (project) => {
    if (!project.subBoard || project.subBoard.tasks.length === 0) {
        project.status = 'active';
        return;
    }
    const doneCols = project.subBoard.columns.filter(c => c.classification === 'archive').map(c => c.id);
    const allDone = project.subBoard.tasks.every(t => doneCols.includes(t.columnId));
    if (allDone && project.status !== 'completed') {
        project.status = 'completed';
        const reviewCol = columns.find(c => c.classification === 'qa');
        const archiveCols = columns.filter(c => c.classification === 'archive').map(c => c.id);
        if (reviewCol && !archiveCols.includes(project.columnId)) {
            project.columnId = reviewCol.id;
        }
    } else if (!allDone) {
        project.status = 'active';
    }
};

// --- VIEW SWITCHING ---
const switchView = (view) => {
    currentView = view;
    const mainEls = [
        document.querySelector('.dashboard-header'),
        document.querySelector('.controls-row'),
        document.getElementById('column-summary-bar'),
        document.querySelector('.kpi-container'),
        document.getElementById('board-canvas'),
        document.getElementById('main-calendar-section')
    ];
    const subView = document.getElementById('sub-board-view');

    if (view === 'main') {
        mainEls.forEach(el => el && (el.style.display = ''));
        subView.style.display = 'none';
    } else {
        mainEls.forEach(el => el && (el.style.display = 'none'));
        subView.style.display = 'flex';
        subView.setAttribute('data-project-id', view);
        renderSubBoard(view);
    }
    renderSidebarProjects();
};

// --- SIDEBAR PROJECTS LIST ---
const renderSidebarProjects = () => {
    const container = document.getElementById('sidebar-projects-list');
    if (!container) return;
    container.innerHTML = '';

    if (projects.length === 0) {
        container.innerHTML = `<div style="font-size:10px;color:var(--text-muted);padding:6px 12px;">No projects yet</div>`;
        return;
    }

    projects.forEach(proj => {
        const tasks = proj.subBoard?.tasks || [];
        const doneCols = (proj.subBoard?.columns || []).filter(c => c.classification === 'archive').map(c => c.id);
        const done = tasks.filter(t => doneCols.includes(t.columnId)).length;

        const item = document.createElement('a');
        item.href = '#';
        item.classList.add('nav-item', 'project-nav-item');
        if (currentView === proj.id) item.classList.add('active');
        item.setAttribute('data-proj-id', proj.id);
        item.innerHTML = `
            <i data-lucide="layout-dashboard"></i>
            <span>${proj.clientName}</span>
            <span class="project-nav-badge">${done}/${tasks.length}</span>
        `;
        item.addEventListener('click', e => { e.preventDefault(); switchView(proj.id); });
        container.appendChild(item);
    });
    lucide.createIcons();
};

// --- SUB-BOARD RENDERING ---
const renderSubBoard = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    document.getElementById('sub-board-project-title').textContent = project.clientName;
    document.getElementById('sub-board-project-brief').textContent = project.brief || project.notes || '';

    const canvas = document.getElementById('sub-board-canvas');
    canvas.innerHTML = '';

    const { columns: subCols } = project.subBoard;
    const tasks = project.subBoard.tasks.filter(t => showArchivedTasks ? true : !t.archived);

    subCols.forEach(col => {
        const colTasks = tasks.filter(t => t.columnId === col.id);
        const iconMap = { pipeline: 'inbox', technical: 'zap', qa: 'eye', archive: 'check-circle' };
        const icon = iconMap[col.classification] || 'layers';

        const colEl = document.createElement('div');
        colEl.classList.add('kanban-column', `class-${col.classification}`);
        colEl.setAttribute('data-column-id', col.id);

        const totalDone = tasks.filter(t => {
            const dc = subCols.find(c => c.classification === 'archive');
            return dc && t.columnId === dc.id;
        }).length;
        const progress = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;

        colEl.innerHTML = `
            <div class="column-header">
                <div class="header-top-row">
                    <div class="column-title-group">
                        <i data-lucide="${icon}" class="column-class-icon"></i>
                        <h2>${col.name}</h2>
                        <span class="card-count">${colTasks.length}</span>
                    </div>
                    <div class="column-header-actions">
                        <button type="button" title="Edit column" onclick="openSubColumnModal('${col.id}','${projectId}',event)">
                            <i data-lucide="sliders"></i>
                        </button>
                        <button type="button" title="Add task" onclick="openTaskModal(null,'${col.id}','${projectId}',event)">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
                <div class="column-progress-wrapper">
                    <div class="column-progress-bar" style="width:${progress}%"></div>
                </div>
            </div>
            <div class="column-body" id="sub-col-${col.id}"></div>
        `;

        const body = colEl.querySelector('.column-body');
        if (colTasks.length > 0) {
            colTasks.forEach(task => body.appendChild(createTaskCardDOM(task, col.classification, projectId)));
        } else {
            body.innerHTML = `<div class="empty-placeholder"><i data-lucide="folder-open"></i><span>No tasks</span></div>`;
        }
        canvas.appendChild(colEl);
    });

    // Add-column placeholder
    const adder = document.createElement('div');
    adder.classList.add('board-column-adder-box');
    adder.innerHTML = `<div class="adder-content"><i data-lucide="plus-square"></i><span>Add Column</span></div>`;
    adder.addEventListener('click', () => openSubColumnModal(null, projectId, null));
    canvas.appendChild(adder);

    initializeSubBoardDragDrop(projectId);
    renderSubCalendar(projectId);
    lucide.createIcons();
};

// --- TASK CARD DOM ---
const createTaskCardDOM = (task, colClassification, projectId) => {
    const card = document.createElement('div');
    card.classList.add('project-card');
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', task.id);

    const pClass = `tag-${(task.priority || 'medium').toLowerCase()}`;
    const urgency = getUrgency(task.deadline, colClassification);
    const dlClass = urgency === 'urgent' ? 'deadline-urgent' : urgency === 'warning' ? 'deadline-warning' : '';
    const dlText = colClassification === 'archive' ? 'Done' : formatDateDisplay(task.deadline);

    card.innerHTML = `
        <div class="card-header-row">
            <h4 class="card-title" style="font-size:13px;">${task.title}</h4>
            <span class="card-priority-tag ${pClass}">${task.priority || 'Medium'}</span>
        </div>
        ${task.description ? `<p class="card-description">${task.description}</p>` : ''}
        <div class="card-footer">
            <span class="card-deadline ${dlClass}">${dlText}</span>
        </div>
    `;

    card.addEventListener('click', e => { if (!card.classList.contains('dragging')) openTaskModal(task.id, null, projectId, e); });
    card.addEventListener('dragstart', e => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', `task::${task.id}::${projectId}`); e.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    return card;
};

// --- SUB-BOARD DRAG & DROP ---
const initializeSubBoardDragDrop = (projectId) => {
    document.querySelectorAll('#sub-board-canvas .column-body').forEach(body => {
        const col = body.parentElement;
        const colId = col.getAttribute('data-column-id');

        body.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        body.addEventListener('dragenter', e => { e.preventDefault(); col.classList.add('drag-over'); });
        body.addEventListener('dragleave', () => col.classList.remove('drag-over'));
        body.addEventListener('drop', e => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const raw = e.dataTransfer.getData('text/plain');
            if (!raw.startsWith('task::')) return;
            const [, taskId, tProjId] = raw.split('::');
            if (tProjId !== projectId) return;
            const project = projects.find(p => p.id === projectId);
            const task = project?.subBoard.tasks.find(t => t.id === taskId);
            if (task && task.columnId !== colId) {
                task.columnId = colId;
                project.lastActivityAt = new Date().toISOString();
                checkProjectCompletion(project);
                saveState();
                renderSubBoard(projectId);
                renderBoard();
                calculateKPIs();
            }
        });
    });
};

// --- TASK MODAL ---
window.openTaskModal = (taskId = null, defaultColId = null, projectId, event = null) => {
    if (event) event.stopPropagation();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const modal = document.getElementById('task-modal');
    document.getElementById('task-form').reset();

    const colSel = document.getElementById('task-col-id-input');
    colSel.innerHTML = '';
    project.subBoard.columns.forEach(col => {
        const o = document.createElement('option');
        o.value = col.id; o.textContent = col.name;
        if (col.id === defaultColId) o.selected = true;
        colSel.appendChild(o);
    });

    if (taskId) {
        const task = project.subBoard.tasks.find(t => t.id === taskId);
        if (!task) return;
        document.getElementById('task-modal-title').textContent = 'Edit Task';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-project-id').value = projectId;
        document.getElementById('task-title-input').value = task.title;
        document.getElementById('task-description-input').value = task.description || '';
        document.getElementById('task-priority-input').value = task.priority || 'Medium';
        document.getElementById('task-deadline-input').value = task.deadline || '';
        document.getElementById('task-col-id-input').value = task.columnId;
        document.getElementById('delete-task-btn').style.display = 'inline-flex';
        document.getElementById('archive-task-btn').style.display = 'inline-flex';
        document.getElementById('archive-task-label').textContent = task.archived ? 'Unarchive' : 'Archive';
    } else {
        document.getElementById('task-modal-title').textContent = 'New Task';
        document.getElementById('task-id').value = '';
        document.getElementById('task-project-id').value = projectId;
        document.getElementById('delete-task-btn').style.display = 'none';
        document.getElementById('archive-task-btn').style.display = 'none';
    }
    modal.classList.add('active');
    lucide.createIcons();
};

const closeTaskModal = () => document.getElementById('task-modal').classList.remove('active');

const saveTaskData = () => {
    const taskId = document.getElementById('task-id').value;
    const projectId = document.getElementById('task-project-id').value;
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-description-input').value.trim();
    const priority = document.getElementById('task-priority-input').value;
    const deadline = document.getElementById('task-deadline-input').value;
    const colId = document.getElementById('task-col-id-input').value;
    if (!title || !projectId) return;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (taskId) {
        const idx = project.subBoard.tasks.findIndex(t => t.id === taskId);
        if (idx !== -1) project.subBoard.tasks[idx] = { ...project.subBoard.tasks[idx], title, description, priority, deadline, columnId: colId };
    } else {
        project.subBoard.tasks.push({ id: `task-${Date.now()}`, title, description, priority, deadline, columnId: colId, createdAt: new Date().toISOString() });
    }
    project.lastActivityAt = new Date().toISOString();
    checkProjectCompletion(project);
    saveState();
    closeTaskModal();
    renderSubBoard(projectId);
    renderBoard();
    calculateKPIs();
};

const deleteTask = () => {
    const taskId = document.getElementById('task-id').value;
    const projectId = document.getElementById('task-project-id').value;
    const project = projects.find(p => p.id === projectId);
    if (!project || !taskId) return;
    if (confirm('Delete this task?')) {
        project.subBoard.tasks = project.subBoard.tasks.filter(t => t.id !== taskId);
        project.lastActivityAt = new Date().toISOString();
        checkProjectCompletion(project);
        saveState();
        closeTaskModal();
        renderSubBoard(projectId);
        renderBoard();
        calculateKPIs();
    }
};

const archiveTask = () => {
    const taskId    = document.getElementById('task-id').value;
    const projectId = document.getElementById('task-project-id').value;
    const project   = projects.find(p => p.id === projectId);
    const task      = project?.subBoard.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.archived = !task.archived;
    project.lastActivityAt = new Date().toISOString();
    saveState();
    closeTaskModal();
    renderSubBoard(projectId);
    renderMainCalendar();
};

const initializeTaskModalListeners = () => {
    document.getElementById('task-modal-close-btn').addEventListener('click', closeTaskModal);
    document.getElementById('task-cancel-btn').addEventListener('click', closeTaskModal);
    document.getElementById('delete-task-btn').addEventListener('click', deleteTask);
    document.getElementById('archive-task-btn').addEventListener('click', archiveTask);
    document.getElementById('task-form').addEventListener('submit', e => { e.preventDefault(); saveTaskData(); });
    document.getElementById('task-modal').addEventListener('click', e => { if (e.target === document.getElementById('task-modal')) closeTaskModal(); });
};

// --- SUB-BOARD COLUMN MODAL ---
window.openSubColumnModal = (colId = null, projectId, event = null) => {
    if (event) event.stopPropagation();
    subBoardModalProjectId = projectId;
    openColumnModal(colId, event);
};

// --- NEW PROJECT MODAL ---
const openNewProjectModal = () => {
    const modal = document.getElementById('new-project-modal');
    document.getElementById('new-project-form').reset();
    const sel = document.getElementById('new-proj-column');
    sel.innerHTML = '';
    columns.forEach(col => {
        const o = document.createElement('option');
        o.value = col.id; o.textContent = col.name;
        sel.appendChild(o);
    });
    modal.classList.add('active');
    lucide.createIcons();
};

const closeNewProjectModal = () => document.getElementById('new-project-modal').classList.remove('active');

const createNewProject = () => {
    const title = document.getElementById('new-proj-title').value.trim();
    const brief = document.getElementById('new-proj-brief').value.trim();
    const priority = document.getElementById('new-proj-priority').value;
    const deadline = document.getElementById('new-proj-deadline').value;
    const columnId = document.getElementById('new-proj-column').value || columns[0]?.id;
    if (!title) return;

    const projId = `proj-${Date.now()}`;
    projects.push({
        id: projId,
        clientName: title,
        brief,
        techStack: [],
        outreachStatus: 'None',
        priority,
        automationLive: false,
        deadline,
        nextAction: '',
        notes: brief,
        columnId,
        checklist: [],
        customFields: [],
        subBoard: { columns: makeDefaultSubColumns(projId), tasks: [] },
        lastActivityAt: null,
        status: 'active',
        archived: false
    });
    saveState();
    closeNewProjectModal();
    renderBoard();
    calculateKPIs();
    renderSidebarProjects();
    switchView(projId);
};

const initializeNewProjectModalListeners = () => {
    document.getElementById('add-card-btn').addEventListener('click', openNewProjectModal);
    document.getElementById('new-project-modal-close-btn').addEventListener('click', closeNewProjectModal);
    document.getElementById('new-project-cancel-btn').addEventListener('click', closeNewProjectModal);
    document.getElementById('new-project-form').addEventListener('submit', e => { e.preventDefault(); createNewProject(); });
    document.getElementById('new-project-modal').addEventListener('click', e => { if (e.target === document.getElementById('new-project-modal')) closeNewProjectModal(); });
};

// --- CALENDAR RENDERING ---
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const renderCalendarGrid = (gridId, items, year, month) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const firstDow   = new Date(year, month, 1).getDay();
    const daysInMon  = new Date(year, month + 1, 0).getDate();
    const todayObj   = new Date();
    const isThisMonth = todayObj.getFullYear() === year && todayObj.getMonth() === month;
    const todayDate  = todayObj.getDate();

    // Group items by YYYY-MM-DD
    const byDate = {};
    items.forEach(item => {
        if (!item.date) return;
        byDate[item.date] = byDate[item.date] || [];
        byDate[item.date].push(item);
    });

    const priorityColor = (p) => {
        if (p === 'High')   return '#ef4444';
        if (p === 'Medium') return '#f97316';
        return '#6b7280';
    };

    let html = `<div class="cal-grid">`;
    DAY_NAMES.forEach(d => { html += `<div class="cal-day-header">${d}</div>`; });

    for (let i = 0; i < firstDow; i++) html += `<div class="cal-day cal-empty"></div>`;

    for (let d = 1; d <= daysInMon; d++) {
        const dateStr  = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday  = isThisMonth && d === todayDate;
        const dayItems = byDate[dateStr] || [];

        const labelsHTML = dayItems.slice(0, 3).map(item => {
            const c = priorityColor(item.priority);
            const onc = item.onClick ? `onclick="${item.onClick}"` : '';
            const label = item.label.length > 14 ? item.label.slice(0, 13) + '…' : item.label;
            return `<div class="cal-label" style="background:${c}18;border-color:${c}38;color:${c};" title="${item.label}" ${onc}>${label}</div>`;
        }).join('');
        const moreHTML = dayItems.length > 3 ? `<div class="cal-label-more">+${dayItems.length - 3} more</div>` : '';

        html += `<div class="cal-day ${isToday ? 'cal-today' : ''}">
            <span class="cal-day-num">${d}</span>
            <div class="cal-items">${labelsHTML}${moreHTML}</div>
        </div>`;
    }

    html += `</div>`;
    grid.innerHTML = html;
    lucide.createIcons();
};

const renderMainCalendar = () => {
    const label = document.getElementById('main-cal-label');
    if (label) label.textContent = `${MONTH_NAMES[mainCalMonth]} ${mainCalYear}`;

    const items = projects
        .filter(p => !p.archived && p.deadline)
        .map(p => ({
            date:     p.deadline,
            label:    p.clientName,
            priority: p.priority,
            onClick:  `switchView('${p.id}')`
        }));

    renderCalendarGrid('main-calendar-grid', items, mainCalYear, mainCalMonth);
};

const renderSubCalendar = (projectId) => {
    const label = document.getElementById('sub-cal-label');
    if (label) label.textContent = `${MONTH_NAMES[subCalMonth]} ${subCalYear}`;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const items = (project.subBoard?.tasks || [])
        .filter(t => !t.archived && t.deadline)
        .map(t => ({
            date:     t.deadline,
            label:    t.title,
            priority: t.priority
        }));

    renderCalendarGrid('sub-calendar-grid', items, subCalYear, subCalMonth);
};

// --- SIDEBAR COLLAPSE TOGGLE ---
const initializeSidebarToggle = () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const showBtn = document.getElementById('sidebar-show-btn');

    const collapse = () => {
        sidebar.classList.add('collapsed');
        showBtn.classList.add('visible');
        localStorage.setItem('sidebar_collapsed', '1');
        lucide.createIcons();
    };

    const expand = () => {
        sidebar.classList.remove('collapsed');
        showBtn.classList.remove('visible');
        localStorage.setItem('sidebar_collapsed', '0');
        lucide.createIcons();
    };

    toggleBtn.addEventListener('click', collapse);
    showBtn.addEventListener('click', expand);

    // Restore saved state
    if (localStorage.getItem('sidebar_collapsed') === '1') collapse();
};

// --- INITIALIZE APPLICATION ENGINE ---
document.addEventListener('DOMContentLoaded', () => {
    migrateAndLoadState();
    calculateKPIs();
    renderBoard();
    renderColumnSummary();
    renderSidebarProjects();

    initializeControls();
    initializeColumnModalListeners();
    initializeCardModalChips();
    initializeAddToolChip();
    initializeCardModalListeners();
    initializeBackupEngine();
    initializeSidebarToggle();
    initializeTaskModalListeners();
    initializeNewProjectModalListeners();

    // Sub-board back button
    document.getElementById('sub-board-back-btn').addEventListener('click', () => switchView('main'));

    // Sub-board add task button
    document.getElementById('sub-add-task-btn').addEventListener('click', () => {
        const projId = document.getElementById('sub-board-view').getAttribute('data-project-id');
        if (!projId) return;
        const project = projects.find(p => p.id === projId);
        const firstCol = project?.subBoard?.columns[0]?.id || null;
        openTaskModal(null, firstCol, projId, null);
    });

    // Sub-board add column button
    document.getElementById('sub-add-column-btn').addEventListener('click', () => {
        const projId = document.getElementById('sub-board-view').getAttribute('data-project-id');
        if (projId) openSubColumnModal(null, projId, null);
    });

    // Kanban Board nav item → go back to main
    document.getElementById('nav-kanban-board').addEventListener('click', e => {
        e.preventDefault();
        switchView('main');
    });

    // Show / hide archived projects toggle
    document.getElementById('show-archived-btn').addEventListener('click', () => {
        showArchivedProjects = !showArchivedProjects;
        document.getElementById('show-archived-btn').classList.toggle('active-toggle', showArchivedProjects);
        renderBoard();
        calculateKPIs();
    });

    // Show / hide archived tasks toggle
    document.getElementById('show-archived-tasks-btn').addEventListener('click', () => {
        showArchivedTasks = !showArchivedTasks;
        document.getElementById('show-archived-tasks-btn').classList.toggle('active-toggle', showArchivedTasks);
        const projId = document.getElementById('sub-board-view').getAttribute('data-project-id');
        if (projId) renderSubBoard(projId);
    });

    // Main calendar navigation
    document.getElementById('main-cal-prev').addEventListener('click', () => {
        mainCalMonth--;
        if (mainCalMonth < 0) { mainCalMonth = 11; mainCalYear--; }
        renderMainCalendar();
    });
    document.getElementById('main-cal-next').addEventListener('click', () => {
        mainCalMonth++;
        if (mainCalMonth > 11) { mainCalMonth = 0; mainCalYear++; }
        renderMainCalendar();
    });

    // Sub-board calendar navigation
    document.getElementById('sub-cal-prev').addEventListener('click', () => {
        subCalMonth--;
        if (subCalMonth < 0) { subCalMonth = 11; subCalYear--; }
        const projId = document.getElementById('sub-board-view').getAttribute('data-project-id');
        if (projId) renderSubCalendar(projId);
    });
    document.getElementById('sub-cal-next').addEventListener('click', () => {
        subCalMonth++;
        if (subCalMonth > 11) { subCalMonth = 0; subCalYear++; }
        const projId = document.getElementById('sub-board-view').getAttribute('data-project-id');
        if (projId) renderSubCalendar(projId);
    });
});
