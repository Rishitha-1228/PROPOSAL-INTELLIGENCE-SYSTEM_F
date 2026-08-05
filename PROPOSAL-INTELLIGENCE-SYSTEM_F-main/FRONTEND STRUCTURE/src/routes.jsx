// Shared stage definitions used by Sidebar and App
export const STAGES = [
  { id: "intake",       label: "New Opportunity",    icon: "ti-file-plus",   desc: "Capture & interpret brief" },
  { id: "questions",   label: "Decision Questions", icon: "ti-help-circle", desc: "Pre-design clarity" },
  { id: "mapping",     label: "Competency Mapping", icon: "ti-sitemap",     desc: "Needs → modules" },
  { id: "architecture",label: "Architecture Builder",icon: "ti-layout-grid", desc: "Learning journey design" },
  { id: "approach",    label: "Approach Note",      icon: "ti-notes",       desc: "Client-facing narrative" },
  { id: "score",       label: "Proposal Score",     icon: "ti-chart-bar",   desc: "Strength evaluation" },
];
<Route path="/architecture" element={<ArchitectureStage />} />

