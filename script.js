/**
 * Dashboard de Tarefas - Suno United Creators
 * 
 * Funcionalidades implementadas:
 * - Layout otimizado para foco no Gantt
 * - Controles de zoom temporal (+/-)
 * - Visualização inicial na semana atual
 * - Barras COMPLETAMENTE FIXAS (não movíveis)
 * - Design moderno da Suno
 */

// Gerenciamento de abas
function initTabs() {
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      button.classList.add('active');
      const targetTab = button.getAttribute('data-tab');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// Variáveis globais
let timeline = null;
let allData = [];
let filteredData = [];
let currentZoomLevel = 2; // 0=Horas, 1=Dias, 2=Semanas, 3=Meses

const zoomLevels = [
  { name: 'Horas', scale: 'hour', step: 4 },
  { name: 'Dias', scale: 'day', step: 1 },
  { name: 'Semanas', scale: 'week', step: 1 },
  { name: 'Meses', scale: 'month', step: 1 }
];

// Dados de exemplo para teste (caso o arquivo JSON não carregue)
const exemplosDados = [
  {
    TaskID: "TASK001",
    TaskTitle: "Criação de Logo Institucional",
    ClientNickname: "Empresa Alpha",
    TaskOwnerDisplayName: "João Silva",
    TaskOwnerUserFunctionTitle: "Designer Gráfico",
    RequestTypeName: "Design Gráfico",
    TaskCreationDate: "2025-06-27T09:00:00",
    CurrentDueDate: "2025-07-05T17:00:00",
    PipelineStepTitle: "Em Produção",
    ParentTaskID: null,
    JobNumber: "JOB001",
    ModificationDate: "2025-06-27T14:30:00"
  },
  {
    TaskID: "TASK002",
    TaskTitle: "Revisão de Conceito - Logo",
    ClientNickname: "Empresa Alpha",
    TaskOwnerDisplayName: "João Silva",
    TaskOwnerUserFunctionTitle: "Designer Gráfico",
    RequestTypeName: "Design Gráfico",
    TaskCreationDate: "2025-06-28T10:00:00",
    CurrentDueDate: "2025-06-30T16:00:00",
    PipelineStepTitle: "Revisão",
    ParentTaskID: "TASK001", // ✅ SUBTAREFA
    JobNumber: "JOB001",
    ModificationDate: "2025-06-27T11:00:00"
  },
  {
    TaskID: "TASK003",
    TaskTitle: "Desenvolvimento Website Corporativo",
    ClientNickname: "Empresa Beta",
    TaskOwnerDisplayName: "Maria Santos",
    TaskOwnerUserFunctionTitle: "Desenvolvedora Front-end",
    RequestTypeName: "Desenvolvimento Web",
    TaskCreationDate: "2025-06-25T08:00:00",
    CurrentDueDate: "2025-07-15T18:00:00",
    PipelineStepTitle: "Em Desenvolvimento",
    ParentTaskID: null,
    JobNumber: "JOB002",
    ModificationDate: "2025-06-27T09:15:00"
  },
  {
    TaskID: "TASK004",
    TaskTitle: "Estrutura HTML Base",
    ClientNickname: "Empresa Beta",
    TaskOwnerDisplayName: "Maria Santos",
    TaskOwnerUserFunctionTitle: "Desenvolvedora Front-end",
    RequestTypeName: "Desenvolvimento Web",
    TaskCreationDate: "2025-06-26T09:00:00",
    CurrentDueDate: "2025-06-29T17:00:00",
    PipelineStepTitle: "Concluído",
    ParentTaskID: "TASK003", // ✅ SUBTAREFA
    JobNumber: "JOB002",
    ModificationDate: "2025-06-27T16:00:00"
  },
  {
    TaskID: "TASK005",
    TaskTitle: "Criação de Mockups Mobile",
    ClientNickname: "Startup Gamma",
    TaskOwnerDisplayName: "Pedro Costa",
    TaskOwnerUserFunctionTitle: "UI/UX Designer",
    RequestTypeName: "Design UI/UX",
    TaskCreationDate: "2025-06-27T09:30:00",
    CurrentDueDate: "2025-07-08T17:30:00",
    PipelineStepTitle: "Iniciado",
    ParentTaskID: null,
    JobNumber: "JOB003",
    ModificationDate: "2025-06-27T16:45:00"
  },
  {
    TaskID: "TASK006",
    TaskTitle: "Pesquisa de Usuário",
    ClientNickname: "Startup Gamma",
    TaskOwnerDisplayName: "Pedro Costa",
    TaskOwnerUserFunctionTitle: "UI/UX Designer",
    RequestTypeName: "Design UI/UX",
    TaskCreationDate: "2025-06-28T10:00:00",
    CurrentDueDate: "2025-07-02T15:00:00",
    PipelineStepTitle: "Em Análise",
    ParentTaskID: "TASK005", // ✅ SUBTAREFA
    JobNumber: "JOB003",
    ModificationDate: "2025-06-27T14:20:00"
  },
  {
    TaskID: "TASK007",
    TaskTitle: "Campanha Publicitária Digital",
    ClientNickname: "E-commerce Delta",
    TaskOwnerDisplayName: "Ana Oliveira",
    TaskOwnerUserFunctionTitle: "Especialista em Marketing",
    RequestTypeName: "Marketing Digital",
    TaskCreationDate: "2025-06-26T11:00:00",
    CurrentDueDate: "2025-07-10T19:00:00",
    PipelineStepTitle: "Planejamento",
    ParentTaskID: null,
    JobNumber: "JOB004",
    ModificationDate: "2025-06-27T10:30:00"
  },
  {
    TaskID: "TASK008",
    TaskTitle: "Criação de Posts Redes Sociais",
    ClientNickname: "E-commerce Delta",
    TaskOwnerDisplayName: "João Silva",
    TaskOwnerUserFunctionTitle: "Designer Gráfico",
    RequestTypeName: "Design Gráfico",
    TaskCreationDate: "2025-06-27T14:00:00",
    CurrentDueDate: "2025-07-03T16:00:00",
    PipelineStepTitle: "Em Produção",
    ParentTaskID: "TASK007", // ✅ SUBTAREFA
    JobNumber: "JOB004",
    ModificationDate: "2025-06-27T13:15:00"
  },
  {
    TaskID: "TASK009",
    TaskTitle: "Análise de Concorrência",
    ClientNickname: "Consultoria Epsilon",
    TaskOwnerDisplayName: "Carlos Ferreira",
    TaskOwnerUserFunctionTitle: "Analista de Negócios",
    RequestTypeName: "Consultoria",
    TaskCreationDate: "2025-06-27T08:00:00",
    CurrentDueDate: "2025-07-01T18:00:00",
    PipelineStepTitle: "Em Andamento",
    ParentTaskID: null,
    JobNumber: "JOB005",
    ModificationDate: "2025-06-27T17:00:00"
  },
  {
    TaskID: "TASK010",
    TaskTitle: "Relatório de Insights",
    ClientNickname: "Consultoria Epsilon",
    TaskOwnerDisplayName: "Carlos Ferreira",
    TaskOwnerUserFunctionTitle: "Analista de Negócios",
    RequestTypeName: "Consultoria",
    TaskCreationDate: "2025-06-28T09:00:00",
    CurrentDueDate: "2025-07-04T17:00:00",
    PipelineStepTitle: "Planejado",
    ParentTaskID: "TASK009", // ✅ SUBTAREFA
    JobNumber: "JOB005",
    ModificationDate: "2025-06-27T15:45:00"
  }
];

// Inicializar controles de zoom
function initZoomControls() {
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const currentViewSpan = document.getElementById('current-view');
  
  // Atualizar display do zoom atual
  function updateZoomDisplay() {
    currentViewSpan.textContent = zoomLevels[currentZoomLevel].name;
  }
  
  // Zoom in (mais detalhado)
  zoomInBtn.addEventListener('click', () => {
    if (currentZoomLevel > 0) {
      currentZoomLevel--;
      updateZoomDisplay();
      updateTimelineZoom();
      console.log(`🔍 Zoom in: ${zoomLevels[currentZoomLevel].name}`);
    }
  });
  
  // Zoom out (menos detalhado)
  zoomOutBtn.addEventListener('click', () => {
    if (currentZoomLevel < zoomLevels.length - 1) {
      currentZoomLevel++;
      updateZoomDisplay();
      updateTimelineZoom();
      console.log(`🔍 Zoom out: ${zoomLevels[currentZoomLevel].name}`);
    }
  });
  
  // Inicializar display
  updateZoomDisplay();
}

// Atualizar zoom do timeline
function updateTimelineZoom() {
  if (!timeline) return;
  
  const currentLevel = zoomLevels[currentZoomLevel];
  const now = new Date();
  
  let start, end;
  
  switch (currentLevel.scale) {
    case 'hour':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 12);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 12);
      break;
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
      break;
    case 'week':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 3, 1);
      break;
  }
  
  timeline.setWindow(start, end);
}

// Calcular semana atual para visualização inicial
function getCurrentWeekRange() {
  const now = new Date();
  const startOfWeek = new Date(now);
  const endOfWeek = new Date(now);
  
  // Início da semana (segunda-feira)
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(now.getDate() - daysToMonday - 7); // 1 semana antes
  
  // Fim da semana (domingo) + 2 semanas
  endOfWeek.setDate(startOfWeek.getDate() + 28); // 4 semanas totais
  
  return { start: startOfWeek, end: endOfWeek };
}

async function loadData() {
  try {
    console.log('🚀 Carregando dados...');
    
    // Tentar carregar dados do arquivo
    try {
      const response = await fetch('./dados/dados.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      allData = JSON.parse(text);
      console.log('✅ Dados carregados do arquivo JSON:', allData.length, 'registros');
      
    } catch (fetchError) {
      console.warn('⚠️ Arquivo JSON não encontrado, usando dados de exemplo...');
      allData = exemplosDados;
      console.log('📋 Dados de exemplo carregados:', allData.length, 'registros');
    }
    
    // Análise de dados
    const taskIds = allData.map(item => item.TaskID).filter(Boolean);
    const uniqueTaskIds = [...new Set(taskIds)];
    console.log(`📊 TaskIDs únicos: ${uniqueTaskIds.length} de ${taskIds.length} registros`);
    
    populateFilters();
    updateStats();
    filterAndRenderData();
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    showError(`Erro ao carregar os dados: ${error.message}`);
  }
}

function populateFilters() {
  // Filtro de cliente
  const clientFilter = document.getElementById('clientFilter');
  const clients = [...new Set(allData.map(item => item.ClientNickname))].filter(Boolean).sort();

  clientFilter.innerHTML = '<option value="">Todos</option>';
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client;
    option.textContent = client;
    clientFilter.appendChild(option);
  });

  // Filtro de responsável
  const ownerFilter = document.getElementById('ownerFilter');
  const owners = [...new Set(allData.map(item => item.TaskOwnerDisplayName))].filter(Boolean).sort();

  ownerFilter.innerHTML = '<option value="">Todos</option>';
  owners.forEach(owner => {
    const option = document.createElement('option');
    option.value = owner;
    option.textContent = owner;
    ownerFilter.appendChild(option);
  });

  // Event listeners
  clientFilter.addEventListener('change', filterAndRenderData);
  ownerFilter.addEventListener('change', filterAndRenderData);
}

function updateStats() {
  // Consolidar dados por TaskID para contar tarefas únicas
  const uniqueTasks = new Map();
  allData.forEach(item => {
    const taskId = item.TaskID;
    if (taskId && !uniqueTasks.has(taskId)) {
      uniqueTasks.set(taskId, item);
    }
  });
  
  const totalTasks = uniqueTasks.size;
  const activeProjects = [...new Set(allData.map(item => item.JobNumber))].filter(Boolean).length;

  document.getElementById('total-tasks').textContent = totalTasks;
  document.getElementById('active-projects').textContent = activeProjects;
}

function filterAndRenderData() {
  const clientFilter = document.getElementById('clientFilter').value;
  const ownerFilter = document.getElementById('ownerFilter').value;

  filteredData = allData.filter(item => {
    if (clientFilter && item.ClientNickname !== clientFilter) return false;
    if (ownerFilter && item.TaskOwnerDisplayName !== ownerFilter) return false;
    return true;
  });

  // Contar tarefas únicas nos dados filtrados
  const uniqueFilteredTasks = new Map();
  filteredData.forEach(item => {
    const taskId = item.TaskID;
    if (taskId) {
      uniqueFilteredTasks.set(taskId, item);
    }
  });

  console.log(`🔍 Dados filtrados: ${filteredData.length} registros (${uniqueFilteredTasks.size} tarefas únicas)`);
  renderGanttChart();
}

function renderGanttChart() {
  const container = document.getElementById('gantt-container');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');
  const errorMessage = document.getElementById('error-message');

  // Limpar erro anterior
  errorMessage.style.display = 'none';

  if (filteredData.length === 0) {
    loading.style.display = 'none';
    container.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  try {
    // Criar grupos (responsáveis)
    const groups = [...new Set(filteredData.map(item => item.TaskOwnerDisplayName))]
      .filter(Boolean)
      .sort()
      .map(name => ({ 
        id: name, 
        content: name,
        className: 'group-label'
      }));

    console.log('👥 Grupos criados:', groups.length);

    // Consolidar dados por TaskID para evitar duplicatas
    const taskMap = new Map();
    
    filteredData.forEach((item, index) => {
      const taskId = item.TaskID || `task-${index}`;
      
      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, item);
      } else {
        // Se já existe, manter o item mais recente
        const existing = taskMap.get(taskId);
        const existingModDate = new Date(existing.ModificationDate || existing.TaskCreationDate);
        const currentModDate = new Date(item.ModificationDate || item.TaskCreationDate);
        
        if (currentModDate > existingModDate) {
          taskMap.set(taskId, item);
        }
      }
    });

    console.log(`📋 Dados consolidados: ${filteredData.length} registros → ${taskMap.size} tarefas únicas`);

    // Criar items (tarefas) a partir dos dados consolidados
    const items = [];
    let itemCounter = 0;
    
    taskMap.forEach((item, taskId) => {
      try {
        // Criar ID único garantido
        const uniqueId = `item-${itemCounter}-${taskId}`;
        
        // ✅ VERIFICAÇÃO CORRETA DE SUBTAREFA
        const isSubtask = item.ParentTaskID && 
                         item.ParentTaskID !== null && 
                         item.ParentTaskID !== undefined && 
                         item.ParentTaskID !== "" &&
                         item.ParentTaskID.toString().trim() !== "";
        
        const className = isSubtask ? 'subtarefa' : 'tarefa';
        const tipo = isSubtask ? 'Subtarefa' : 'Tarefa Principal';
        const prefix = isSubtask ? '├─ ' : '📋 '; // ✅ PREFIXO VISUAL

        // Tratar datas
        let startDate, endDate;
        
        try {
          startDate = new Date(item.TaskCreationDate);
          endDate = new Date(item.CurrentDueDate);
          
          // Verificar se as datas são válidas
          if (isNaN(startDate.getTime())) {
            console.warn('⚠️ Data de início inválida para tarefa:', taskId);
            startDate = new Date(); // usar data atual como fallback
          }
          
          if (isNaN(endDate.getTime())) {
            console.warn('⚠️ Data de fim inválida para tarefa:', taskId);
            endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 dias após início
          }
          
          // Garantir que a data de fim seja após a de início
          if (endDate <= startDate) {
            endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000)); // 1 dia após início
          }
        } catch (dateError) {
          console.error('❌ Erro ao processar datas para tarefa:', taskId, dateError);
          startDate = new Date();
          endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        }

        const taskItem = {
          id: uniqueId,
          group: item.TaskOwnerDisplayName || 'Sem responsável',
          content: `${prefix}${item.ClientNickname || 'N/A'} | ${item.RequestTypeName || 'N/A'} | ${item.TaskTitle || 'Sem título'}`,
          start: startDate,
          end: endDate,
          className: className,
          title: `
            <strong>${item.TaskTitle || 'Sem título'}</strong><br>
            <strong>Tipo:</strong> ${tipo}<br>
            ${isSubtask ? `<strong>Tarefa Principal:</strong> ${item.ParentTaskID}<br>` : ''}
            <strong>Cliente:</strong> ${item.ClientNickname || 'N/A'}<br>
            <strong>Responsável:</strong> ${item.TaskOwnerDisplayName || 'N/A'}<br>
            <strong>Função:</strong> ${item.TaskOwnerUserFunctionTitle || 'N/A'}<br>
            <strong>Categoria:</strong> ${item.RequestTypeName || 'N/A'}<br>
            <strong>Task ID:</strong> ${taskId}<br>
            <strong>Status:</strong> ${item.PipelineStepTitle || 'N/A'}<br>
            <strong>Início:</strong> ${startDate.toLocaleDateString('pt-BR')}<br>
            <strong>Prazo:</strong> ${endDate.toLocaleDateString('pt-BR')}
          `.trim()
        };

        items.push(taskItem);
        itemCounter++;
        
      } catch (itemError) {
        console.error(`❌ Erro ao processar item ${taskId}:`, itemError, item);
      }
    });

    console.log('📊 Total de items criados:', items.length);

    if (items.length === 0) {
      throw new Error('Nenhum item válido foi criado a partir dos dados');
    }

    // Obter range da semana atual
    const weekRange = getCurrentWeekRange();

    // ========== OPÇÕES DO TIMELINE CENTRALIZADAS ==========
    function getTimelineOptions(weekRange) {
      return {
        // Layout básico
        width: '100%',
        height: '100%',
        orientation: 'top',
        // Timeline
        showMajorLabels: true,
        showMinorLabels: true,
        showCurrentTime: true,
        // Navegação permitida
        zoomable: true,
        moveable: true,
        // BARRAS FIXAS (NÃO MOVÍVEIS)
        editable: false,                    // Desabilita toda edição
        selectable: true,                   // Permite seleção
        multiselect: false,                 // Seleção única
        itemsAlwaysDraggable: false,        // Nunca arrastar
        // Layout dos items
        stack: true,
        // Tooltips
        showTooltips: true,
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap'
        },
        // Margens e espaçamento
        margin: {
          item: { horizontal: 3, vertical: 1 },
          axis: 15
        },
        // Altura dos grupos
        maxHeight: '100%',
        minHeight: '100%',
        groupHeightMode: 'fixed',
        groupHeight: 25,
        // Formatação de data
        format: {
          minorLabels: {
            millisecond:'SSS',
            second:     's',
            minute:     'HH:mm',
            hour:       'HH:mm',
            weekday:    'ddd DD',
            day:        'DD',
            week:       'w',
            month:      'MMM',
            year:       'YYYY'
          },
          majorLabels: {
            millisecond:'HH:mm:ss',
            second:     'DD MMMM HH:mm',
            minute:     'ddd DD MMMM',
            hour:       'ddd DD MMMM',
            weekday:    'MMMM YYYY',
            day:        'MMMM YYYY',
            week:       'MMMM YYYY',
            month:      'YYYY',
            year:       ''
          }
        },
        // Scroll
        horizontalScroll: true,
        verticalScroll: true,
        // Janela inicial
        start: weekRange.start,
        end: weekRange.end
      };
    }
    // ========== OPÇÕES CRÍTICAS PARA BARRAS FIXAS ==========
    const options = getTimelineOptions(weekRange);

    // Destruir timeline anterior se existir
    if (timeline) {
      try {
        timeline.destroy();
        timeline = null;
      } catch (destroyError) {
        console.warn('⚠️ Erro ao destruir timeline anterior:', destroyError);
      }
    }

    // Criar novo timeline
    console.log('🚀 Criando timeline com barras FIXAS...');
    timeline = new vis.Timeline(container, items, groups, options);

    // ✅ EVENTOS BÁSICOS APENAS
    timeline.on('select', function (properties) {
      console.log('🎯 Item selecionado:', properties.items);
    });

    timeline.on('doubleClick', function (properties) {
      console.log('👆 Double click:', properties);
    });

    // Mostrar container
    loading.style.display = 'none';
    emptyState.style.display = 'none';
    container.style.display = 'block';
    
    console.log('✅ Timeline criado! Barras devem estar FIXAS agora!');

  } catch (error) {
    console.error('❌ Erro ao criar timeline:', error);
    showError(`Erro ao renderizar o gráfico: ${error.message}`);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  const loading = document.getElementById('loading');
  const container = document.getElementById('gantt-container');
  
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  loading.style.display = 'none';
  container.style.display = 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Suno Dashboard inicializando...');
  initTabs();
  initZoomControls();
  loadData();
});

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
  if (timeline) {
    try {
      timeline.destroy();
    } catch (error) {
      console.warn('⚠️ Erro ao destruir timeline:', error);
    }
    timeline = null;
  }
});

// ========== FUNÇÕES DE DEBUG ==========
window.sunoDebug = {
  getData: () => allData,
  getFilteredData: () => filteredData,
  getTimeline: () => timeline,
  getCurrentZoom: () => zoomLevels[currentZoomLevel],
  
  // Forçar recriação do timeline
  recreateTimeline: () => {
    console.log('🔄 Recriando timeline...');
    renderGanttChart();
  },
  
  // Testar com dados de exemplo
  useExampleData: () => {
    console.log('📋 Carregando dados de exemplo...');
    allData = exemplosDados;
    populateFilters();
    updateStats();
    filterAndRenderData();
  },
  
  // Focar na semana atual
  focusCurrentWeek: () => {
    if (timeline) {
      const weekRange = getCurrentWeekRange();
      timeline.setWindow(weekRange.start, weekRange.end);
      console.log('📅 Foco na semana atual aplicado');
    }
  },
  
  // Estatísticas gerais
  getStats: () => {
    const uniqueTasks = new Map();
    allData.forEach(item => {
      if (item.TaskID) uniqueTasks.set(item.TaskID, item);
    });
    
    return {
      totalRecords: allData.length,
      uniqueTasks: uniqueTasks.size,
      duplicates: allData.length - uniqueTasks.size,
      clients: [...new Set(allData.map(item => item.ClientNickname))].filter(Boolean).length,
      owners: [...new Set(allData.map(item => item.TaskOwnerDisplayName))].filter(Boolean).length,
      hasTimeline: !!timeline,
      currentZoom: zoomLevels[currentZoomLevel].name
    };
  }
};

console.log('🎨 Suno United Creators Dashboard - VERSÃO CORRIGIDA carregado!');
console.log('🔧 Debug: window.sunoDebug para análise');
console.log('🔧 Teste: window.sunoDebug.useExampleData()');
console.log('🔧 Foco: window.sunoDebug.focusCurrentWeek()');