export default function ArtDashboard() {
  const menu = ["Dashboard", "Students", "Attendance", "Results", "Fees", "Messages"];

  return (
    <div className="handoff-dashboard" role="img" aria-label="Illustration of the EduMyles school dashboard">
      <div className="handoff-browser-bar">
        <i /><i /><i />
        <span>your-school.edumyles.com</span>
      </div>
      <div className="handoff-dashboard-body">
        <aside className="handoff-sidebar">
          <div className="handoff-school"><b>SA</b><span>Sample Academy</span></div>
          {menu.map((item, index) => (
            <div className={`handoff-menu-item${index === 0 ? " selected" : ""}`} key={item}>
              <i />{item}
            </div>
          ))}
        </aside>
        <div className="handoff-dashboard-content">
          <div className="handoff-dashboard-heading"><strong>School dashboard</strong><span>All clear</span></div>
          <div className="handoff-metrics">
            {[["Fees collected", "70%"], ["Attendance", "55%"], ["Results ready", "40%"]].map(([label, width], index) => (
              <div className="handoff-metric" key={label}>
                <small>{label}</small><i style={{ width, background: ["#276b61", "#7cc8ba", "#e8a317"][index] }} />
              </div>
            ))}
          </div>
          <div className="handoff-dashboard-panels">
            <div className="handoff-chart"><strong>Fee collection by week</strong><div>{[45, 64, 52, 82, 70, 94].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
            <div className="handoff-payments"><strong>M-Pesa payments</strong><span><i />Confirmed</span><span><i />Pending</span><span><i />Confirmed</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
