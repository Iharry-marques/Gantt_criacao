import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";               // aqui sim
import "frappe-gantt/dist/frappe-gantt.css";

export default function GanttTimeline({ tasks, zoomLevel }) {
  const el = useRef(null);

  useEffect(() => {
    if (!el.current) return;

    // destrói instância anterior se existir
    el.current.innerHTML = "";

    // cria o gráfico
    new Gantt(el.current, tasks, {
      view_mode: zoomLevels[zoomLevel].scale,
      step:      zoomLevels[zoomLevel].step,
      language:  "pt-br",
    });
  }, [tasks, zoomLevel]);

  return <div ref={el} />;
}

export default function App() {
  // Estado das abas
  const [activeTab, setActiveTab] = useState("tarefas");
  // Estado dos filtros
  const [clientFilter, setClientFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  // Estado dos dados
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Estado do zoom
  const [zoomLevel, setZoomLevel] = useState(2); // 0=Horas, 1=Dias, 2=Semanas, 3=Meses

  // Carregar dados do JSON ao iniciar
  useEffect(() => {
    setLoading(true);
    fetch("/dados/dados.json")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar dados.json");
        return res.json();
      })
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Erro ao carregar dados: " + err.message);
        setLoading(false);
      });
  }, []);

  // Gerar opções de filtro dinamicamente
  const clientOptions = [
    "Todos",
    ...Array.from(new Set(tasks.map((t) => t.ClientNickname).filter(Boolean)))
  ];
  const ownerOptions = [
    "Todos",
    ...Array.from(new Set(tasks.map((t) => t.TaskOwnerDisplayName).filter(Boolean)))
  ];

  // Filtrar tarefas conforme seleção
  const filteredTasks = tasks.filter((t) => {
    if (clientFilter && t.ClientNickname !== clientFilter) return false;
    if (ownerFilter && t.TaskOwnerDisplayName !== ownerFilter) return false;
    return true;
  });

  // Funções de zoom
  const handleZoomIn = () => {
    if (zoomLevel > 0) setZoomLevel(zoomLevel - 1);
  };
  const handleZoomOut = () => {
    if (zoomLevel < zoomLevels.length - 1) setZoomLevel(zoomLevel + 1);
  };

  return (
    <>
      {/* HEADER ULTRA COMPACTO */}
      <div className="header">
        <div className="header-content">
          {/* Logo e informações */}
          <div className="header-info">
            <div className="logo">S</div>
            <div>
              <h1>Dashboard de Tarefas</h1>
              <p>Suno United Creators</p>
            </div>
          </div>
          {/* Controles de visualização do Gantt */}
          <div className="gantt-controls">
            <div className="view-controls">
              <span className="view-label">Zoom:</span>
              <button className="zoom-btn" id="zoom-out" title="Diminuir zoom" onClick={handleZoomOut} disabled={zoomLevel === zoomLevels.length - 1}>-</button>
              <span className="current-view" id="current-view">{zoomLevels[zoomLevel].name}</span>
              <button className="zoom-btn" id="zoom-in" title="Aumentar zoom" onClick={handleZoomIn} disabled={zoomLevel === 0}>+</button>
            </div>
          </div>
          {/* Legenda Elegante Atualizada */}
          <div className="legend">
            <div className="legend-item">
              <div className="legend-color tarefa"></div>
              <span>📋 Tarefa Principal</span>
            </div>
            <div className="legend-item">
              <div className="legend-color subtarefa"></div>
              <span>├─ Subtarefa</span>
            </div>
          </div>
          {/* Estatísticas */}
          <div className="header-stats">
            <div className="stat-item">
              <div className="stat-number" id="total-tasks">{tasks.length}</div>
              <div className="stat-label">Tarefas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" id="active-projects">{[...new Set(tasks.map(t => t.JobNumber).filter(Boolean))].length}</div>
              <div className="stat-label">Projetos</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER PRINCIPAL */}
      <div className="container">
        {/* Navegação ultra compacta */}
        <nav className="nav-tabs">
          <button
            className={"nav-tab" + (activeTab === "tarefas" ? " active" : "")}
            data-tab="tarefas"
            onClick={() => setActiveTab("tarefas")}
          >
            🔨 Tarefas
          </button>
          <button
            className={"nav-tab" + (activeTab === "projetos" ? " active" : "")}
            data-tab="projetos"
            onClick={() => setActiveTab("projetos")}
            disabled
          >
            📋 Projetos
          </button>
          <button
            className={"nav-tab" + (activeTab === "kanban" ? " active" : "")}
            data-tab="kanban"
            onClick={() => setActiveTab("kanban")}
            disabled
          >
            📊 Kanban
          </button>
        </nav>

        {/* Conteúdo das abas */}
        <div className="tab-content">
          {/* Aba Tarefas */}
          <div className={"tab-pane" + (activeTab === "tarefas" ? " active" : "") } id="tarefas">
            {/* Filtros ultra compactos */}
            <div className="filters-section">
              <div className="filters-title">Filtros</div>
              <div className="filter-group">
                <div className="filter-item">
                  <label className="filter-label">Cliente:</label>
                  <select
                    className="filter-select"
                    id="clientFilter"
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
                  >
                    {clientOptions.map(opt => (
                      <option key={opt} value={opt === "Todos" ? "" : opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-item">
                  <label className="filter-label">Responsável:</label>
                  <select
                    className="filter-select"
                    id="ownerFilter"
                    value={ownerFilter}
                    onChange={e => setOwnerFilter(e.target.value)}
                  >
                    {ownerOptions.map(opt => (
                      <option key={opt} value={opt === "Todos" ? "" : opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Estados de carregamento e erro */}
            {error && <div className="error">{error}</div>}
            {loading && <div className="loading">Carregando dados...</div>}
            {/* GanttTimeline com zoomLevel */}
            {!loading && !error && (
              <GanttTimeline tasks={filteredTasks} zoomLevel={zoomLevel} />
            )}
          </div>
          {/* Aba Projetos */}
          <div className={"tab-pane" + (activeTab === "projetos" ? " active" : "") } id="projetos">
            <div className="coming-soon">
              <h2>Projetos</h2>
              <p>Esta funcionalidade será implementada em breve.</p>
              <span className="coming-soon-badge">Em Desenvolvimento</span>
            </div>
          </div>
          {/* Aba Kanban */}
          <div className={"tab-pane" + (activeTab === "kanban" ? " active" : "") } id="kanban">
            <div className="coming-soon">
              <h2>Kanban</h2>
              <p>Esta funcionalidade será implementada em breve.</p>
              <span className="coming-soon-badge">Em Desenvolvimento</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
